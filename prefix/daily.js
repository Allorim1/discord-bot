const { saveUserGarden } = require('../utils/db');

module.exports = {
    name: 'daily',
    description: 'Recoger recompensa diaria',
    async execute(message) {
        const { getUserGarden, addSeeds } = require('../utils/db');
        const garden = await getUserGarden(message.author.id);
        const now = Date.now();
        
        if (!garden.lastDaily) garden.lastDaily = 0;
        
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - garden.lastDaily < oneDay) {
            const hoursLeft = Math.ceil((oneDay - (now - garden.lastDaily)) / (60 * 60 * 1000));
            return message.reply(`Ya reclamaste tu recompensa diaria. Vuelve en ${hoursLeft} horas.`);
        }
        
        const seedsGained = 50;
        garden.seeds += seedsGained;
        garden.lastDaily = now;
        await saveUserGarden(message.author.id, garden);
        
        message.reply(`Has recibido ${seedsGained} semillas! Total: ${garden.seeds}`);
    }
};