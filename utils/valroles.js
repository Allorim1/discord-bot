const { RANK_TIERS, rankTierName } = require('./valorant');

// Crea (o reutiliza si ya existen con el mismo nombre) un rol por cada rango
async function createRankRoles(guild) {
    await guild.roles.fetch();
    const roles = {};
    for (const tier of RANK_TIERS) {
        const existing = guild.roles.cache.find(role => role.name === tier.name);
        const role = existing || await guild.roles.create({
            name: tier.name,
            colors: { primaryColor: tier.color },
            hoist: true,
            reason: 'Roles de rango de Valorant'
        });
        roles[tier.name] = role.id;
    }
    return roles;
}

// Deja al miembro solo con el rol de su rango actual (o ninguno si no tiene rango)
async function syncMemberRankRole(member, roles, snapshot) {
    const tierName = snapshot ? rankTierName(snapshot.rank) : null;
    const desired = roles[tierName] || null;
    const rankRoleIds = Object.values(roles);

    const toRemove = member.roles.cache.filter(role => rankRoleIds.includes(role.id) && role.id !== desired);
    if (toRemove.size) await member.roles.remove(toRemove, 'Cambio de rango en Valorant');
    if (desired && !member.roles.cache.has(desired)) await member.roles.add(desired, 'Rango de Valorant');
}

async function removeRankRoles(member, roles) {
    await syncMemberRankRole(member, roles, null);
}

module.exports = {
    createRankRoles,
    syncMemberRankRole,
    removeRankRoles
};
