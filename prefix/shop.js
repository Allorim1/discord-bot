const { EmbedBuilder } = require('discord.js');
const { getPlantTypes } = require('../utils/db');

module.exports = {
    name: 'shop',
    description: 'Ver la tienda de semillas',
    async execute(message) {
        const plants = await getPlantTypes();
        
        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('Tienda de Semillas')
            .setDescription('Usa !plant <planta> para comprar y plantar');
        
        for (const plant of plants) {
            embed.addFields({
                name: plant.name,
                value: `Costo: ${plant.seedCost} semillas | Venta: ${plant.sellPrice} monedas | Crecimiento: ${plant.growthTime}s`
            });
        }
        
        message.reply({ embeds: [embed] });
    }
};