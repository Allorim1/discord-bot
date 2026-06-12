const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'nowplaying',
    description: 'Ver canción actual',
    category: 'musica',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Ver canción actual'),
    
    async execute(context) {
        const queue = useMainPlayer()?.queues?.get?.(context.guild?.id || context.guildId);
        
        if (!queue || !queue?.currentTrack) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('No hay música reproduciéndose.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const track = queue.currentTrack;
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎵 Ahora sonando')
            .setDescription(`**${track.title}**`)
            .addFields(
                { name: 'Autor', value: track.author, inline: true },
                { name: 'Duración', value: track.duration, inline: true }
            )
            .setThumbnail(track.thumbnail)
            .setFooter({ text: 'Usa /skip para saltar | /stop para detener' });
        
        return { embeds: [embed] };
    }
};