const { getLobby, renderLobby } = require('../utils/vallobby');

// Botones de /buscar: valbuscar:<accion>:<lobbyId>
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton() || !interaction.customId.startsWith('valbuscar:')) return;

        const [, action, lobbyId] = interaction.customId.split(':');
        const lobby = getLobby(lobbyId);
        const userId = interaction.user.id;

        try {
            if (!lobby) {
                return await interaction.reply({ content: 'Esta búsqueda ya expiró.', ephemeral: true });
            }

            if (action === 'join') {
                if (userId === lobby.hostId || lobby.players.includes(userId)) {
                    return await interaction.reply({ content: 'Ya estás en este grupo.', ephemeral: true });
                }
                if (lobby.players.length >= lobby.slots) {
                    return await interaction.reply({ content: 'El grupo ya está completo.', ephemeral: true });
                }
                lobby.players.push(userId);
            } else if (action === 'leave') {
                if (userId === lobby.hostId) {
                    return await interaction.reply({ content: 'Eres quien creó la búsqueda, usa **Cerrar**.', ephemeral: true });
                }
                if (!lobby.players.includes(userId)) {
                    return await interaction.reply({ content: 'No estás en este grupo.', ephemeral: true });
                }
                lobby.players = lobby.players.filter(id => id !== userId);
            } else if (action === 'close') {
                if (userId !== lobby.hostId) {
                    return await interaction.reply({ content: 'Solo quien creó la búsqueda puede cerrarla.', ephemeral: true });
                }
                lobby.closed = true;
            }

            await interaction.update(await renderLobby(lobby));

            // Avisar al creador cuando se llena el grupo
            if (action === 'join' && lobby.players.length >= lobby.slots) {
                const mentions = [lobby.hostId, ...lobby.players];
                await interaction.followUp({
                    content: `✅ ¡Grupo completo! ${mentions.map(id => `<@${id}>`).join(' ')}`,
                    allowedMentions: { users: mentions }
                });
            }
        } catch (error) {
            console.error('Error en botón de /buscar:', error);
        }
    }
};
