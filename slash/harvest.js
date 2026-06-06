const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { harvestPlant, getUserGarden, getPlantTypes } = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Cosechar una planta')
        .addIntegerOption(option =>
            option.setName('numero')
                .setDescription('Numero de planta a cosechar')
                .setRequired(true)),
    async execute(interaction) {
        const plantIndex = interaction.options.getInteger('numero') - 1;
        const garden = await getUserGarden(interaction.user.id);
        
        if (plantIndex < 0 || plantIndex >= garden.plants.length) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Planta no valida. Revisa tu jardin con /garden.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await harvestPlant(interaction.user.id, plantIndex);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription('Has cosechado una planta')
            .addFields(
                { name: 'Ganancia', value: `+${result.sellPrice} monedas`, inline: true },
                { name: 'Total', value: `${result.coins}`, inline: true }
            )
            .setFooter({ text: 'Buen trabajo agricultor' });
        
        await interaction.reply({ embeds: [embed] });
    }
};