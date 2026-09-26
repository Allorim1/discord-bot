const axios = require('axios');

const LANGUAGE = 'es-MX';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = {};

const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant';

// Datos del juego (valorant-api.com, sin API key)

async function fetchCached(key, url) {
    const entry = cache[key];
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;

    const response = await axios.get(url, { params: { language: LANGUAGE }, timeout: 10000 });
    cache[key] = { data: response.data.data, time: Date.now() };
    return cache[key].data;
}

async function getAgents() {
    const agents = await fetchCached('agents', 'https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    return agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function getWeapons() {
    const weapons = await fetchCached('weapons', 'https://valorant-api.com/v1/weapons');
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
    const key = process.env.HENRIK_API_KEY;
    if (!key) throw new ValorantApiError('Falta configurar `HENRIK_API_KEY` en el archivo .env del bot.');

    try {
        const response = await axios.get(`${HENRIK_BASE}${path}`, {
            headers: { Authorization: key },
            params,
            timeout: 15000
        });
        return response.data.data;
    } catch (error) {
        const status = error.response?.status;
        if (status === 404) throw new ValorantApiError('No se encontró ese jugador o no tiene partidas recientes.');
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
    getRecentMatches,
    getMatchesByPuuid,
    getMMRHistoryByPuuid,
    getMatch,
    translateRank,
    resolveTarget
};
