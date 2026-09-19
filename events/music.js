const { Player } = require('discord-player');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot conectado como ${client.user.tag}`);

        // Initialize player (Player requires the Discord client as first argument)
        try {
            const player = new Player(client);
            module.exports.player = player;
            await player.extractors.register(require('discord-player-ytdl2'));
            console.log('Music player initialized');
        } catch (error) {
            console.error('Error initializing music player:', error.message);
        }
    }
};
