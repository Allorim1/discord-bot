const { QuickDB } = require('quick.db');
const db = new QuickDB();

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
        if (key.key.startsWith('trivia_points_')) {
            const userId = key.key.replace('trivia_points_', '');
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
    getRandomTriviaQuestion
};