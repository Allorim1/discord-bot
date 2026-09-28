const { getAccount, getMMRByPuuid, getStoredMatches, summarizeStoredMatches } = require('./valorant');

const MATCHES = 20;

// target: { name, tag } escrito o un link guardado { puuid, name, tag, region }
async function loadPlayerStats(target) {
    const account = target.puuid ? target : await getAccount(target.name, target.tag);
    const [mmr, matches] = await Promise.all([
        getMMRByPuuid(account.region, account.puuid).catch(() => null),
        getStoredMatches(account.region, account.puuid, 'competitive', MATCHES)
    ]);
    return { account, mmr, summary: summarizeStoredMatches(matches) };
}

function topAgents(summary, count = 3) {
    return Object.entries(summary.agents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count);
}

// Mejor y peor mapa (con al menos 2 partidas jugadas)
function bestAndWorstMap(summary) {
    const maps = Object.entries(summary.maps)
        .filter(([, m]) => m.games >= 2)
        .map(([name, m]) => ({ name, games: m.games, winrate: Math.round(m.wins / m.games * 100) }))
        .sort((a, b) => b.winrate - a.winrate);
    if (maps.length < 2) return { best: null, worst: null };
    return { best: maps[0], worst: maps[maps.length - 1] };
}

module.exports = {
    MATCHES,
    loadPlayerStats,
    topAgents,
    bestAndWorstMap
};
