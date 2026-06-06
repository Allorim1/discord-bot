const { EmbedBuilder } = require('discord.js');
const { getPlantTypes } = require('../utils/db');

module.exports = {
    name: 'shop',
    description: 'Ver la tienda de semillas',
    async execute(message) {
        const plants = await getPlantTypes();
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Tienda de Semillas')
            .setAuthor({
                name: 'Mercado Central',
                iconURL: message.client.user.displayAvatarURL()
            })
            .setDescription('Selecciona una planta para cultivar en tu jardin');
        
        for (const plant of plants) {
            embed.addFields({
                name: plant.name,
                value: `Costo: ${plant.seedCost} semillas | Venta: ${plant.sellPrice} monedas | Tiempo: ${plant.growthTime}s`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Usa !plant <planta> para sembrar' });
        
        message.reply({ embeds: [embed] });
    }
};