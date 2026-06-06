const { SlashCommandBuilder } = require('discord.js');
const { tillSoil } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('till')
        .setDescription('Arar la tierra de la parcela'),
    async execute(interaction) {
        const result = await tillSoil(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: result.error, ephemeral: true });
        }
        
        await interaction.reply(`Has arado la tierra. La parcela esta lista para sembrar. Energia restante: ${result.energy}`);
    }
};