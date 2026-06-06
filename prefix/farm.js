const { EmbedBuilder } = require('discord.js');
const { getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    name: 'farm',
    description: 'Ver tu granja',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        await getEnergy(message.author.id);
        
        if (!farm.plot) {
            return message.reply('❌ Primero usa `!startv` para comenzar tu aventura.');
        }
        
        const plotStates = {
            cleared: '🌳 Baldío (árboles)',
            tilled: '🔄 Arado',
            ready: '✅ Lista para sembrar'
        };
        
        const embed = new EmbedBuilder()
            .setColor('#8b4513')
            .setTitle('🏞️ Tu Granja')
            .addFields(
                { name: '💰 Monedas', value: farm.coins.toString(), inline: true },
                { name: '💎 Deuda', value: farm.debt.toString(), inline: true },
                { name: '⚡ Energía', value: `${farm.energy}/100`, inline: true },
                { name: '📍 Región', value: farm.region, inline: true },
                { name: '🌾 Trigo', value: farm.inventory.wheat.toString(), inline: true },
                { name: '📊 Parcela', value: farm.plot.planted 
                    ? `🌱 Creciendo (${Math.max(0, 300 - Math.floor((Date.now() - farm.plot.crop?.plantedAt)/1000)}s)` 
                    : plotStates[farm.plot.state]
                }
            );
        
        if (farm.freedom) {
            embed.addFields({ name: '🔓 Estado', value: '¡Eres libre!' });
        }
        
        message.reply({ embeds: [embed] });
    }
};