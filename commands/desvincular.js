const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getValorantLink, deleteValorantLink, getValorantRoles } = require('../utils/db');
const { removeRankRoles } = require('../utils/valroles');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'desvincular',
    description: 'Quitar el Riot ID vinculado a tu cuenta de Discord',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('desvincular')
        .setDescription('Quitar el Riot ID vinculado a tu cuenta de Discord'),

    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const link = await getValorantLink(userId);

        if (!link) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription('No tienes ninguna cuenta de Valorant vinculada.');
            return { embeds: [embed], ephemeral: true };
        }

        await deleteValorantLink(userId);

        const roles = context.guild && await getValorantRoles(context.guild.id);
        if (roles && context.member) await removeRankRoles(context.member, roles).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setDescription(`Se desvinculó **${link.name}#${link.tag}** de tu cuenta.`);
        return { embeds: [embed], ephemeral: true };
    }
};
