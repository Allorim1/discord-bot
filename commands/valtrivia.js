const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { startQuestion } = require('../utils/valtrivia');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'valtrivia',
    description: 'Lanzar una pregunta de trivia de Valorant en el canal',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('valtrivia')
        .setDescription('Lanzar una pregunta de trivia de Valorant en el canal'),

    async execute(context) {
        const question = await startQuestion(context.channel);

        if (!question) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription('Ya hay una pregunta activa en este canal. ¡Respóndela primero!');
            return { embeds: [embed], ephemeral: true };
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Trivia de Valorant')
            .setDescription(question.question)
            .setFooter({ text: `Escribe la respuesta en el chat. Tienes ${question.seconds} segundos.` });

        if (question.thumbnail) embed.setThumbnail(question.thumbnail);
        if (question.image) embed.setImage(question.image);

        return { embeds: [embed] };
    }
};
