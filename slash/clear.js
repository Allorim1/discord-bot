const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { clearPlot, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Desarraigar arboles de la parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa `/startv` para comenzar tu aventura');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await clearPlot(interaction.user.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Arboles Desarraigados')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription('Has eliminado los arboles de tu parcela')
            .addFields(
                { name: 'Energia Restante', value: `${result.energy}/100`, inline: true }
            )
            .setFooter({ text: 'La tierra esta lista para ser arada', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};