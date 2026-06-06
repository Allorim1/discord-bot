const { SlashCommandBuilder } = require('discord.js');
const { harvestPlant, getUserGarden } = require('../utils/db');

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
            return interaction.reply({ content: 'Planta no valida. Revisa tu jardin con /garden.', ephemeral: true });
        }
        
        const result = await harvestPlant(interaction.user.id, plantIndex);
        
        if (result.error) {
            return interaction.reply({ content: result.error, ephemeral: true });
        }
        
        await interaction.reply(`Has cosechado una planta y ganado ${result.sellPrice} monedas! Total: ${result.coins}`);
    }
};