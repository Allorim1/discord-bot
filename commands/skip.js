const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

const COLORS = { PRIMARY: '#6600ff', SUCCESS: '#00ff88', ERROR: '#ff4444' };

module.exports = {
    name: 'skip',
    description: 'Saltar canción actual',
    category: 'musica',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Saltar canción actual'),
    
    async execute(context) {
        const queue = useMainPlayer()?.queues?.get?.(context.guild?.id || context.guildId);
        
        if (!queue) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('No hay música reproduciéndose.');
            return { embeds: [embed], ephemeral: true };
        }
        
        await queue?.node?.skip?.();
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription('⏭️ Canción saltada');
        
        return { embeds: [embed] };
    }
};