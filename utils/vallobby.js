const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { translateRank } = require('./valorant');
const { getValorantRank } = require('./db');

const COLORS = { OPEN: '#ff4655', FULL: '#3ba55d', CLOSED: '#99aab5' };
// Las busquedas se cierran solas despues de este tiempo
const LOBBY_DURATION = 2 * 60 * 60 * 1000;

// lobbyId -> { id, hostId, mode, slots, note, players: [userId], closed, createdAt }
const lobbies = new Map();

function createLobby({ hostId, mode, slots, note }) {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const lobby = { id, hostId, mode, slots, note, players: [], closed: false, createdAt: Date.now() };
    lobbies.set(id, lobby);
    setTimeout(() => lobbies.delete(id), LOBBY_DURATION);
    return lobby;
}

function getLobby(id) {
    return lobbies.get(id) || null;
}

async function rankLabel(userId) {
    const rank = await getValorantRank(userId);
    return rank ? translateRank(rank.rank) : 'sin vincular';
}

async function renderLobby(lobby) {
    const full = lobby.players.length >= lobby.slots;
    const color = lobby.closed ? COLORS.CLOSED : (full ? COLORS.FULL : COLORS.OPEN);
    const status = lobby.closed ? 'Cerrada' : (full ? '¡Completo!' : `Faltan ${lobby.slots - lobby.players.length}`);

    const playerLines = [];
    playerLines.push(`👑 <@${lobby.hostId}> · ${await rankLabel(lobby.hostId)}`);
    for (const userId of lobby.players) {
        playerLines.push(`🎯 <@${userId}> · ${await rankLabel(userId)}`);
    }
    for (let i = lobby.players.length; i < lobby.slots; i++) playerLines.push('⬜ *libre*');

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`Buscando ${lobby.slots === 1 ? 'dúo' : `${lobby.slots} jugadores`} · ${lobby.mode}`)
        .setDescription([lobby.note ? `> ${lobby.note}` : null, playerLines.join('\n')].filter(Boolean).join('\n\n'))
        .setFooter({ text: status })
        .setTimestamp(lobby.createdAt);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`valbuscar:join:${lobby.id}`)
            .setLabel('Unirme')
            .setStyle(ButtonStyle.Success)
            .setDisabled(lobby.closed || full),
        new ButtonBuilder()
            .setCustomId(`valbuscar:leave:${lobby.id}`)
            .setLabel('Salir')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(lobby.closed),
        new ButtonBuilder()
            .setCustomId(`valbuscar:close:${lobby.id}`)
            .setLabel('Cerrar')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(lobby.closed)
    );

    return { embeds: [embed], components: [row], allowedMentions: { parse: [] } };
}

module.exports = {
    createLobby,
    getLobby,
    renderLobby
};
