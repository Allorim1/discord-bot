const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAccount, getMatchesByPuuid, getMMRHistoryByPuuid, resolveTarget, ValorantApiError } = require('../utils/valorant');
const { buildMatchEmbed } = require('../utils/valmatch');

const COLORS = { WARNING: '#ffaa00' };

module.exports = {
    name: 'partida',
    description: 'Ver la tabla de la ultima partida de un jugador de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('partida')
        .setDescription('Ver la tabla de la ultima partida de un jugador de Valorant')
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('Riot ID del jugador, ej: Nombre#LAS (vacio para usar tu cuenta vinculada)'))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord con cuenta vinculada'))
        .addStringOption(option =>
            option.setName('modo')
                .setDescription('Modo de juego (por defecto competitivo)')
                .addChoices(
                    { name: 'Competitivo', value: 'competitive' },
                    { name: 'No clasificado', value: 'unrated' },
                    { name: 'Swiftplay', value: 'swiftplay' },
                    { name: 'Premier', value: 'premier' }
                )),

    async execute(context, args = []) {
        const target = await resolveTarget(context, args, 'partida');
        const mode = context.options?.getString?.('modo') || 'competitive';

        if (target.error) return warning(target.error);

        // La API puede tardar mas de 3 segundos
        if (context.deferReply) await context.deferReply();
        else await context.channel?.sendTyping?.();

        try {
            const account = target.puuid ? target : await getAccount(target.name, target.tag);
            const [match] = await getMatchesByPuuid(account.region, account.puuid, mode, 1) || [];

            if (!match) return warning(`**${account.name}#${account.tag}** no tiene partidas recientes en ese modo.`);

            let rrChange;
            if (mode === 'competitive') {
                const history = await getMMRHistoryByPuuid(account.region, account.puuid).catch(() => []);
                rrChange = history?.find(h => h.match_id === match.metadata?.matchid)?.mmr_change_to_last_game;
            }

            return { embeds: [await buildMatchEmbed(match, account.puuid, rrChange)] };
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
