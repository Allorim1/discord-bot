const { SlashCommandBuilder } = require('discord.js');
const { getPlantTypes } = require('../utils/db');

const COLORS = { PRIMARY: '#6600ff' };

module.exports = {
    name: 'shop',
    description: 'Ver la tienda de semillas',
    category: 'jardin',
    cooldown: 30,
    
    data: () => new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Ver la tienda de semillas'),
    
    async execute(context) {
        const plants = await getPlantTypes();
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Tienda de Semillas')
            .setAuthor({
                name: 'Mercado Central',
                iconURL: context.client?.user?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            })
            .setDescription('Selecciona una planta para cultivar en tu jardin');
        
        for (const plant of plants) {
            embed.addFields({
                name: plant.name,
                value: `Costo: ${plant.seedCost} semillas | Venta: ${plant.sellPrice} monedas | Tiempo: ${plant.growthTime}s`,
                inline: false
            });
        }
        
        embed.setFooter({ text: 'Usa /plant <planta> para sembrar' });
        
        return { embeds: [embed] };
    }
};