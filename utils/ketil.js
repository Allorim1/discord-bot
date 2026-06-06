const { QuickDB } = require('quick.db');
const db = new QuickDB();

const STARTING_DEBT = 50000;
const ENERGY_MAX = 100;
const ENERGY_REGEN_PER_MINUTE = 5;

const REGIONS = [
    { id: 'ketil_farm', name: 'Granjas de Ketil', unlocked: true },
    { id: 'vinland', name: 'Vinland', unlocked: false, fee: 1000 },
    { id: 'norway', name: 'Noruega', unlocked: false, fee: 2500 },
    { id: 'england', name: 'Inglaterra', unlocked: false, fee: 5000 },
    { id: 'iceland', name: 'Islandia', unlocked: false, fee: 7500 }
];

const WEATHER_STATES = {
    sunny: { name: 'Soleado', emoji: '☀️', effect: null },
    drought: { name: 'Sequía', emoji: '🌵', effect: (crop) => crop.health -= 20 },
    storm: { name: 'Tormenta', emoji: '⛈️', effect: (crop) => crop.health -= 30 }
};

async function getFarm(userId) {
    return await db.get(`ketil_farm_${userId}`) || {
        coins: 0,
        debt: STARTING_DEBT,
        plot: null,
        energy: ENERGY_MAX,
        lastEnergyCheck: Date.now(),
        region: 'ketil_farm',
        inventory: { wheat: 0 },
        freedom: false
    };
}

async function saveFarm(userId, farm) {
    await db.set(`ketil_farm_${userId}`, farm);
}

async function startAdventure(userId) {
    const farm = await getFarm(userId);
    if (farm.plot !== null) {
        return { error: 'Ya has empezado tu aventura' };
    }
    
    farm.plot = {
        state: 'cleared',
        planted: false,
        crop: null
    };
    
    await saveFarm(userId, farm);
    return { success: true, debt: farm.debt };
}

async function getEnergy(userId) {
    const farm = await getFarm(userId);
    const now = Date.now();
    const minutesPassed = Math.floor((now - farm.lastEnergyCheck) / 60000);
    const energyGained = minutesPassed * ENERGY_REGEN_PER_MINUTE;
    
    farm.energy = Math.min(ENERGY_MAX, farm.energy + energyGained);
    farm.lastEnergyCheck = now;
    await saveFarm(userId, farm);
    
    return farm.energy;
}

async function consumeEnergy(userId, amount) {
    const farm = await getFarm(userId);
    if (farm.energy < amount) return false;
    
    farm.energy -= amount;
    await saveFarm(userId, farm);
    return true;
}

async function clearPlot(userId) {
    const farm = await getFarm(userId);
    if (!await consumeEnergy(userId, 20)) {
        return { error: 'No tienes suficiente energía (20 requerido)' };
    }
    
    if (farm.plot === null) {
        return { error: 'Primero usa !startv para comenzar tu aventura' };
    }
    
    if (farm.plot.state !== 'cleared' || farm.plot.planted) {
        return { error: 'La parcela ya está lista o tiene plantas' };
    }
    
    farm.plot.state = 'tilled';
    await saveFarm(userId, farm);
    
    return { success: true, energy: farm.energy };
}

async function tillSoil(userId) {
    const farm = await getFarm(userId);
    if (!await consumeEnergy(userId, 15)) {
        return { error: 'No tienes suficiente energía (15 requerido)' };
    }
    
    if (farm.plot === null || farm.plot.state === 'cleared') {
        return { error: 'Primero desarrolla la parcela con !clearplot' };
    }
    
    if (farm.plot.planted) {
        return { error: 'Hay una planta creciendo. Cosecha primero.' };
    }
    
    farm.plot.state = 'ready';
    await saveFarm(userId, farm);
    
    return { success: true, energy: farm.energy };
}

async function plantWheat(userId) {
    const farm = await getFarm(userId);
    if (!await consumeEnergy(userId, 10)) {
        return { error: 'No tienes suficiente energía (10 requerido)' };
    }
    
    if (farm.plot === null || farm.plot.state !== 'ready') {
        return { error: 'La parcela no está lista para sembrar' };
    }
    
    if (farm.plot.planted) {
        return { error: 'Ya hay una planta creciendo' };
    }
    
    farm.plot.planted = true;
    farm.plot.crop = {
        type: 'wheat',
        plantedAt: Date.now(),
        growthTime: 300,
        health: 100
    };
    
    await saveFarm(userId, farm);
    
    return { success: true, energy: farm.energy };
}

async function harvestWheat(userId) {
    const farm = await getFarm(userId);
    
    if (farm.plot === null || !farm.plot.planted) {
        return { error: 'No hay planta para cosechar' };
    }
    
    const crop = farm.plot.crop;
    const now = Date.now();
    
    if (now - crop.plantedAt < crop.growthTime * 1000) {
        return { error: 'El trigo aún no está listo para cosechar' };
    }
    
    if (crop.health <= 0) {
        farm.plot.planted = false;
        farm.plot.crop = null;
        await saveFarm(userId, farm);
        return { error: 'El cultivo se ha muerto por falta de cuidado' };
    }
    
    farm.plot.planted = false;
    farm.plot.crop = null;
    farm.inventory.wheat += 1;
    farm.coins += 50;
    farm.debt = Math.max(0, farm.debt - 50);
    
    const wasFreed = farm.debt === 0 && !farm.freedom;
    if (wasFreed) {
        farm.freedom = true;
    }
    
    await saveFarm(userId, farm);
    
    return { success: true, wheat: farm.inventory.wheat, coins: farm.coins, debt: farm.debt, freed: wasFreed };
}

async function getRegionInfo(userId) {
    const farm = await getFarm(userId);
    return REGIONS.filter(r => r.unlocked || r.id === farm.region);
}

async function unlockRegion(userId, regionId) {
    const farm = await getFarm(userId);
    const region = REGIONS.find(r => r.id === regionId);
    
    if (!region) return { error: 'Región no encontrada' };
    if (region.unlocked) return { error: 'Región ya desbloqueada' };
    if (farm.coins < region.fee) return { error: `Necesitas ${region.fee} monedas` };
    
    region.unlocked = true;
    farm.coins -= region.fee;
    farm.region = regionId;
    
    await saveFarm(userId, farm);
    
    return { success: true, region: region.name };
}

module.exports = {
    getFarm,
    saveFarm,
    startAdventure,
    getEnergy,
    consumeEnergy,
    clearPlot,
    tillSoil,
    plantWheat,
    harvestWheat,
    getRegionInfo,
    unlockRegion,
    REGIONS,
    WEATHER_STATES,
    STARTING_DEBT
};