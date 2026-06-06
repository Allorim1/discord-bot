const { plantSeed, getUserGarden, getPlantTypes } = require('../utils/db');

module.exports = {
    name: 'plant',
    description: 'Plantar una semilla',
    async execute(message, args) {
        if (!args[0]) return message.reply('Debes especificar qué plantar. Usa `!shop` para ver opciones.');
        
        const plantType = args[0].toLowerCase();
        const result = await plantSeed(message.author.id, plantType);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        const plants = await getPlantTypes();
        const plantName = plants.find(p => p.id === plantType).name;
        message.reply(`✅ Has plantado ${plantName}! Te quedan ${result.seeds} semillas.`);
    }
};