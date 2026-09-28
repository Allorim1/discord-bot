const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setValorantChannel, getValorantChannel } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

const TYPES = {
    partidas: {
        label: 'partidas',
        enabled: channel => `Las partidas competitivas de los miembros con cuenta vinculada se avisarán en ${channel}.`
    },
    noticias: {
        label: 'noticias',
        enabled: channel => `Los parches, noticias y problemas de servidores de Valorant se publicarán en ${channel}.`
    }
};

module.exports = {
    name: 'valcanal',
    description: 'Elegir el canal de avisos de partidas o de noticias de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('valcanal')
        .setDescription('Elegir el canal de avisos de partidas o de noticias de Valorant')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Que avisos configurar (por defecto partidas)')
                .addChoices(
                    { name: 'Partidas de los miembros', value: 'partidas' },
                    { name: 'Noticias y estado de servidores', value: 'noticias' }
                ))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal de avisos (vacio para usar este canal)')
                .addChannelTypes(ChannelType.GuildText))
        .addBooleanOption(option =>
            option.setName('desactivar')
                .setDescription('Desactivar este tipo de avisos en el servidor')),

    async execute(context, args = []) {
        if (!context.guild) return warning('Este comando solo funciona en un servidor.');
        if (!context.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
            return warning('Necesitas el permiso **Gestionar servidor** para usar este comando.');
        }

        // Prefijo: !valcanal [noticias] [#canal] | !valcanal desactivar [noticias]
        const type = context.options?.getString?.('tipo') || (args.includes('noticias') ? 'noticias' : 'partidas');
        const { label, enabled } = TYPES[type];

        const disable = context.options?.getBoolean?.('desactivar') || args[0] === 'desactivar';
        if (disable) {
            if (!await getValorantChannel(context.guild.id, type)) return warning(`Los avisos de ${label} ya estaban desactivados.`);
            await setValorantChannel(context.guild.id, null, type);
            return success(label, `Se desactivaron los avisos de ${label} en este servidor.`);
        }

        const channel = context.options?.getChannel?.('canal')
            || context.mentions?.channels?.first()
            || context.channel;

        const me = context.guild.members.me;
        if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
            return warning(`No tengo permiso para enviar mensajes con embeds en ${channel}.`);
        }

        await setValorantChannel(context.guild.id, channel.id, type);
        return success(label, enabled(channel));
    }
};

function success(label, message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`Avisos de ${label}`)
        .setDescription(message);
    return { embeds: [embed] };
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
