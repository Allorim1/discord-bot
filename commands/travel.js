const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFarm } = require('../utils/ketil');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'travel',
    description: 'Ver regiones desbloqueables',
    category: 'gobierno',
    cooldown: 10,
    
    data: () => new SlashCommandBuilder()
        .setName('travel')
        .setDescription('Ver regiones desbloqueables')
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Region a la que viajar')
                .setRequired(false)),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Primero usa /startv para comenzar tu aventura.');
            return { embeds: [embed], ephemeral: true };
        }
        
        if (!farm.freedom) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Aun eres un esclavo. Paga tu deuda antes de viajar.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const ketil = require('../utils/ketil');
        const regions = await ketil.getRegionInfo(userId);
        const lockedRegions = regions.filter(r => !r.unlocked);
        
        if (lockedRegions.length === 0) {
            const embed = new EmbedBuilder().setColor(COLORS.PRIMARY).setDescription('¡Ya has desbloqueado todas las regiones!');
            return { embeds: [embed], ephemeral: true };
        }
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Regiones por Descubrir');
        
        for (const region of lockedRegions) {
            embed.addFields({
                name: region.name,
                value: `Costo: ${region.fee} monedas`,
                inline: true
            });
        }
        
        return { embeds: [embed] };
    }
};