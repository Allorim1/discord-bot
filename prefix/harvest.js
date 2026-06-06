const { harvestPlant, getUserGarden } = require('../utils/db');

module.exports = {
    name: 'harvest',
    description: 'Cosechar una planta',
    async execute(message, args) {
        if (!args[0]) return message.reply('Debes especificar qué planta cosechar. Usa `!garden` para ver tus plantas.');
        
        const plantIndex = parseInt(args[0]) - 1;
        const garden = await getUserGarden(message.author.id);
        
        if (plantIndex < 0 || plantIndex >= garden.plants.length) {
            return message.reply('❌ Planta no válida. Revisa tu jardín con `!garden`.');
        }
        
        const result = await harvestPlant(message.author.id, plantIndex);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        message.reply(`✅ Has cosechado una planta y ganado ${result.sellPrice} monedas! Total: ${result.coins}`);
    }
};