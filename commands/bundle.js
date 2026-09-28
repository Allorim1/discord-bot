const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ValorantApiError } = require('../utils/valorant');
const { getFeaturedBundles, buildBundleEmbeds } = require('../utils/valstore');

const COLORS = { WARNING: '#ffaa00' };

module.exports = {
    name: 'bundle',
    description: 'Ver el paquete destacado de la tienda de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('bundle')
        .setDescription('Ver el paquete destacado de la tienda de Valorant'),

    async execute(context) {
        if (context.deferReply) await context.deferReply();

        let bundles;
        try {
            bundles = await getFeaturedBundles();
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        if (!bundles.length) return warning('No hay paquetes destacados en la tienda ahora.');
        return { embeds: await buildBundleEmbeds(bundles) };
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
