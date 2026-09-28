const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { translateRank } = require('../utils/valorant');
const { ACHIEVEMENTS } = require('../utils/valachievements');
const { weekKey } = require('../utils/valtime');
const {
    getValorantLink,
    getValorantRank,
    getCredits,
    getAchievements,
    getValordleStats,
    getValTriviaAnswers,
    getWeekStats
} = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655' };

module.exports = {
    name: 'perfil',
    description: 'Ver tu perfil de Valorant: rango, creditos, logros y mas',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Ver tu perfil de Valorant: rango, creditos, logros y mas')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Ver el perfil de otra persona')),

    async execute(context) {
        const user = context.options?.getUser?.('usuario')
            || context.mentions?.users?.first()
            || context.user
            || context.author;

        const [link, rank, credits, owned, valordle, trivia, week] = await Promise.all([
            getValorantLink(user.id),
            getValorantRank(user.id),
            getCredits(user.id),
            getAchievements(user.id),
            getValordleStats(user.id),
            getValTriviaAnswers(user.id),
            getWeekStats(weekKey(), user.id)
        ]);

        const badges = ACHIEVEMENTS.filter(a => owned[a.id]);

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setTitle(link ? `${link.name}#${link.tag}` : 'Sin cuenta vinculada')
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Rango', value: rank ? `${translateRank(rank.rank)} · ${rank.rr} RR` : '-', inline: true },
                { name: 'Créditos', value: `💰 ${credits}`, inline: true },
                { name: 'Logros', value: `${badges.length}/${ACHIEVEMENTS.length}`, inline: true },
                { name: 'Esta semana', value: week ? `${week.games} partidas · ${week.rr >= 0 ? '+' : ''}${week.rr} RR` : 'Sin partidas', inline: true },
                { name: 'Valordle', value: `${valordle.wins} ganados · racha ${valordle.streak}`, inline: true },
                { name: 'Trivia', value: `${trivia} respuestas`, inline: true },
                { name: 'Insignias', value: badges.length ? badges.map(a => a.emoji).join(' ') : 'Ninguna todavía. Usa `/logros` para ver cómo conseguirlas.' }
            );

        if (!link) embed.setFooter({ text: 'Usa /vincular Nombre#TAG para mostrar tu rango' });
        return { embeds: [embed] };
    }
};
