const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COLORS = { PRIMARY: '#6600ff', SUCCESS: '#00ff88', ERROR: '#ff4444' };

module.exports = {
    name: 'play',
    description: 'Reproducir música (En desarrollo)',
    category: 'musica',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproducir música')
        .addStringOption(option =>
            option.setName('busqueda')
                .setDescription('URL de YouTube o término')
                .setRequired(true)),
    
    async execute(context, args) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎵 Comando de Música')
            .setDescription('Sistema de música en desarrollo.\nPróximamente: reproducción desde YouTube/Spotify')
            .addFields(
                { name: 'Disponible', value: '!play <url>', inline: true },
                { name: 'Requiere', value: 'Canal de voz', inline: true }
            );
        
        return { embeds: [embed] };
    }
};