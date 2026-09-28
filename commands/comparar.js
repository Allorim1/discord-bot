const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resolveTarget, translateRank, ValorantApiError } = require('../utils/valorant');
const { getValorantLink } = require('../utils/db');
const { loadPlayerStats, topAgents } = require('../utils/valstats');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'comparar',
    description: 'Comparar tus estadisticas de Valorant con otro jugador',
    category: 'valorant',
    cooldown: 15,

    data: () => new SlashCommandBuilder()
        .setName('comparar')
        .setDescription('Comparar tus estadisticas de Valorant con otro jugador')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord con cuenta vinculada'))
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('O el Riot ID del otro jugador, ej: Nombre#LAS')),

    // Prefijo: !comparar @alguien  o  !comparar Nombre#TAG
    async execute(context, args = []) {
        const selfId = context.author?.id || context.user?.id;
        const self = await getValorantLink(selfId);
        if (!self) return warning('Primero vincula tu cuenta con `/vincular Nombre#TAG`.');

        const hasOther = context.options?.getUser?.('usuario') || context.options?.getString?.('riotid') || args.length;
        if (!hasOther) return warning('Elige con quién compararte: `/comparar usuario:@alguien` o `/comparar riotid:Nombre#LAS`.');

        const other = await resolveTarget(context, args, 'comparar');
        if (other.error) return warning(other.error);

        if (context.deferReply) await context.deferReply();
        else await context.channel?.sendTyping?.();

        let a;
        let b;
        try {
            [a, b] = await Promise.all([loadPlayerStats(self), loadPlayerStats(other)]);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        if (a.account.puuid === b.account.puuid) return warning('No te puedes comparar contigo mismo 😄');

        const rows = [
            ['Rango', p => translateRank(p.mmr?.current_data?.currenttierpatched), p => p.mmr?.current_data?.elo ?? 0],
            ['Winrate', p => `${p.summary.winrate}%`, p => p.summary.winrate],
            ['K/D', p => p.summary.kd, p => Number(p.summary.kd)],
            ['HS%', p => `${p.summary.hs}%`, p => p.summary.hs],
            ['ADR', p => String(p.summary.adr), p => p.summary.adr],
            ['ACS', p => String(p.summary.acs), p => p.summary.acs],
            ['Main', p => topAgents(p.summary, 1)[0]?.[0] || '-', null]
        ];

        const column = (player, rival) => rows.map(([label, show, score]) => {
            const better = score && score(player) > score(rival) ? ' ✅' : '';
            return `**${label}:** ${show(player)}${better}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('⚔️ Comparación')
            .addFields(
                { name: `${a.account.name}#${a.account.tag}`, value: column(a, b), inline: true },
                { name: `${b.account.name}#${b.account.tag}`, value: column(b, a), inline: true }
            )
            .setFooter({ text: `Últimas competitivas: ${a.summary.games} vs ${b.summary.games} partidas` });

        return { embeds: [embed] };
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
