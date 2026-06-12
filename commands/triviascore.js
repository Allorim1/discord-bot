const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllTriviaScores } = require('../utils/db');

const COLORS = { PRIMARY: '#6600ff' };

module.exports = {
    name: 'triviascore',
    description: 'Ver tu puntuacion de trivia',
    category: 'trivia',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('triviascore')
        .setDescription('Ver tu puntuacion de trivia')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a consultar')),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        let targetId;
        
        if (context.options?.getUser) {
            targetId = context.options.getUser('usuario')?.id || userId;
        } else if (args[0]) {
            const user = await context.client.users.fetch(args[0].replace(/[<@!>]/g, ''));
            targetId = user?.id || userId;
        } else {
            targetId = userId;
        }
        
        const points = await getTriviaPoints(targetId);
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Puntuacion de Trivia')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(`${targetId === userId ? 'Tienes' : 'Este usuario tiene'} ${points} punto(s) de trivia.`);
        
        return { embeds: [embed] };
    }
};

async function getTriviaPoints(userId) {
    return (await getAllTriviaScores())[userId] || 0;
}