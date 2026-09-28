const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resolveTarget, translateRank, ValorantApiError } = require('../utils/valorant');
const { MATCHES, loadPlayerStats, topAgents, bestAndWorstMap } = require('../utils/valstats');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'stats',
    description: 'Estadisticas de las ultimas competitivas de un jugador de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Estadisticas de las ultimas competitivas de un jugador de Valorant')
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('Riot ID del jugador, ej: Nombre#LAS (vacio para usar tu cuenta vinculada)'))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord con cuenta vinculada')),

    async execute(context, args = []) {
        const target = await resolveTarget(context, args, 'stats');
        if (target.error) return warning(target.error);

        if (context.deferReply) await context.deferReply();
        else await context.channel?.sendTyping?.();

        let data;
        try {
            data = await loadPlayerStats(target);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        const { account, mmr, summary } = data;
        if (!summary.games) return warning(`**${account.name}#${account.tag}** no tiene competitivas recientes.`);

        const current = mmr?.current_data;
        const { best, worst } = bestAndWorstMap(summary);
        const agents = topAgents(summary).map(([name, games]) => `${name} (${games})`).join(', ');

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setAuthor({ name: `${account.name}#${account.tag}` })
            .setTitle(`Últimas ${summary.games} competitivas`)
            .setThumbnail(current?.images?.large || null)
            .addFields(
                { name: 'Rango', value: translateRank(current?.currenttierpatched), inline: true },
                { name: 'Victorias', value: `${summary.wins}/${summary.games} (${summary.winrate}%)`, inline: true },
                { name: 'K/D', value: summary.kd, inline: true },
                { name: 'K/D/A promedio', value: `${avg(summary.kills, summary)}/${avg(summary.deaths, summary)}/${avg(summary.assists, summary)}`, inline: true },
                { name: 'HS%', value: `${summary.hs}%`, inline: true },
                { name: 'ADR · ACS', value: `${summary.adr} · ${summary.acs}`, inline: true },
                { name: 'Agentes más jugados', value: agents || '-' }
            )
            .setFooter({ text: `Basado en hasta ${MATCHES} partidas competitivas` });

        if (best) {
            embed.addFields(
                { name: '🟢 Mejor mapa', value: `${best.name} · ${best.winrate}% (${best.games} partidas)`, inline: true },
                { name: '🔴 Peor mapa', value: `${worst.name} · ${worst.winrate}% (${worst.games} partidas)`, inline: true }
            );
        }

        return { embeds: [embed] };
    }
};

function avg(value, summary) {
    return (value / summary.games).toFixed(1);
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
