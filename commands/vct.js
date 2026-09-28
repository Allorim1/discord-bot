const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEsportsSchedule, getVlrEvents, getVlrEventMatches, normalize, ValorantApiError } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
const CACHE_TTL = 10 * 60 * 1000;
const UPCOMING = 8;
const RECENT = 5;
// Con la fuente v2 hay que pedir los partidos evento por evento
const MAX_VLR_EVENTS = 3;
// Un partido sin ganador que empezo hace menos de esto se considera en vivo
const LIVE_WINDOW = 4 * 60 * 60 * 1000;

let cache = null;

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
            schedule = await getSchedule(filter);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        const matches = schedule.matches.filter(m => !filter || normalize(m.league).includes(filter));

        const upcoming = matches
            .filter(m => m.state !== 'completed')
            .sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity))
            .slice(0, UPCOMING);

        const recent = matches
            .filter(m => m.state === 'completed')
            .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
            .slice(0, RECENT);

        if (!upcoming.length && !recent.length) {
            return warning(filter ? 'No encontré partidos para esa liga.' : 'No hay partidos disponibles ahora.');
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🏆 Esports de Valorant')
            .setFooter({ text: `Fuente: ${schedule.source}` });

        if (upcoming.length) embed.addFields({ name: 'Próximos', value: upcoming.map(formatUpcoming).join('\n').slice(0, 1024) });
        if (recent.length) embed.addFields({ name: 'Resultados', value: recent.map(formatResult).join('\n').slice(0, 1024) });

        return { embeds: [embed] };
    }
};

// Devuelve { source, matches: [{ state, date, league, bestOf, teams: [{ name, score, won }] }] }
async function getSchedule(filter) {
    const cacheKey = `v1|${filter}`;
    if (cache?.v1 && Date.now() - cache.time < CACHE_TTL) return cache.v1;
    if (cache?.[cacheKey] && Date.now() - cache.time < CACHE_TTL) return cache[cacheKey];

    let result;
    try {
        result = { source: 'Riot esports', matches: fromV1(await getEsportsSchedule()) };
        cache = { v1: result, time: Date.now() };
    } catch (error) {
        if (!(error instanceof ValorantApiError)) throw error;
        // El calendario v1 falla a veces: usar los datos de vlr.gg
        result = { source: 'vlr.gg', matches: await fromVlr(filter) };
        cache = { [cacheKey]: result, time: Date.now() };
    }
    return result;
}

function toTime(date) {
    const time = date ? new Date(date).getTime() : NaN;
    return Number.isNaN(time) ? null : time;
}

function fromV1(schedule) {
    return (schedule || [])
        .filter(e => e.match?.teams?.length === 2)
        .map(e => ({
            state: e.state === 'completed' ? 'completed' : (e.state === 'inProgress' ? 'live' : 'upcoming'),
            date: toTime(e.date),
            league: [e.league?.name, e.league?.region, e.tournament?.name].filter(Boolean).join(' · '),
            bestOf: e.match.game_type?.count || null,
            teams: e.match.teams.map(t => ({ name: t.name, score: t.game_wins, won: t.has_won }))
        }));
}

async function fromVlr(filter) {
    const events = (await getVlrEvents('upcoming') || [])
        .filter(e => e.status === 'ongoing' || e.status === 'upcoming')
        .filter(e => !filter || normalize(`${e.title} ${e.region}`).includes(filter))
        .sort((a, b) => (a.status === 'ongoing' ? 0 : 1) - (b.status === 'ongoing' ? 0 : 1))
        .slice(0, MAX_VLR_EVENTS);

    const matches = [];
    for (const event of events) {
        const eventMatches = await getVlrEventMatches(event.id).catch(() => []);
        for (const m of eventMatches || []) {
            if (m.teams?.length !== 2) continue;
            const date = toTime(m.date);
            const completed = m.teams.some(t => t.is_winner);
            const live = !completed && date && date <= Date.now() && Date.now() - date < LIVE_WINDOW;
            matches.push({
                state: completed ? 'completed' : (live ? 'live' : 'upcoming'),
                date,
                league: [event.title, m.series].filter(Boolean).join(' · '),
                bestOf: null,
                teams: m.teams.map(t => ({ name: t.name, score: t.score, won: t.is_winner }))
            });
        }
    }
    return matches;
}

function when(match) {
    return match.date ? `<t:${Math.floor(match.date / 1000)}:R>` : 'Por definir';
}

function formatUpcoming(match) {
    const [a, b] = match.teams;
    const live = match.state === 'live' ? '🔴 **EN VIVO** ' : '';
    const bestOf = match.bestOf ? ` · Bo${match.bestOf}` : '';
    return `${live}${when(match)} **${a.name}** vs **${b.name}**\n-# ${match.league}${bestOf}`;
}

function formatResult(match) {
    const [a, b] = match.teams;
    const nameA = a.won ? `**${a.name}**` : a.name;
    const nameB = b.won ? `**${b.name}**` : b.name;
    const date = match.date ? ` · <t:${Math.floor(match.date / 1000)}:d>` : '';
    return `${nameA} ${a.score ?? '?'}-${b.score ?? '?'} ${nameB}\n-# ${match.league}${date}`;
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
