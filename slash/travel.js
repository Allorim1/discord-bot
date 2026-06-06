const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRegionInfo, unlockRegion, getFarm } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travel')
        .setDescription('Ver regiones desbloqueables')
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Region a la que viajar')
                .setRequired(false)),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            return interaction.reply({ content: 'Primero usa /startv para comenzar tu aventura.', ephemeral: true });
        }
        
        if (!farm.freedom) {
            return interaction.reply({ content: 'Aun eres un esclavo. Paga tu deuda antes de viajar.', ephemeral: true });
        }
        
        const regions = await getRegionInfo(interaction.user.id);
        const lockedRegions = regions.filter(r => !r.unlocked);
        
        if (lockedRegions.length === 0) {
            return interaction.reply({ content: 'Ya has desbloqueado todas las regiones!', ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle('Regiones por Descubrir');
        
        for (const region of lockedRegions) {
            embed.addFields({
                name: region.name,
                value: `Costo: ${region.fee} monedas`,
                inline: true
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};