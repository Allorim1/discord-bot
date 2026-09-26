const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setValorantChannel, getValorantChannel } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'valcanal',
    description: 'Elegir el canal donde se avisan las partidas de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('valcanal')
        .setDescription('Elegir el canal donde se avisan las partidas de Valorant')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal de avisos (vacio para usar este canal)')
                .addChannelTypes(ChannelType.GuildText))
        .addBooleanOption(option =>
            option.setName('desactivar')
                .setDescription('Dejar de avisar partidas en este servidor')),

    async execute(context, args = []) {
        if (!context.guild) return warning('Este comando solo funciona en un servidor.');
        if (!context.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
            return warning('Necesitas el permiso **Gestionar servidor** para usar este comando.');
        }

        const disable = context.options?.getBoolean?.('desactivar') || args[0] === 'desactivar';
        if (disable) {
            if (!await getValorantChannel(context.guild.id)) return warning('Los avisos de partidas ya estaban desactivados.');
            await setValorantChannel(context.guild.id, null);
            return success('Se desactivaron los avisos de partidas en este servidor.');
        }

        const channel = context.options?.getChannel?.('canal')
            || context.mentions?.channels?.first()
            || context.channel;

        const me = context.guild.members.me;
        if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
            return warning(`No tengo permiso para enviar mensajes con embeds en ${channel}.`);
        }

        await setValorantChannel(context.guild.id, channel.id);
        return success(`Las partidas competitivas de los miembros con cuenta vinculada se avisarán en ${channel}.`);
    }
};

function success(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('Avisos de partidas')
        .setDescription(message);
    return { embeds: [embed] };
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
