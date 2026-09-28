const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { translateRank } = require('../utils/valorant');
const { getAllValorantLinks, getValorantRank } = require('../utils/db');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
const MEDALS = ['🥇', '🥈', '🥉'];
const MAX_ROWS = 20;

module.exports = {
    name: 'valtop',
    description: 'Ranking de Valorant de los miembros del servidor',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('valtop')
        .setDescription('Ranking de Valorant de los miembros del servidor')
        .setDMPermission(false),

    async execute(context) {
        if (!context.guild) return warning('Este comando solo funciona en un servidor.');
        if (context.deferReply) await context.deferReply();

        const players = [];
        for (const link of await getAllValorantLinks()) {
            const member = await context.guild.members.fetch(link.userId).catch(() => null);
            if (!member) continue;
            players.push({ link, member, rank: await getValorantRank(link.userId) });
        }

        if (!players.length) {
            return warning('Nadie en este servidor tiene su cuenta vinculada. Usen `/vincular Nombre#TAG`.');
        }

        // Los que tienen rango primero, ordenados por elo
        players.sort((a, b) => (b.rank?.elo ?? -1) - (a.rank?.elo ?? -1));

        const lines = players.slice(0, MAX_ROWS).map((player, i) => {
            const position = MEDALS[i] || `**${i + 1}.**`;
            const rank = player.rank
                ? `${translateRank(player.rank.rank)} · ${player.rank.rr} RR`
                : '*sin datos todavía*';
            return `${position} **${player.member.displayName}** — ${rank}\n-# ${player.link.name}#${player.link.tag}`;
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`Ranking de Valorant · ${context.guild.name}`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: `${players.length} jugador(es) vinculados · Se actualiza cada pocos minutos` });

        if (context.guild.iconURL()) embed.setThumbnail(context.guild.iconURL());
        return { embeds: [embed] };
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
