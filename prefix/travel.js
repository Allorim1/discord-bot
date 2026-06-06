const { getRegionInfo, getFarm } = require('../utils/ketil');

module.exports = {
    name: 'travel',
    description: 'Ver regiones para viajar',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            return message.reply('❌ Primero usa `!startv` para comenzar tu aventura.');
        }
        
        if (!farm.freedom) {
            return message.reply('❌ Aún eres un esclavo. Paga tu deuda antes de viajar.');
        }
        
        const regions = await getRegionInfo(message.author.id);
        const lockedRegions = regions.filter(r => !r.unlocked);
        
        if (lockedRegions.length === 0) {
            return message.reply('¡Ya has desbloqueado todas las regiones!');
        }
        
        let msg = '🗺️ **Regiones por Descubrir**:\n\n';
        
        for (const region of lockedRegions) {
            msg += `**${region.name}** - Costo: ${region.fee} monedas\n`;
        }
        
        message.reply(msg);
    }
};