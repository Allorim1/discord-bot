const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMaps, findByName } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'mapa',
    description: 'Ver informacion de un mapa de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('mapa')
        .setDescription('Ver informacion de un mapa de Valorant')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del mapa (vacio para ver la lista)')),

    async execute(context, args = []) {
        const query = context.options?.getString?.('nombre') || args.join(' ');
        const maps = await getMaps();

        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle('Mapas de Valorant')
                .setDescription(maps.map(m => `**${m.displayName}** - ${m.tacticalDescription}`).join('\n'))
                .setFooter({ text: 'Usa /mapa <nombre> para ver el mapa' });
            return { embeds: [embed] };
        }

        const map = findByName(maps, query);
        if (!map) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(`No encontré el mapa **${query}**. Usa \`/mapa\` para ver la lista.`);
            return { embeds: [embed], ephemeral: true };
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(map.displayName)
            .setDescription(map.narrativeDescription || null)
            .setImage(map.splash)
            .addFields({ name: 'Sitios', value: map.tacticalDescription, inline: true });

        if (map.coordinates) embed.addFields({ name: 'Coordenadas', value: map.coordinates, inline: true });
        if (map.displayIcon) embed.setThumbnail(map.displayIcon);

        return { embeds: [embed] };
    }
};
