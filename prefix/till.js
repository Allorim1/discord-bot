const { tillSoil } = require('../utils/ketil');

module.exports = {
    name: 'till',
    description: 'Arar la tierra de la parcela',
    async execute(message) {
        const result = await tillSoil(message.author.id);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        message.reply(`✅ Has arado la tierra. La parcela está lista para sembrar. Energía restante: ${result.energy}`);
    }
};