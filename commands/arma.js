const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getWeapons, findByName, weaponCategory } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

const PENETRATION = {
    Low: 'Baja',
    Medium: 'Media',
    High: 'Alta'
};

module.exports = {
    name: 'arma',
    description: 'Ver estadisticas de un arma de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('arma')
        .setDescription('Ver estadisticas de un arma de Valorant')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del arma (vacio para ver la lista)')),

    async execute(context, args = []) {
        const query = context.options?.getString?.('nombre') || args.join(' ');
        const weapons = await getWeapons();

        if (!query) {
            const byCategory = {};
            for (const weapon of weapons) {
                const cost = weapon.shopData ? ` (${weapon.shopData.cost})` : '';
                (byCategory[weaponCategory(weapon)] ||= []).push(`${weapon.displayName}${cost}`);
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle('Armas de Valorant')
                .setDescription('Usa `/arma <nombre>` para ver sus estadisticas')
                .addFields(Object.entries(byCategory).map(([category, names]) => ({
                    name: category, value: names.join(', '), inline: false
                })));
            return { embeds: [embed] };
        }

        const weapon = findByName(weapons, query);
        if (!weapon) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(`No encontré el arma **${query}**. Usa \`/arma\` para ver la lista.`);
            return { embeds: [embed], ephemeral: true };
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(weapon.displayName)
            .setAuthor({ name: weaponCategory(weapon) })
            .setImage(weapon.displayIcon);

        const stats = weapon.weaponStats;
        if (stats) {
            const penetration = stats.wallPenetration?.split('::')[1];
            embed.addFields(
                { name: 'Precio', value: weapon.shopData ? `${weapon.shopData.cost} créditos` : 'Gratis', inline: true },
                { name: 'Cargador', value: String(stats.magazineSize), inline: true },
                { name: 'Cadencia', value: `${stats.fireRate} disp/s`, inline: true },
                { name: 'Recarga', value: `${stats.reloadTimeSeconds}s`, inline: true },
                { name: 'Equipar', value: `${stats.equipTimeSeconds}s`, inline: true },
                { name: 'Penetración', value: PENETRATION[penetration] || penetration || '-', inline: true }
            );

            if (stats.damageRanges?.length) {
                const pellets = stats.shotgunPelletCount > 1 ? ` (x${stats.shotgunPelletCount} perdigones)` : '';
                const lines = stats.damageRanges.map(r =>
                    `**${r.rangeStartMeters}-${r.rangeEndMeters}m:** Cabeza ${Math.round(r.headDamage)} · Cuerpo ${Math.round(r.bodyDamage)} · Piernas ${Math.round(r.legDamage)}`
                );
                embed.addFields({ name: `Daño${pellets}`, value: lines.join('\n') });
            }
        }

        return { embeds: [embed] };
    }
};
