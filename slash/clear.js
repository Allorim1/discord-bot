const { SlashCommandBuilder } = require('discord.js');
const { clearPlot, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Desarraigar árboles de la parcela'),
    async execute(interaction) {
        const result = await clearPlot(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }
        
        await interaction.reply(`✅ Has desarraigado los árboles. La tierra está arada. Energía restante: ${result.energy}`);
    }
};