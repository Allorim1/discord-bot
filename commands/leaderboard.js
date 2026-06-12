const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllTriviaScores } = require('../utils/db');

const COLORS = { PRIMARY: '#6600ff' };

module.exports = {
    name: 'leaderboard',
    description: 'Ver el top de puntos de trivia',
    category: 'trivia',
    cooldown: 30,
    
    data: () => new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Ver el top de puntos de trivia'),
    
    async execute(context) {
        const scores = await getAllTriviaScores();
        const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a).slice(0, 10);
        
        if (sorted.length === 0) {
            const embed = new EmbedBuilder().setColor(COLORS.PRIMARY).setDescription('Aun no hay puntuaciones registradas.');
            return { embeds: [embed] };
        }
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Leaderboard de Trivia')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            });
        
        let rank = 1;
        for (const [userId, points] of sorted) {
            embed.addFields({ name: `#${rank++}`, value: `<@${userId}>: ${points} punto(s)` });
        }
        
        return { embeds: [embed] };
    }
};