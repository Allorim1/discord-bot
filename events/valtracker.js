const { getMMRHistoryByPuuid, getMatch, translateRank, ValorantApiError } = require('../utils/valorant');
const { buildMatchEmbed } = require('../utils/valmatch');
const { syncMemberRankRole } = require('../utils/valroles');
const { resolveBets, refundExpiredBets } = require('../utils/valbets');
const { checkRankAchievements, checkMatchAchievements, formatUnlocked } = require('../utils/valachievements');
const { weekKey } = require('../utils/valtime');
const {
    getAllValorantLinks,
    getAllValorantChannels,
    getAllValorantRoles,
    getValorantLastMatch,
    setValorantLastMatch,
    getValorantRank,
    setValorantRank,
    getAllBets,
    getWeekStats,
    setWeekStats
} = require('../utils/db');

// Cada cuanto se revisan las partidas de los usuarios vinculados
const POLL_INTERVAL = (Number(process.env.VALORANT_POLL_MINUTES) || 5) * 60 * 1000;
// Pausa entre jugadores para no pasar el limite de la API (30 consultas/min con la key basica)
const DELAY_BETWEEN_PLAYERS = 2500;
// No avisar partidas mas viejas que esto (ej. si el bot estuvo apagado)
const MAX_MATCH_AGE = 3 * 60 * 60 * 1000;
// Logros que se destacan en el aviso
const STREAK_MIN = 3;
const KILLS_MIN = 30;

// Evita avisar dos veces la misma partida si juegan juntos varios vinculados
const announced = new Set();
let running = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        if (!process.env.HENRIK_API_KEY) {
            console.log('HENRIK_API_KEY no configurada: avisos de partidas de Valorant desactivados.');
            return;
        }
        setInterval(() => checkAllPlayers(client), POLL_INTERVAL);
        checkAllPlayers(client);
    }
};

async function checkAllPlayers(client) {
    if (running) return;
    running = true;

    try {
        const config = {
            channels: await getAllValorantChannels('partidas'),
            roles: await getAllValorantRoles()
        };

        for (const link of await getAllValorantLinks()) {
            try {
                const memberships = await findMemberships(client, config, link.userId);
                await checkPlayer(client, link, memberships);
            } catch (error) {
                if (error instanceof ValorantApiError && error.message.includes('Demasiadas')) {
                    console.log('Limite de la API de Valorant alcanzado, se reintenta en la siguiente vuelta.');
                    break;
                }
                console.error(`Error revisando partidas de ${link.name}#${link.tag}:`, error.message);
            }

            await sleep(DELAY_BETWEEN_PLAYERS);
        }

        await refundExpiredBets(client);
    } catch (error) {
        console.error('Error en el rastreador de Valorant:', error);
    } finally {
        running = false;
    }
}

// Servidores configurados donde esta el usuario, con su canal de avisos y/o roles de rango
async function findMemberships(client, config, userId) {
    const guildIds = new Set([...config.channels.map(c => c.guildId), ...Object.keys(config.roles)]);
    const memberships = [];

    for (const guildId of guildIds) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        const channelId = config.channels.find(c => c.guildId === guildId)?.channelId;
        memberships.push({
            guildId,
            member,
            channel: channelId ? guild.channels.cache.get(channelId) : null,
            roles: config.roles[guildId] || null
        });
    }
    return memberships;
}

async function checkPlayer(client, link, memberships) {
    const history = await getMMRHistoryByPuuid(link.region, link.puuid);
    const latest = history?.[0];
    if (!latest?.match_id) return;

    // Rango actual: se usa en /valtop, /equipos y los roles
    const previousRank = await getValorantRank(link.userId);
    const rank = {
        tier: latest.currenttier,
        rank: latest.currenttierpatched,
        rr: latest.ranking_in_tier,
        elo: latest.elo,
        updatedAt: Date.now()
    };
    await setValorantRank(link.userId, rank);

    for (const { member, roles } of memberships) {
        if (!roles) continue;
        await syncMemberRankRole(member, roles, rank)
            .catch(error => console.error(`No se pudo actualizar el rol de ${member.user.tag}:`, error.message));
    }

    const lastSeen = await getValorantLastMatch(link.userId);
    if (lastSeen === latest.match_id) return;
    await setValorantLastMatch(link.userId, latest.match_id);

    // La primera vez solo se guarda la partida, para no avisar partidas viejas al vincular.
    // Los logros de rango se otorgan en silencio (ej. alguien que ya era Diamante al vincular)
    if (!lastSeen) {
        await checkRankAchievements(link.userId, rank);
        return;
    }
    if (latest.date_raw && Date.now() - latest.date_raw * 1000 > MAX_MATCH_AGE) return;

    const match = await getMatch(latest.match_id);
    const player = match.players?.all_players?.find(p => p.puuid === link.puuid);
    await recordWeekStats(link.userId, latest, player, match);

    const unlocked = [
        ...await checkRankAchievements(link.userId, rank),
        ...await checkMatchAchievements(link.userId, link.puuid, match, history)
    ];

    const bets = (await getAllBets()).filter(bet => bet.targetUserId === link.userId);
    if (bets.length) await resolveBets(client, bets, link, match);

    const targets = memberships.filter(m => m.channel && !announced.has(`${m.guildId}:${latest.match_id}`));
    if (!targets.length) return;

    const highlights = [...getHighlights(history, previousRank, rank, player), ...formatUnlocked(unlocked)];
    const embed = await buildMatchEmbed(match, link.puuid, latest.mmr_change_to_last_game);

    for (const { guildId, channel, member } of targets) {
        announced.add(`${guildId}:${latest.match_id}`);
        const lines = [`🎮 **${member.displayName}** terminó una partida competitiva`, ...highlights];
        await channel.send({ content: lines.join('\n'), embeds: [embed] })
            .catch(error => console.error(`No se pudo avisar en ${channel.id}:`, error.message));
    }

    if (announced.size > 1000) announced.clear();
}

// Suma la partida a las estadisticas de la semana (para el resumen semanal)
async function recordWeekStats(userId, entry, player, match) {
    const week = weekKey(entry.date_raw ? new Date(entry.date_raw * 1000) : new Date());
    const stats = await getWeekStats(week, userId) || { games: 0, wins: 0, losses: 0, rr: 0, bestKills: 0, bestKillsMap: null };
    const team = match.teams?.[player?.team?.toLowerCase()];

    stats.games++;
    stats.rr += entry.mmr_change_to_last_game || 0;
    if (team?.has_won) stats.wins++;
    else if (team && team.rounds_won !== team.rounds_lost) stats.losses++;

    const kills = player?.stats?.kills || 0;
    if (kills > stats.bestKills) {
        stats.bestKills = kills;
        stats.bestKillsMap = match.metadata?.map || null;
    }

    await setWeekStats(week, userId, stats);
}

// Subida de rango, racha de victorias y partidas con muchas kills
function getHighlights(history, previousRank, rank, player) {
    const highlights = [];

    if (previousRank?.tier && rank.tier > previousRank.tier) {
        highlights.push(`⬆️ ¡Subió a **${translateRank(rank.rank)}**!`);
    }

    let streak = 0;
    for (const entry of history) {
        if (entry.mmr_change_to_last_game > 0) streak++;
        else break;
    }
    if (streak >= STREAK_MIN) highlights.push(`🔥 Racha de **${streak} victorias** seguidas`);

    const kills = player?.stats?.kills || 0;
    if (kills >= KILLS_MIN) highlights.push(`💀 ¡**${kills} kills** en una partida!`);

    return highlights;
}
