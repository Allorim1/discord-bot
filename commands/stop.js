const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

const COLORS = { PRIMARY: '#6600ff', SUCCESS: '#00ff88', ERROR: '#ff4444' };

module.exports = {
    name: 'stop',
    description: 'Detener la música',
    category: 'musica',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detener la música'),
    
    async execute(context) {
        const queue = useMainPlayer()?.queues?.get?.(context.guild?.id || context.guildId);
        
        if (!queue) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('No hay música reproduciéndose.');
            return { embeds: [embed], ephemeral: true };
        }
        
        queue?.destroy?.();
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription('⏹️ Música detenida');
        
        return { embeds: [embed] };
    }
};