const { plantWheat, getFarm } = require('../utils/ketil');

module.exports = {
    name: 'plantwheat',
    description: 'Plantar trigo en la parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            return message.reply('Primero usa !startv para comenzar tu aventura.');
        }
        
        const result = await plantWheat(message.author.id);
        
        if (result.error) {
            return message.reply(result.error);
        }
        
        message.reply(`Has sembrado trigo. La cosecha tardara 5 minutos. Energia restante: ${result.energy}`);
    }
};