const { clearPlot } = require('../utils/ketil');

module.exports = {
    name: 'clear',
    description: 'Desarraigar árboles de la parcela',
    async execute(message) {
        const result = await clearPlot(message.author.id);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        message.reply(`✅ Has desarraigado los árboles. La tierra está arada. Energía restante: ${result.energy}`);
    }
};