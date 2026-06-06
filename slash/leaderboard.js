const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllTriviaScores } = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Ver el top de puntos de trivia'),
    async execute(interaction) {
        const scores = await getAllTriviaScores();
        
        const sorted = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        if (sorted.length === 0) {
            return interaction.reply('Aún no hay puntuaciones registradas.');
        }
        
        const embed = new EmbedBuilder()
            .setColor('#fbbf24')
            .setTitle('🏆 Leaderboard de Trivia');
        
        let rank = 1;
        for (const [userId, points] of sorted) {
            embed.addFields({ name: `#${rank++}`, value: `<@${userId}>: ${points} punto(s)` });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};