const { SlashCommandBuilder } = require('discord.js');
const { clearPlot, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Desarraigar arboles de la parcela'),
    async execute(interaction) {
        const result = await clearPlot(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: result.error, ephemeral: true });
        }
        
        await interaction.reply(`Has desarraigado los arboles. La tierra esta arada. Energia restante: ${result.energy}`);
    }
};