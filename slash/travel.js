const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getRegionInfo, unlockRegion, getFarm } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travel')
        .setDescription('Ver regiones desbloqueables')
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Región a la que viajar')
                .setRequired(false)),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            return interaction.reply({ content: '❌ Primero usa `/startv` para comenzar tu aventura.', ephemeral: true });
        }
        
        if (!farm.freedom) {
            return interaction.reply({ content: '❌ Aún eres un esclavo. Paga tu deuda antes de viajar.', ephemeral: true });
        }
        
        const regions = await getRegionInfo(interaction.user.id);
        const lockedRegions = regions.filter(r => !r.unlocked);
        
        if (lockedRegions.length === 0) {
            return interaction.reply({ content: '¡Ya has desbloqueado todas las regiones!', ephemeral: true });
        }
        
        const embed = {
            color: 0x3b82f6,
            title: '🗺️ Regiones por Descubrir',
            fields: []
        };
        
        for (const region of lockedRegions) {
            embed.fields.push({
                name: region.name,
                value: `Costo: ${region.fee} monedas | Desbloquea con: \`/travel ${region.id}\``,
                inline: true
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};