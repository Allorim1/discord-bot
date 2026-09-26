const { EmbedBuilder } = require('discord.js');
const { getMaps, findByName, translateRank } = require('./valorant');

const COLORS = { WIN: '#3ba55d', LOSS: '#ff4655', DRAW: '#99aab5' };

const MODE_NAMES = {
    competitive: 'Competitivo',
    unrated: 'No clasificado',
    swiftplay: 'Swiftplay',
    premier: 'Premier'
};

const TEAM_NAMES = { red: 'Equipo Rojo', blue: 'Equipo Azul' };

function pad(text, width) {
    const str = String(text ?? '');
    return str.length > width ? str.slice(0, width - 1) + '…' : str.padEnd(width);
}

function formatRR(change) {
    if (change === undefined || change === null) return null;
    return change >= 0 ? `+${change} RR` : `${change} RR`;
}

function teamTable(players, rounds, highlightPuuid) {
    const rows = players
        .map(p => ({ ...p, acs: Math.round((p.stats?.score || 0) / Math.max(rounds, 1)) }))
        .sort((a, b) => b.acs - a.acs)
        .map(p => {
            const { kills = 0, deaths = 0, assists = 0 } = p.stats || {};
            const marker = p.puuid === highlightPuuid ? '▶' : ' ';
            return `${marker}${pad(p.name, 12)} ${pad(p.character, 9)} ${pad(translateRank(p.currenttier_patched), 12)} ${pad(`${kills}/${deaths}/${assists}`, 8)} ${p.acs}`;
        });

    const header = ` ${pad('Jugador', 12)} ${pad('Agente', 9)} ${pad('Rango', 12)} ${pad('K/D/A', 8)} ACS`;
    return '```\n' + [header, ...rows].join('\n') + '\n```';
}

// Arma el embed estilo tabla con los 10 jugadores de una partida.
// highlightPuuid: jugador consultado; rrChange: RR ganado/perdido (solo competitivo)
async function buildMatchEmbed(match, highlightPuuid, rrChange) {
    const meta = match.metadata || {};
    const players = match.players?.all_players || [];
    const rounds = meta.rounds_played || 1;
    const player = players.find(p => p.puuid === highlightPuuid);

    const myTeamKey = player?.team?.toLowerCase() || 'red';
    const otherTeamKey = myTeamKey === 'red' ? 'blue' : 'red';
    const myTeam = match.teams?.[myTeamKey];

    let result = 'Empate';
    let color = COLORS.DRAW;
    if (myTeam?.has_won) {
        result = 'Victoria';
        color = COLORS.WIN;
    } else if (myTeam && myTeam.rounds_won !== myTeam.rounds_lost) {
        result = 'Derrota';
        color = COLORS.LOSS;
    }

    const score = myTeam ? `${myTeam.rounds_won}-${myTeam.rounds_lost}` : '';
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${result} · ${meta.map || '?'} · ${score}`)
        .setFooter({ text: MODE_NAMES[meta.mode?.toLowerCase()] || meta.mode || 'Partida' });

    if (meta.game_start) embed.setTimestamp(meta.game_start * 1000);

    if (player) {
        const { kills = 0, deaths = 0, assists = 0 } = player.stats || {};
        const parts = [
            `**${player.name}#${player.tag}**`,
            player.character,
            `${kills}/${deaths}/${assists}`,
            formatRR(rrChange)
        ].filter(Boolean);
        embed.setDescription(parts.join(' · '));
        if (player.assets?.agent?.small) embed.setAuthor({ name: translateRank(player.currenttier_patched), iconURL: player.assets.agent.small });
    }

    for (const teamKey of [myTeamKey, otherTeamKey]) {
        const teamPlayers = players.filter(p => p.team?.toLowerCase() === teamKey);
        if (!teamPlayers.length) continue;
        const team = match.teams?.[teamKey];
        embed.addFields({
            name: `${TEAM_NAMES[teamKey]}${team ? ` (${team.rounds_won})` : ''}`,
            value: teamTable(teamPlayers, rounds, highlightPuuid)
        });
    }

    try {
        const map = findByName(await getMaps(), meta.map || '');
        if (map?.listViewIcon) embed.setThumbnail(map.listViewIcon);
    } catch {
        // La imagen del mapa es opcional
    }

    return embed;
}

module.exports = {
    buildMatchEmbed,
    formatRR
};
