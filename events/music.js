const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { useMainPlayer } = require('discord-player');

const player = new Player({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates]
});

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot conectado como ${client.user.tag}`);
        
        // Initialize player
        try {
            await player.extractors.register(require('discord-player-ytdl2'));
            console.log('Music player initialized');
        } catch (error) {
            console.error('Error initializing music player:', error.message);
        }
    }
};

module.exports.player = player;