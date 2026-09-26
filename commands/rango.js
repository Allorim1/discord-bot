const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAccount, getAccountByPuuid, getMMR, getRecentMatches, translateRank, resolveTarget, ValorantApiError } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'rango',
    description: 'Ver el rango y ultimas partidas de un jugador de Valorant',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('rango')
        .setDescription('Ver el rango y ultimas partidas de un jugador de Valorant')
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('Riot ID del jugador, ej: Nombre#LAS (vacio para usar tu cuenta vinculada)'))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord con cuenta vinculada')),

    async execute(context, args = []) {
        const target = await resolveTarget(context, args, 'rango');

        if (target.error) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(target.error);
            return { embeds: [embed], ephemeral: true };
        }

        // La API puede tardar mas de 3 segundos
        if (context.deferReply) await context.deferReply();
        else await context.channel?.sendTyping?.();

        try {
            const account = target.puuid
                ? await getAccountByPuuid(target.puuid)
                : await getAccount(target.name, target.tag);
            return { embeds: [await buildRankEmbed(account)] };
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(error.message);
            return { embeds: [embed] };
        }
    }
};

async function buildRankEmbed(account) {
    const region = account.region;

    const [mmr, matches] = await Promise.all([
        getMMR(region, account.name, account.tag),
        getRecentMatches(region, account.name, account.tag).catch(() => [])
    ]);

    const current = mmr.current_data || {};
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setAuthor({ name: `${account.name}#${account.tag}`, iconURL: account.card?.small })
        .setTitle(translateRank(current.currenttierpatched))
        .setThumbnail(current.images?.large || null)
        .addFields(
            { name: 'RR', value: current.currenttierpatched ? `${current.ranking_in_tier}/100` : '-', inline: true },
            { name: 'Última partida', value: formatChange(current.mmr_change_to_last_game), inline: true },
            { name: 'Nivel', value: String(account.account_level ?? '-'), inline: true }
        )
        .setFooter({ text: `Región: ${region.toUpperCase()}` });

    if (mmr.highest_rank?.patched_tier) {
        embed.addFields({
            name: 'Rango más alto',
            value: `${translateRank(mmr.highest_rank.patched_tier)} (${mmr.highest_rank.season?.toUpperCase() || '?'})`,
            inline: true
        });
    }

    const lines = (matches || []).map(match => formatMatch(match, account)).filter(Boolean);
    if (lines.length) {
        embed.addFields({ name: 'Últimas competitivas', value: lines.join('\n') });
    }

    if (account.card?.wide) embed.setImage(account.card.wide);
    return embed;
}

function formatChange(change) {
    if (change === undefined || change === null) return '-';
    return change >= 0 ? `+${change} RR` : `${change} RR`;
}

function formatMatch(match, account) {
    const player = match.players?.all_players?.find(p => p.puuid === account.puuid);
    if (!player) return null;

    const team = match.teams?.[player.team?.toLowerCase()];
    const won = team?.has_won;
    const result = won ? '✅' : (team && team.rounds_won === team.rounds_lost ? '➖' : '❌');
    const score = team ? `${team.rounds_won}-${team.rounds_lost}` : '';
    const { kills, deaths, assists } = player.stats || {};

    return `${result} **${match.metadata?.map || '?'}** ${score} · ${player.character} · ${kills}/${deaths}/${assists}`;
}
