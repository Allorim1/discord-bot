const { SlashCommandBuilder } = require('discord.js');
const { plantWheat, getFarm } = require('../utils/ketil');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'plantwheat',
    description: 'Plantar trigo en la parcela',
    category: 'principal',
    cooldown: 10,
    
    data: () => new SlashCommandBuilder()
        .setName('plantwheat')
        .setDescription('Plantar trigo en la parcela'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        
        if (!farm.plot) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Primero usa /startv para comenzar tu aventura');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await plantWheat(userId);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Trigo Sembrado')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has plantado trigo en tu parcela')
            .addFields(
                { name: 'Tiempo de Crecimiento', value: '5 minutos', inline: true },
                { name: 'Energia Restante', value: `${result.energy}/100`, inline: true }
            )
            .setFooter({ text: 'Espera a que el trigo este listo para cosechar' });
        
        return { embeds: [embed] };
    }
};