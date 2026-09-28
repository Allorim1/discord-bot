const axios = require('axios');

const LANGUAGE = 'es-MX';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = {};

const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant';

// Datos del juego (valorant-api.com, sin API key)

async function fetchCached(key, url, language = LANGUAGE) {
    const cacheKey = `${key}:${language}`;
    const entry = cache[cacheKey];
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;

    const response = await axios.get(url, { params: { language }, timeout: 10000 });
    cache[cacheKey] = { data: response.data.data, time: Date.now() };
    return cache[cacheKey].data;
}

async function getAgents() {
    const agents = await fetchCached('agents', 'https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    return agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function getWeapons(language) {
    const weapons = await fetchCached('weapons', 'https://valorant-api.com/v1/weapons', language);
    // La API a veces trae duplicados con el mismo nombre (ej. Guardian/Guardián)
    const seen = new Set();
    return weapons.filter(w => {
        const key = normalize(w.displayName);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function getMaps() {
    const maps = await fetchCached('maps', 'https://valorant-api.com/v1/maps');
    // Solo mapas de competitivo/no clasificado (los que tienen sitios)
    return maps
        .filter(m => m.tacticalDescription)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function getContentTiers() {
    return fetchCached('contenttiers', 'https://valorant-api.com/v1/contenttiers');
}

// Todas las skins de todas las armas, sin las skins por defecto.
// language: 'en-US' sirve para buscar por el nombre en ingles
async function getSkins(language) {
    const weapons = await getWeapons(language);
    const skins = [];
    for (const weapon of weapons) {
        for (const skin of weapon.skins || []) {
            if (skin.uuid === weapon.defaultSkinUuid || !skin.contentTierUuid) continue;
            skins.push({ ...skin, weaponName: weapon.displayName });
        }
    }
    return skins;
}

// Rangos en orden, del mas bajo al mas alto. El nombre coincide con translateRank()
const RANK_TIERS = [
    { name: 'Hierro', color: '#4f514f' },
    { name: 'Bronce', color: '#a5855d' },
    { name: 'Plata', color: '#bbc2c2' },
    { name: 'Oro', color: '#eccf56' },
    { name: 'Platino', color: '#59a9b6' },
    { name: 'Diamante', color: '#b489c4' },
    { name: 'Ascendente', color: '#6ae2af' },
    { name: 'Inmortal', color: '#bb3d65' },
    { name: 'Radiante', color: '#ffffaa' }
];

// "Oro 2" -> "Oro"
function rankTierName(rank) {
    return translateRank(rank).split(' ')[0];
}

function normalize(text) {
    return String(text)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase();
}

function findByName(list, query) {
    const q = normalize(query);
    if (!q) return null;
    return list.find(item => normalize(item.displayName) === q)
        || list.find(item => normalize(item.displayName).startsWith(q))
        || list.find(item => normalize(item.displayName).includes(q))
        || null;
}

const ABILITY_SLOTS = {
    Ability1: 'Q',
    Ability2: 'E',
    Grenade: 'C',
    Ultimate: 'X',
    Passive: 'Pasiva'
};

function weaponCategory(weapon) {
    return weapon.shopData?.categoryText || 'Cuerpo a cuerpo';
}

// Stats de jugador (HenrikDev API, requiere HENRIK_API_KEY en .env)

class ValorantApiError extends Error {}

async function henrikGet(path, params) {
    const response = await henrikRequest(path, { params });
    return response.data.data;
}

async function henrikRequest(path, { params, responseType, notFound } = {}) {
    const key = process.env.HENRIK_API_KEY;
    if (!key) throw new ValorantApiError('Falta configurar `HENRIK_API_KEY` en el archivo .env del bot.');

    try {
        return await axios.get(`${HENRIK_BASE}${path}`, {
            headers: { Authorization: key },
            params,
            responseType,
            timeout: 15000
        });
    } catch (error) {
        const status = error.response?.status;
        if (status === 404) throw new ValorantApiError(notFound || 'No se encontró ese jugador o no tiene partidas recientes.');
        if (status === 400 && notFound) throw new ValorantApiError(notFound);
        if (status === 429) throw new ValorantApiError('Demasiadas consultas, intenta de nuevo en un minuto.');
        if (status === 401 || status === 403) throw new ValorantApiError('La `HENRIK_API_KEY` no es válida.');
        throw new ValorantApiError('No se pudo conectar con la API de Valorant. Intenta más tarde.');
    }
}

function parseRiotId(text) {
    const match = String(text || '').trim().match(/^(.{3,16})#([^#\s]{3,5})$/);
    if (!match) return null;
    return { name: match[1].trim(), tag: match[2] };
}

async function getAccount(name, tag) {
    return henrikGet(`/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

// Sigue funcionando aunque el jugador cambie su nombre o tag
async function getAccountByPuuid(puuid) {
    return henrikGet(`/v1/by-puuid/account/${puuid}`);
}

async function getMMR(region, name, tag) {
    return henrikGet(`/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

async function getMMRByPuuid(region, puuid) {
    return henrikGet(`/v2/by-puuid/mmr/${region}/${puuid}`);
}

async function getRecentMatches(region, name, tag, size = 5) {
    return henrikGet(`/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, {
        mode: 'competitive',
        size
    });
}

async function getMatchesByPuuid(region, puuid, mode = 'competitive', size = 1) {
    return henrikGet(`/v3/by-puuid/matches/${region}/${puuid}`, { mode, size });
}

async function getMMRHistoryByPuuid(region, puuid) {
    return henrikGet(`/v1/by-puuid/mmr-history/${region}/${puuid}`);
}

async function getMatch(matchId) {
    return henrikGet(`/v2/match/${matchId}`);
}

// Version resumida de las partidas: permite traer 20 en una sola consulta
async function getStoredMatches(region, puuid, mode = 'competitive', size = 20) {
    return henrikGet(`/v1/by-puuid/stored-matches/${region}/${puuid}`, { mode, size });
}

// Devuelve un Buffer PNG con la mira
async function getCrosshairImage(code) {
    const response = await henrikRequest('/v1/crosshair/generate', {
        params: { id: code },
        responseType: 'arraybuffer',
        notFound: 'Ese código de mira no es válido.'
    });
    return Buffer.from(response.data);
}

async function getNews() {
    return henrikGet('/v1/website/es-mx');
}

async function getServerStatus(region) {
    return henrikGet(`/v1/status/${region}`);
}

async function getEsportsSchedule() {
    return henrikGet('/v1/esports/schedule');
}

// Resumen de las ultimas partidas guardadas de un jugador
function summarizeStoredMatches(matches) {
    const summary = {
        games: 0, wins: 0, kills: 0, deaths: 0, assists: 0,
        head: 0, body: 0, leg: 0, damage: 0, rounds: 0, score: 0,
        agents: {}, maps: {}
    };

    for (const match of matches || []) {
        const stats = match.stats;
        if (!stats) continue;

        const myTeam = stats.team?.toLowerCase();
        const otherTeam = myTeam === 'red' ? 'blue' : 'red';
        const won = (match.teams?.[myTeam] ?? 0) > (match.teams?.[otherTeam] ?? 0);
        const rounds = (match.teams?.red ?? 0) + (match.teams?.blue ?? 0);

        summary.games++;
        if (won) summary.wins++;
        summary.kills += stats.kills || 0;
        summary.deaths += stats.deaths || 0;
        summary.assists += stats.assists || 0;
        summary.head += stats.shots?.head || 0;
        summary.body += stats.shots?.body || 0;
        summary.leg += stats.shots?.leg || 0;
        summary.damage += stats.damage?.made || 0;
        summary.score += stats.score || 0;
        summary.rounds += rounds;

        const agent = stats.character?.name || '?';
        summary.agents[agent] = (summary.agents[agent] || 0) + 1;

        const map = match.meta?.map?.name || '?';
        const mapStats = summary.maps[map] ||= { games: 0, wins: 0 };
        mapStats.games++;
        if (won) mapStats.wins++;
    }

    const shots = summary.head + summary.body + summary.leg;
    summary.winrate = summary.games ? Math.round(summary.wins / summary.games * 100) : 0;
    summary.kd = summary.deaths ? (summary.kills / summary.deaths).toFixed(2) : String(summary.kills);
    summary.hs = shots ? Math.round(summary.head / shots * 100) : 0;
    summary.adr = summary.rounds ? Math.round(summary.damage / summary.rounds) : 0;
    summary.acs = summary.rounds ? Math.round(summary.score / summary.rounds) : 0;
    return summary;
}

const RANK_NAMES = {
    Unrated: 'Sin rango',
    Unranked: 'Sin rango',
    Iron: 'Hierro',
    Bronze: 'Bronce',
    Silver: 'Plata',
    Gold: 'Oro',
    Platinum: 'Platino',
    Diamond: 'Diamante',
    Ascendant: 'Ascendente',
    Immortal: 'Inmortal',
    Radiant: 'Radiante'
};

// La API de HenrikDev devuelve los rangos en ingles ("Gold 2" -> "Oro 2")
function translateRank(rank) {
    if (!rank) return 'Sin rango';
    const [tier, division] = rank.split(' ');
    return RANK_NAMES[tier] ? [RANK_NAMES[tier], division].filter(Boolean).join(' ') : rank;
}

// Riot ID escrito, @usuario vinculado, o la cuenta vinculada de quien usa el comando.
// Devuelve { name, tag }, un link guardado { puuid, name, tag, region } o { error }
async function resolveTarget(context, args, commandName) {
    const { getValorantLink } = require('./db');
    const input = context.options?.getString?.('riotid') || args.join(' ');
    const mention = input.match(/^<@!?(\d+)>$/);

    if (input && !mention) {
        return parseRiotId(input)
            || { error: `Escribe el Riot ID completo, por ejemplo: \`/${commandName} Nombre#LAS\`` };
    }

    const selfId = context.author?.id || context.user?.id;
    const targetId = context.options?.getUser?.('usuario')?.id || mention?.[1] || selfId;
    const link = await getValorantLink(targetId);

    if (link) return link;
    if (targetId === selfId) {
        return { error: `No tienes una cuenta vinculada. Usa \`/vincular Nombre#TAG\` o escribe un Riot ID: \`/${commandName} Nombre#LAS\`` };
    }
    return { error: 'Ese usuario no tiene una cuenta de Valorant vinculada.' };
}

module.exports = {
    getAgents,
    getWeapons,
    getMaps,
    findByName,
    normalize,
    weaponCategory,
    ABILITY_SLOTS,
    ValorantApiError,
    parseRiotId,
    getAccount,
    getAccountByPuuid,
    getMMR,
    getMMRByPuuid,
    getRecentMatches,
    getMatchesByPuuid,
    getMMRHistoryByPuuid,
    getMatch,
    getStoredMatches,
    summarizeStoredMatches,
    getCrosshairImage,
    getNews,
    getServerStatus,
    getEsportsSchedule,
    getContentTiers,
    getSkins,
    RANK_TIERS,
    rankTierName,
    translateRank,
    resolveTarget
};
