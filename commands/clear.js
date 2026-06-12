const { SlashCommandBuilder } = require('discord.js');
const { clearPlot, getFarm } = require('../utils/ketil');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'clear',
    description: 'Desarraigar arboles de la parcela',
    category: 'principal',
    cooldown: 30,
    
    data: () => new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Desarraigar arboles de la parcela'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        
        if (!farm.plot) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Primero usa /startv para comenzar tu aventura');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await clearPlot(userId);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Arboles Desarraigados')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has eliminado los arboles de tu parcela')
            .addFields({ name: 'Energia Restante', value: `${result.energy}/100`, inline: true })
            .setFooter({ text: 'La tierra esta lista para ser arada' });
        
        return { embeds: [embed] };
    }
};