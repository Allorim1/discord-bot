const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCredits, getAllCredits, getAllBets } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655' };
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'creditos',
    description: 'Ver tus creditos de Valorant o el ranking del servidor',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('creditos')
        .setDescription('Ver tus creditos de Valorant o el ranking del servidor')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Ver los creditos de otra persona'))
        .addBooleanOption(option =>
            option.setName('ranking')
                .setDescription('Ver quienes tienen mas creditos en el servidor')),

    // Prefijo: !creditos, !creditos @alguien, !creditos top
    async execute(context, args = []) {
        const showRanking = context.options?.getBoolean?.('ranking') || args[0] === 'top';
        if (showRanking && context.guild) return ranking(context);

        const user = context.options?.getUser?.('usuario')
            || context.mentions?.users?.first()
            || context.user
            || context.author;

        const credits = await getCredits(user.id);
        const bets = (await getAllBets()).filter(b => b.userId === user.id);

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setTitle(`💰 ${credits} créditos`);

        if (bets.length) {
            embed.addFields({
                name: 'Apuestas activas',
                value: bets.map(b => `**${b.amount}** a que **${b.targetName}** ${b.prediction}`).join('\n')
            });
        }

        embed.setFooter({ text: 'Gana créditos con /valtrivia y con /apostar' });
        return { embeds: [embed] };
    }
};

async function ranking(context) {
    const all = Object.entries(await getAllCredits()).sort((a, b) => b[1] - a[1]);

    const lines = [];
    for (const [userId, credits] of all) {
        if (lines.length >= 10) break;
        const member = await context.guild.members.fetch(userId).catch(() => null);
        if (!member) continue;
        const position = MEDALS[lines.length] || `**${lines.length + 1}.**`;
        lines.push(`${position} **${member.displayName}** — ${credits} créditos`);
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('💰 Ranking de créditos')
        .setDescription(lines.join('\n') || 'Nadie ha usado créditos todavía.');
    return { embeds: [embed] };
}
