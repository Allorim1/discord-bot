const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ACHIEVEMENTS } = require('../utils/valachievements');
const { getAchievements } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655' };

module.exports = {
    name: 'logros',
    description: 'Ver los logros de Valorant desbloqueados y los que faltan',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('logros')
        .setDescription('Ver los logros de Valorant desbloqueados y los que faltan')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Ver los logros de otra persona')),

    async execute(context) {
        const user = context.options?.getUser?.('usuario')
            || context.mentions?.users?.first()
            || context.user
            || context.author;

        const owned = await getAchievements(user.id);
        const count = ACHIEVEMENTS.filter(a => owned[a.id]).length;

        const lines = ACHIEVEMENTS.map(a => owned[a.id]
            ? `${a.emoji} **${a.name}** — ${a.description} · <t:${Math.floor(owned[a.id] / 1000)}:d>`
            : `🔒 ${a.name} — ${a.description} · +${a.reward} créditos`);

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setTitle(`🏆 Logros · ${count}/${ACHIEVEMENTS.length}`)
            .setDescription(lines.join('\n'));

        return { embeds: [embed] };
    }
};
