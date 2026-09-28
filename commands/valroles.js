const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getValorantRoles, setValorantRoles, getAllValorantLinks, getValorantRank } = require('../utils/db');
const { createRankRoles, syncMemberRankRole } = require('../utils/valroles');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'valroles',
    description: 'Activar o desactivar los roles automaticos por rango de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('valroles')
        .setDescription('Activar o desactivar los roles automaticos por rango de Valorant')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('accion')
                .setDescription('Que hacer')
                .setRequired(true)
                .addChoices(
                    { name: 'Activar', value: 'activar' },
                    { name: 'Desactivar', value: 'desactivar' }
                ))
        .addBooleanOption(option =>
            option.setName('borrar_roles')
                .setDescription('Al desactivar, borrar tambien los roles de rango del servidor')),

    async execute(context, args = []) {
        const guild = context.guild;
        if (!guild) return warning('Este comando solo funciona en un servidor.');
        if (!context.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
            return warning('Necesitas el permiso **Gestionar servidor** para usar este comando.');
        }

        const action = context.options?.getString?.('accion') || args[0];
        if (action === 'activar') return enable(context, guild);
        if (action === 'desactivar') {
            const deleteRoles = context.options?.getBoolean?.('borrar_roles') || args[1] === 'borrar';
            return disable(guild, deleteRoles);
        }
        return warning('Usa `/valroles activar` o `/valroles desactivar`.');
    }
};

async function enable(context, guild) {
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return warning('Necesito el permiso **Gestionar roles** para crear y asignar los roles de rango.');
    }

    if (context.deferReply) await context.deferReply();

    const roles = await createRankRoles(guild);
    await setValorantRoles(guild.id, roles);

    // Asignar ya los roles con el ultimo rango conocido de cada vinculado
    let synced = 0;
    let failed = 0;
    for (const link of await getAllValorantLinks()) {
        const member = await guild.members.fetch(link.userId).catch(() => null);
        const rank = await getValorantRank(link.userId);
        if (!member || !rank) continue;
        try {
            await syncMemberRankRole(member, roles, rank);
            synced++;
        } catch {
            failed++;
        }
    }

    const lines = [
        'Los miembros con cuenta vinculada recibirán el rol de su rango y se actualizará solo cuando suban o bajen.',
        `Roles: ${Object.values(roles).map(id => `<@&${id}>`).join(' ')}`,
        `Asignados ahora: **${synced}** miembro(s).`
    ];
    if (failed) {
        lines.push(`⚠️ No pude cambiar los roles de ${failed} miembro(s). Mueve mi rol **por encima** de los roles de rango en Ajustes del servidor → Roles.`);
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('Roles por rango activados')
        .setDescription(lines.join('\n\n'));
    return { embeds: [embed], allowedMentions: { parse: [] } };
}

async function disable(guild, deleteRoles) {
    const roles = await getValorantRoles(guild.id);
    if (!roles) return warning('Los roles por rango ya estaban desactivados.');

    await setValorantRoles(guild.id, null);

    let text = 'Se desactivaron los roles por rango. Los roles siguen existiendo pero ya no se actualizan.';
    if (deleteRoles) {
        for (const roleId of Object.values(roles)) {
            await guild.roles.delete(roleId, 'Roles de rango de Valorant desactivados').catch(() => null);
        }
        text = 'Se desactivaron y borraron los roles por rango.';
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setDescription(text);
    return { embeds: [embed] };
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
