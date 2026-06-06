const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTriviaPoints, getAllTriviaScores } = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('triviascore')
        .setDescription('Ver tu puntuación de trivia')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a consultar')),
    async execute(interaction) {
        const userId = interaction.options.getUser('usuario')?.id || interaction.user.id;
        const points = await getTriviaPoints(userId);
        
        await interaction.reply(`${userId === interaction.user.id ? 'Tienes' : 'Este usuario tiene'} ${points} punto(s) de trivia.`);
    }
};