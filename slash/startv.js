const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { startAdventure, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startv')
        .setDescription('Comenzar tu aventura como esclavo en la granja de Ketil'),
    async execute(interaction) {
        const result = await startAdventure(interaction.user.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const farm = await getFarm(interaction.user.id);
        const energy = await getEnergy(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Granjas de Ketil')
            .setAuthor({
                name: `Bienvenido, ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(`Has comenzado tu aventura como esclavo.\nTe han asignado una parcela baldida.\n\nTu deuda: ${farm.debt} monedas de oro`)
            .addFields(
                { name: 'Energia', value: `${energy}/100`, inline: true },
                { name: 'Objetivo', value: 'Pagar la deuda para ganar libertad', inline: true }
            )
            .setFooter({ text: 'Usa /tutoria para guias paso a paso • Ketil Farm RPG', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};