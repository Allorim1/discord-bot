const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMaps, translateRank } = require('../utils/valorant');
const { getValorantRank } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

module.exports = {
    name: 'equipos',
    description: 'Dividir a los del canal de voz en 2 equipos y sortear un mapa',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('equipos')
        .setDescription('Dividir a los del canal de voz en 2 equipos y sortear un mapa')
        .setDMPermission(false)
        .addBooleanOption(option =>
            option.setName('balancear')
                .setDescription('Equilibrar los equipos segun el rango (por defecto si)')),

    async execute(context, args = []) {
        const voiceChannel = context.member?.voice?.channel;
        if (!voiceChannel) return warning('Tienes que estar en un canal de voz.');

        const members = [...voiceChannel.members.values()].filter(m => !m.user.bot);
        if (members.length < 2) return warning('Se necesitan al menos 2 personas en el canal de voz.');

        const balance = context.options?.getBoolean?.('balancear') ?? args[0] !== 'random';
        const players = await Promise.all(members.map(async member => ({
            member,
            rank: await getValorantRank(member.id)
        })));

        const ranked = players.filter(p => p.rank?.elo);
        const useRanks = balance && ranked.length >= players.length / 2;
        const [teamA, teamB] = useRanks ? balancedTeams(players, ranked) : randomTeams(players);

        const maps = await getMaps().catch(() => []);
        const map = maps.length ? maps[Math.floor(Math.random() * maps.length)] : null;

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Equipos')
            .addFields(
                { name: `🟥 Atacantes${useRanks ? ` · ${averageRank(teamA)}` : ''}`, value: formatTeam(teamA), inline: true },
                { name: `🟦 Defensores${useRanks ? ` · ${averageRank(teamB)}` : ''}`, value: formatTeam(teamB), inline: true }
            )
            .setFooter({ text: useRanks ? 'Equilibrados por rango' : 'Sorteados al azar' });

        if (map) {
            embed.setDescription(`🗺️ Mapa: **${map.displayName}**`);
            embed.setImage(map.splash);
        }

        return { embeds: [embed], allowedMentions: { parse: [] } };
    }
};

// Primero se reparten los que tienen rango (cada uno al equipo con menos elo),
// despues los que no tienen rango completan los lugares libres al azar
function balancedTeams(players, ranked) {
    const sizes = [Math.ceil(players.length / 2), Math.floor(players.length / 2)];
    const teams = [[], []];
    const totals = [0, 0];

    const sorted = [...ranked].sort((a, b) => b.rank.elo - a.rank.elo);
    for (const player of sorted) {
        let index = totals[0] <= totals[1] ? 0 : 1;
        if (teams[index].length >= sizes[index]) index = 1 - index;
        teams[index].push(player);
        totals[index] += player.rank.elo;
    }

    for (const player of shuffle(players.filter(p => !ranked.includes(p)))) {
        const index = teams[0].length < sizes[0] && (teams[0].length <= teams[1].length || teams[1].length >= sizes[1]) ? 0 : 1;
        teams[index].push(player);
    }
    return teams;
}

function randomTeams(players) {
    const shuffled = shuffle(players);
    const half = Math.ceil(shuffled.length / 2);
    return [shuffled.slice(0, half), shuffled.slice(half)];
}

function formatTeam(team) {
    return team.map(p => `${p.member} · ${p.rank ? translateRank(p.rank.rank) : '?'}`).join('\n') || '-';
}

function averageRank(team) {
    const ranked = team.filter(p => p.rank?.elo);
    if (!ranked.length) return '?';
    const closest = ranked.reduce((best, p) => {
        const avg = ranked.reduce((sum, x) => sum + x.rank.elo, 0) / ranked.length;
        return Math.abs(p.rank.elo - avg) < Math.abs(best.rank.elo - avg) ? p : best;
    });
    return `~${translateRank(closest.rank.rank)}`;
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
