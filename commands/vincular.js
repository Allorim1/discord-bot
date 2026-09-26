const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { parseRiotId, getAccount, ValorantApiError } = require('../utils/valorant');
const { setValorantLink } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'vincular',
    description: 'Vincular tu cuenta de Discord con tu Riot ID de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('vincular')
        .setDescription('Vincular tu cuenta de Discord con tu Riot ID de Valorant')
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('Tu Riot ID, ej: Nombre#LAS')
                .setRequired(true)),

    async execute(context, args = []) {
        const userId = context.author?.id || context.user?.id;
        const riotId = parseRiotId(context.options?.getString?.('riotid') || args.join(' '));

        if (!riotId) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription('Escribe tu Riot ID completo, por ejemplo: `/vincular Nombre#LAS`');
            return { embeds: [embed], ephemeral: true };
        }

        if (context.deferReply) await context.deferReply({ ephemeral: true });

        let account;
        try {
            account = await getAccount(riotId.name, riotId.tag);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(error.message);
            return { embeds: [embed], ephemeral: true };
        }

        await setValorantLink(userId, {
            puuid: account.puuid,
            name: account.name,
            tag: account.tag,
            region: account.region
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Cuenta vinculada')
            .setDescription(`Tu Discord ahora está vinculado a **${account.name}#${account.tag}** (${account.region.toUpperCase()}).\nYa puedes usar \`/rango\` sin escribir tu Riot ID.`)
            .setThumbnail(account.card?.small || null);

        return { embeds: [embed], ephemeral: true };
    }
};
