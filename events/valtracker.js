const { getMMRHistoryByPuuid, getMatch, ValorantApiError } = require('../utils/valorant');
const { buildMatchEmbed } = require('../utils/valmatch');
const {
    getAllValorantLinks,
    getAllValorantChannels,
    getValorantLastMatch,
    setValorantLastMatch
} = require('../utils/db');

// Cada cuanto se revisan las partidas de los usuarios vinculados
const POLL_INTERVAL = (Number(process.env.VALORANT_POLL_MINUTES) || 5) * 60 * 1000;
// Pausa entre jugadores para no pasar el limite de la API (30 consultas/min con la key basica)
const DELAY_BETWEEN_PLAYERS = 2500;
// No avisar partidas mas viejas que esto (ej. si el bot estuvo apagado)
const MAX_MATCH_AGE = 3 * 60 * 60 * 1000;

// Evita avisar dos veces la misma partida si juegan juntos varios vinculados
const announced = new Set();
let running = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'ready',
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
        const channels = await getAllValorantChannels();
        if (!channels.length) return;

        for (const link of await getAllValorantLinks()) {
            const targets = await findTargetChannels(client, channels, link.userId);
            if (!targets.length) continue;

            try {
                await checkPlayer(link, targets);
            } catch (error) {
                if (error instanceof ValorantApiError && error.message.includes('Demasiadas')) {
                    console.log('Limite de la API de Valorant alcanzado, se reintenta en la siguiente vuelta.');
                    break;
                }
                console.error(`Error revisando partidas de ${link.name}#${link.tag}:`, error.message);
            }

            await sleep(DELAY_BETWEEN_PLAYERS);
        }
    } catch (error) {
        console.error('Error en el rastreador de Valorant:', error);
    } finally {
        running = false;
    }
}

// Canales de avisos de los servidores donde esta el usuario
async function findTargetChannels(client, channels, userId) {
    const targets = [];
    for (const { guildId, channelId } of channels) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(userId).catch(() => null);
        const channel = guild.channels.cache.get(channelId);
        if (member && channel) targets.push({ guildId, channel, member });
    }
    return targets;
}

async function checkPlayer(link, targets) {
    const history = await getMMRHistoryByPuuid(link.region, link.puuid);
    const latest = history?.[0];
    if (!latest?.match_id) return;

    const lastSeen = await getValorantLastMatch(link.userId);
    if (lastSeen === latest.match_id) return;
    await setValorantLastMatch(link.userId, latest.match_id);

    // La primera vez solo se guarda la partida, para no avisar partidas viejas al vincular
    if (!lastSeen) return;
    if (latest.date_raw && Date.now() - latest.date_raw * 1000 > MAX_MATCH_AGE) return;

    const pending = targets.filter(t => !announced.has(`${t.guildId}:${latest.match_id}`));
    if (!pending.length) return;

    const match = await getMatch(latest.match_id);
    const embed = await buildMatchEmbed(match, link.puuid, latest.mmr_change_to_last_game);

    for (const { guildId, channel, member } of pending) {
        announced.add(`${guildId}:${latest.match_id}`);
        await channel.send({
            content: `🎮 **${member.displayName}** terminó una partida competitiva`,
            embeds: [embed]
        }).catch(error => console.error(`No se pudo avisar en ${channel.id}:`, error.message));
    }

    if (announced.size > 1000) announced.clear();
}
