const { QuickDB } = require('quick.db');
const db = new QuickDB({ filePath: './data/json.sqlite' });

async function getUserGarden(userId) {
    return await db.get(`garden_${userId}`) || {
        seeds: 0,
        plants: [],
        coins: 100,
        lastHarvest: 0,
        lastDaily: 0
    };
}

async function saveUserGarden(userId, garden) {
    await db.set(`garden_${userId}`, garden);
}

async function addSeeds(userId, amount) {
    const garden = await getUserGarden(userId);
    garden.seeds += amount;
    await saveUserGarden(userId, garden);
    return garden.seeds;
}

async function addCoins(userId, amount) {
    const garden = await getUserGarden(userId);
    garden.coins += amount;
    await saveUserGarden(userId, garden);
    return garden.coins;
}

async function getPlantTypes() {
    return [
        { id: 'wheat', name: 'Trigo', growthTime: 60, sellPrice: 25, seedCost: 10 },
        { id: 'carrot', name: 'Zanahoria', growthTime: 120, sellPrice: 50, seedCost: 20 },
        { id: 'tomato', name: 'Tomate', growthTime: 180, sellPrice: 75, seedCost: 35 },
        { id: 'corn', name: 'Maíz', growthTime: 240, sellPrice: 100, seedCost: 50 }
    ];
}

async function plantSeed(userId, plantType) {
    const garden = await getUserGarden(userId);
    const plants = await getPlantTypes();
    const plantData = plants.find(p => p.id === plantType);
    
    if (!plantData) return { error: 'Planta no encontrada' };
    if (garden.seeds < plantData.seedCost) return { error: 'No tienes suficientes semillas' };
    
    garden.seeds -= plantData.seedCost;
    garden.plants.push({
        type: plantType,
        plantedAt: Date.now(),
        ready: false
    });
    
    await saveUserGarden(userId, garden);
    return { success: true, seeds: garden.seeds };
}

async function harvestPlant(userId, plantIndex) {
    const garden = await getUserGarden(userId);
    if (plantIndex < 0 || plantIndex >= garden.plants.length) return { error: 'Planta no válida' };
    
    const plant = garden.plants[plantIndex];
    const plants = await getPlantTypes();
    const plantData = plants.find(p => p.id === plant.type);
    
    if (!plant.ready) return { error: 'La planta aún no está lista para cosechar' };
    
    garden.plants.splice(plantIndex, 1);
    garden.coins += plantData.sellPrice;
    await saveUserGarden(userId, garden);
    
    return { success: true, coins: garden.coins, sellPrice: plantData.sellPrice };
}

async function checkReadyPlants(userId) {
    const garden = await getUserGarden(userId);
    const now = Date.now();
    let updated = false;
    
    for (const plant of garden.plants) {
        if (!plant.ready) {
            const plants = await getPlantTypes();
            const plantData = plants.find(p => p.id === plant.type);
            if (now - plant.plantedAt >= plantData.growthTime * 1000) {
                plant.ready = true;
                updated = true;
            }
        }
    }
    
    if (updated) await saveUserGarden(userId, garden);
    return garden.plants.filter(p => p.ready);
}

async function getAllTriviaScores() {
    const allScores = {};
    for (const key of await db.all()) {
        if (key.id.startsWith('trivia_points_')) {
            const userId = key.id.replace('trivia_points_', '');
            allScores[userId] = key.value;
        }
    }
    return allScores;
}

async function getTriviaPoints(userId) {
    return await db.get(`trivia_points_${userId}`) || 0;
}

async function addTriviaPoint(userId) {
    const points = await getTriviaPoints(userId);
    await db.set(`trivia_points_${userId}`, points + 1);
    return points + 1;
}

async function getRandomTriviaQuestion() {
    try {
        const axios = require('axios');
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = response.data.results[0];
        
        const allAnswers = [...data.incorrect_answers, data.correct_answer];
        const shuffled = allAnswers.sort(() => Math.random() - 0.5);
        
        return {
            question: decodeHTMLEntities(data.question),
            answer: decodeHTMLEntities(data.correct_answer).toLowerCase()
        };
    } catch (error) {
        console.error('Error fetching trivia:', error.message);
        return {
            question: '¿Qué lenguaje de programación usamos en este bot?',
            answer: 'javascript'
        };
    }
}

function decodeHTMLEntities(text) {
    const entities = {
        '&#39;': "'",
        '&quot;': '"',
        '&amp;': '&',
        '&eacute;': 'é',
        '&iacute;': 'í',
        '&oacute;': 'ó',
        '&uacute;': 'ú',
        '&ntilde;': 'ñ',
        '&uuml;': 'ü',
        '&Aacute;': 'Á',
        '&Eacute;': 'É',
        '&Iacute;': 'Í',
        '&Oacute;': 'Ó',
        '&Uacute;': 'Ú',
        '&Ntilde;': 'Ñ'
    };
    return text.replace(/&#?\w+;/g, match => entities[match] || match);
}

async function getValorantLink(userId) {
    return await db.get(`valorant_link_${userId}`) || null;
}

async function setValorantLink(userId, link) {
    await db.set(`valorant_link_${userId}`, link);
}

async function deleteValorantLink(userId) {
    await db.delete(`valorant_link_${userId}`);
    await db.delete(`valorant_lastmatch_${userId}`);
    await db.delete(`valorant_rank_${userId}`);
}

async function getAllValorantLinks() {
    const links = [];
    for (const row of await db.all()) {
        if (row.id.startsWith('valorant_link_')) {
            links.push({ userId: row.id.replace('valorant_link_', ''), ...row.value });
        }
    }
    return links;
}

async function getValorantLastMatch(userId) {
    return await db.get(`valorant_lastmatch_${userId}`) || null;
}

async function setValorantLastMatch(userId, matchId) {
    await db.set(`valorant_lastmatch_${userId}`, matchId);
}

// Canales de avisos: 'partidas' (resultados) o 'noticias' (parches y estado de servidores)
const CHANNEL_KEYS = {
    partidas: 'valorant_channel_',
    noticias: 'valorant_newschannel_'
};

async function getValorantChannel(guildId, type = 'partidas') {
    return await db.get(`${CHANNEL_KEYS[type]}${guildId}`) || null;
}

async function setValorantChannel(guildId, channelId, type = 'partidas') {
    if (channelId) await db.set(`${CHANNEL_KEYS[type]}${guildId}`, channelId);
    else await db.delete(`${CHANNEL_KEYS[type]}${guildId}`);
}

async function getAllValorantChannels(type = 'partidas') {
    const prefix = CHANNEL_KEYS[type];
    const channels = [];
    for (const row of await db.all()) {
        if (row.id.startsWith(prefix)) {
            channels.push({ guildId: row.id.replace(prefix, ''), channelId: row.value });
        }
    }
    return channels;
}

// Ultimo rango conocido: { tier, rank, rr, elo, updatedAt }
async function getValorantRank(userId) {
    return await db.get(`valorant_rank_${userId}`) || null;
}

async function setValorantRank(userId, rank) {
    await db.set(`valorant_rank_${userId}`, rank);
}

// Roles por rango de un servidor: { Hierro: roleId, Bronce: roleId, ... }
async function getValorantRoles(guildId) {
    return await db.get(`valorant_roles_${guildId}`) || null;
}

async function setValorantRoles(guildId, roles) {
    if (roles) await db.set(`valorant_roles_${guildId}`, roles);
    else await db.delete(`valorant_roles_${guildId}`);
}

async function getAllValorantRoles() {
    const all = {};
    for (const row of await db.all()) {
        if (row.id.startsWith('valorant_roles_')) {
            all[row.id.replace('valorant_roles_', '')] = row.value;
        }
    }
    return all;
}

// Noticias y avisos de servidores ya publicados
async function getSeenNews() {
    return await db.get('valorant_news_seen') || null;
}

async function setSeenNews(ids) {
    await db.set('valorant_news_seen', ids.slice(-300));
}

// Creditos: moneda propia de Valorant
const STARTING_CREDITS = 500;

async function getCredits(userId) {
    const credits = await db.get(`valorant_credits_${userId}`);
    return credits ?? STARTING_CREDITS;
}

async function addCredits(userId, amount) {
    const key = `valorant_credits_${userId}`;
    if (await db.get(key) === null) await db.set(key, STARTING_CREDITS);
    return await db.add(key, amount);
}

async function getAllCredits() {
    const all = {};
    for (const row of await db.all()) {
        if (row.id.startsWith('valorant_credits_')) {
            all[row.id.replace('valorant_credits_', '')] = row.value;
        }
    }
    return all;
}

// Apuestas: { id, userId, guildId, channelId, targetUserId, puuid, region, prediction, amount, createdAt }
async function createBet(bet) {
    await db.set(`valorant_bet_${bet.id}`, bet);
}

async function deleteBet(betId) {
    await db.delete(`valorant_bet_${betId}`);
}

async function getAllBets() {
    const bets = [];
    for (const row of await db.all()) {
        if (row.id.startsWith('valorant_bet_')) bets.push(row.value);
    }
    return bets;
}


// Logros de Valorant: { logroId: timestamp }
async function getAchievements(userId) {
    return await db.get(`valorant_achievements_${userId}`) || {};
}

async function setAchievements(userId, achievements) {
    await db.set(`valorant_achievements_${userId}`, achievements);
}

// Respuestas correctas de /valtrivia
async function addValTriviaAnswer(userId) {
    const key = `valorant_trivia_${userId}`;
    if (await db.get(key) === null) await db.set(key, 0);
    return await db.add(key, 1);
}

async function getValTriviaAnswers(userId) {
    return await db.get(`valorant_trivia_${userId}`) || 0;
}

// Estadisticas semanales: { games, wins, losses, rr, bestKills, bestKillsMap }
async function getWeekStats(week, userId) {
    return await db.get(`valorant_week_${week}_${userId}`) || null;
}

async function setWeekStats(week, userId, stats) {
    await db.set(`valorant_week_${week}_${userId}`, stats);
}

async function getWeeklyPosted() {
    return await db.get('valorant_weekly_posted') || null;
}

async function setWeeklyPosted(week) {
    await db.set('valorant_weekly_posted', week);
}

// Valordle: partida del dia { guesses: [], solved, lost } y estadisticas { wins, streak, best, lastWinDay }
async function getValordleGame(day, userId) {
    return await db.get(`valorant_valordle_${day}_${userId}`) || { guesses: [], solved: false, lost: false };
}

async function setValordleGame(day, userId, game) {
    await db.set(`valorant_valordle_${day}_${userId}`, game);
}

async function getValordleStats(userId) {
    return await db.get(`valorant_valordle_stats_${userId}`) || { wins: 0, streak: 0, best: 0, lastWinDay: null };
}

async function setValordleStats(userId, stats) {
    await db.set(`valorant_valordle_stats_${userId}`, stats);
}

module.exports = {
    getUserGarden,
    saveUserGarden,
    addSeeds,
    addCoins,
    getPlantTypes,
    plantSeed,
    harvestPlant,
    checkReadyPlants,
    getTriviaPoints,
    addTriviaPoint,
    getAllTriviaScores,
    getRandomTriviaQuestion,
    getValorantLink,
    setValorantLink,
    deleteValorantLink,
    getAllValorantLinks,
    getValorantLastMatch,
    setValorantLastMatch,
    getValorantChannel,
    setValorantChannel,
    getAllValorantChannels,
    getValorantRank,
    setValorantRank,
    getValorantRoles,
    setValorantRoles,
    getAllValorantRoles,
    getSeenNews,
    setSeenNews,
    STARTING_CREDITS,
    getCredits,
    addCredits,
    getAllCredits,
    createBet,
    deleteBet,
    getAllBets,
    getAchievements,
    setAchievements,
    addValTriviaAnswer,
    getValTriviaAnswers,
    getWeekStats,
    setWeekStats,
    getWeeklyPosted,
    setWeeklyPosted,
    getValordleGame,
    setValordleGame,
    getValordleStats,
    setValordleStats
};