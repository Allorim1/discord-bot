const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { plantWheat, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantwheat')
        .setDescription('Plantar trigo en la parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa `/startv` para comenzar tu aventura');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await plantWheat(interaction.user.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Trigo Sembrado')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription('Has plantado trigo en tu parcela')
            .addFields(
                { name: 'Tiempo de Crecimiento', value: '5 minutos', inline: true },
                { name: 'Energia Restante', value: `${result.energy}/100`, inline: true }
            )
            .setFooter({ text: 'Espera a que el trigo este listo para cosechar', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};