const { QuickDB } = require('quick.db');
const db = new QuickDB({ filePath: './data/json.sqlite' });

async function getPlayerData(userId) {
    return await db.get(`player_${userId}`) || {
        coins: 0,
        karma: 0,
        resources: {
            wood: 0,
            iron: 0,
            rare_pelts: 0,
            rare_wood: 0,
            maps: 0
        },
        ship: null,
        crew: 0,
        settlements: [],
        founded: false
    };
}

async function savePlayerData(userId, data) {
    await db.set(`player_${userId}`, data);
}

async function getSettlement(userId) {
    return await db.get(`settlement_${userId}`) || null;
}

async function saveSettlement(userId, settlement) {
    await db.set(`settlement_${userId}`, settlement);
}

async function getAllSettlements() {
    const all = {};
    for (const key of await db.all()) {
        if (key.key.startsWith('settlement_')) {
            const ownerId = key.key.replace('settlement_', '');
            all[ownerId] = key.value;
        }
    }
    return all;
}

module.exports = {
    getPlayerData,
    savePlayerData,
    getSettlement,
    saveSettlement,
    getAllSettlements
};