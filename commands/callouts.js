const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMaps, findByName } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
// Orden en que se muestran las zonas; las que no estan aqui van al final
const ZONE_ORDER = ['A', 'B', 'C', 'Mid', 'Atacantes', 'Defensores'];
const ZONE_ICONS = { A: '🅰️', B: '🅱️', C: '©️', Mid: '⚔️', Atacantes: '🟥', Defensores: '🟦' };

module.exports = {
    name: 'callouts',
    description: 'Ver los nombres de las zonas (callouts) de un mapa de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('callouts')
        .setDescription('Ver los nombres de las zonas (callouts) de un mapa de Valorant')
        .addStringOption(option =>
            option.setName('mapa')
                .setDescription('Nombre del mapa, ej: Ascent')
                .setRequired(true)),

    async execute(context, args = []) {
        const query = context.options?.getString?.('mapa') || args.join(' ');
        const maps = (await getMaps()).filter(m => m.callouts?.length);
        const map = query ? findByName(maps, query) : null;

        if (!map) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(`No encontré ese mapa. Mapas disponibles: ${maps.map(m => m.displayName).join(', ')}`);
            return { embeds: [embed], ephemeral: true };
        }

        const zones = {};
        for (const callout of map.callouts) {
            const zone = callout.superRegionName || 'Otros';
            (zones[zone] ||= new Set()).add(callout.regionName);
        }

        const sorted = Object.keys(zones).sort((a, b) => {
            const ia = ZONE_ORDER.includes(a) ? ZONE_ORDER.indexOf(a) : ZONE_ORDER.length;
            const ib = ZONE_ORDER.includes(b) ? ZONE_ORDER.indexOf(b) : ZONE_ORDER.length;
            return ia - ib;
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`📍 Callouts de ${map.displayName}`)
            .setImage(map.displayIcon)
            .addFields(sorted.map(zone => ({
                name: `${ZONE_ICONS[zone] || '📍'} ${zone}`,
                value: [...zones[zone]].join('\n'),
                inline: true
            })))
            .setFooter({ text: 'La imagen es el minimapa del juego' });

        return { embeds: [embed] };
    }
};
