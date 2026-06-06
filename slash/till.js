const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { tillSoil, getFarm } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('till')
        .setDescription('Arar la tierra de la parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa `/startv` para comenzar tu aventura');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await tillSoil(interaction.user.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Tierra Arada')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription('Has arado la tierra. La parcela esta lista para sembrar')
            .addFields(
                { name: 'Energia Restante', value: `${result.energy}/100`, inline: true }
            )
            .setFooter({ text: 'Prepara la semilla para plantar', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};