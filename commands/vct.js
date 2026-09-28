const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEsportsSchedule, normalize, ValorantApiError } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
const CACHE_TTL = 10 * 60 * 1000;
const UPCOMING = 8;
const RECENT = 5;

let cache = null;

async function getSchedule() {
    if (cache && Date.now() - cache.time < CACHE_TTL) return cache.data;
    const data = await getEsportsSchedule();
    cache = { data: data || [], time: Date.now() };
    return cache.data;
}

module.exports = {
    name: 'vct',
    description: 'Proximos partidos y resultados de esports de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('vct')
        .setDescription('Proximos partidos y resultados de esports de Valorant')
        .addStringOption(option =>
            option.setName('liga')
                .setDescription('Filtrar por liga o region, ej: Americas, Masters, Champions, LATAM')),

    async execute(context, args = []) {
        const filter = normalize(context.options?.getString?.('liga') || args.join(' '));

        if (context.deferReply) await context.deferReply();

        let schedule;
        try {
            schedule = await getSchedule();
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        const events = schedule
            .filter(e => e.match?.teams?.length === 2)
            .filter(e => !filter || normalize(`${e.league?.name} ${e.league?.region} ${e.tournament?.name}`).includes(filter));

        const upcoming = events
            .filter(e => e.state !== 'completed')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, UPCOMING);

        const recent = events
            .filter(e => e.state === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, RECENT);

        if (!upcoming.length && !recent.length) {
            return warning(filter ? 'No encontré partidos para esa liga.' : 'No hay partidos disponibles ahora.');
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🏆 Esports de Valorant');

        if (upcoming.length) embed.addFields({ name: 'Próximos', value: upcoming.map(formatUpcoming).join('\n') });
        if (recent.length) embed.addFields({ name: 'Resultados', value: recent.map(formatResult).join('\n') });

        return { embeds: [embed] };
    }
};

function unix(date) {
    return Math.floor(new Date(date).getTime() / 1000);
}

function formatUpcoming(event) {
    const [a, b] = event.match.teams;
    const live = event.state === 'inProgress' ? '🔴 **EN VIVO** ' : '';
    const bestOf = event.match.game_type?.count ? ` · Bo${event.match.game_type.count}` : '';
    return `${live}<t:${unix(event.date)}:R> **${a.name}** vs **${b.name}**\n-# ${event.league?.name || ''}${bestOf}`;
}

function formatResult(event) {
    const [a, b] = event.match.teams;
    const nameA = a.has_won ? `**${a.name}**` : a.name;
    const nameB = b.has_won ? `**${b.name}**` : b.name;
    return `${nameA} ${a.game_wins ?? '?'}-${b.game_wins ?? '?'} ${nameB}\n-# ${event.league?.name || ''} · <t:${unix(event.date)}:d>`;
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
