const { EmbedBuilder } = require('discord.js');
const { localParts, previousWeekKey } = require('../utils/valtime');
const { grantAchievement, formatUnlocked } = require('../utils/valachievements');
const {
    getAllValorantChannels,
    getAllValorantLinks,
    getWeekStats,
    getWeeklyPosted,
    setWeeklyPosted,
    addCredits
} = require('../utils/db');

const CHECK_INTERVAL = 15 * 60 * 1000;
// El resumen de la semana anterior sale el lunes a partir de esta hora
const PUBLISH_HOUR = 12;
const WEEK_PRIZE = 200;
const MIN_GAMES_WINRATE = 3;
const COLORS = { PRIMARY: '#ff4655' };

let running = false;

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        setInterval(() => checkWeekly(client), CHECK_INTERVAL);
        checkWeekly(client);
    }
};

async function checkWeekly(client) {
    if (running) return;
    running = true;

    try {
        const { weekday, hour } = localParts();
        if (weekday === 1 && hour < PUBLISH_HOUR) return;

        const week = previousWeekKey();
        if (await getWeeklyPosted() === week) return;
        await setWeeklyPosted(week);

        const links = await getAllValorantLinks();
        const prized = new Set();

        for (const { guildId, channelId } of await getAllValorantChannels('partidas')) {
            const guild = client.guilds.cache.get(guildId);
            const channel = guild?.channels.cache.get(channelId);
            if (!channel) continue;

            const players = [];
            for (const link of links) {
                const stats = await getWeekStats(week, link.userId);
                if (!stats?.games) continue;
                const member = await guild.members.fetch(link.userId).catch(() => null);
                if (member) players.push({ member, userId: link.userId, stats });
            }
            if (!players.length) continue;

            const message = await buildSummary(players, week, prized);
            await channel.send(message)
                .catch(error => console.error(`No se pudo publicar el resumen semanal en ${channelId}:`, error.message));
        }
    } catch (error) {
        console.error('Error en el resumen semanal de Valorant:', error);
    } finally {
        running = false;
    }
}

function best(players, score, filter = () => true) {
    const candidates = players.filter(filter);
    if (!candidates.length) return null;
    return candidates.reduce((top, p) => score(p) > score(top) ? p : top);
}

function signed(value) {
    return `${value >= 0 ? '+' : ''}${value}`;
}

async function buildSummary(players, week, prized) {
    const topRR = best(players, p => p.stats.rr, p => p.stats.rr > 0);
    const mostGames = best(players, p => p.stats.games);
    const bestWinrate = best(players, p => p.stats.wins / p.stats.games, p => p.stats.games >= MIN_GAMES_WINRATE);
    const bestGame = best(players, p => p.stats.bestKills, p => p.stats.bestKills > 0);
    const worstRR = best(players, p => -p.stats.rr, p => p.stats.rr < 0);

    const awards = [];
    if (topRR) awards.push(`👑 **Jugador de la semana:** ${topRR.member} · ${signed(topRR.stats.rr)} RR`);
    if (mostGames) awards.push(`🎮 **El más viciado:** ${mostGames.member} · ${mostGames.stats.games} partidas`);
    if (bestWinrate) {
        const rate = Math.round(bestWinrate.stats.wins / bestWinrate.stats.games * 100);
        awards.push(`🏆 **Mejor winrate:** ${bestWinrate.member} · ${rate}% (${bestWinrate.stats.wins}/${bestWinrate.stats.games})`);
    }
    if (bestGame) awards.push(`💀 **Mejor partida:** ${bestGame.member} · ${bestGame.stats.bestKills} kills${bestGame.stats.bestKillsMap ? ` en ${bestGame.stats.bestKillsMap}` : ''}`);
    if (worstRR) awards.push(`📉 **El que más sufrió:** ${worstRR.member} · ${signed(worstRR.stats.rr)} RR`);

    const extra = [];
    // Premio para el jugador de la semana (una sola vez aunque este en varios servidores)
    if (topRR && !prized.has(topRR.userId)) {
        prized.add(topRR.userId);
        await addCredits(topRR.userId, WEEK_PRIZE);
        extra.push(`💰 ${topRR.member} gana **${WEEK_PRIZE} créditos** por ser el jugador de la semana.`);
        extra.push(...formatUnlocked(await grantAchievement(topRR.userId, 'jugador_semana')));
    }

    const ranking = [...players]
        .sort((a, b) => b.stats.rr - a.stats.rr)
        .slice(0, 10)
        .map((p, i) => `**${i + 1}.** ${p.member} · ${signed(p.stats.rr)} RR · ${p.stats.wins}V ${p.stats.losses}D`);

    const totalGames = players.reduce((sum, p) => sum + p.stats.games, 0);

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`📅 Resumen semanal · semana del ${week}`)
        .setDescription([...awards, '', ...extra].join('\n').trim())
        .addFields({ name: 'RR de la semana', value: ranking.join('\n') })
        .setFooter({ text: `Entre todos jugaron ${totalGames} competitivas` });

    const mentions = topRR ? [topRR.userId] : [];
    return { embeds: [embed], allowedMentions: { users: mentions } };
}
