const { SlashCommandBuilder } = require('discord.js');
const { tillSoil, getFarm } = require('../utils/ketil');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'till',
    description: 'Arar la tierra de la parcela',
    category: 'principal',
    cooldown: 30,
    
    data: () => new SlashCommandBuilder()
        .setName('till')
        .setDescription('Arar la tierra de la parcela'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        
        if (!farm.plot) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Primero usa /startv para comenzar tu aventura');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await tillSoil(userId);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Tierra Arada')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has arado la tierra. La parcela esta lista para sembrar')
            .addFields({ name: 'Energia Restante', value: `${result.energy}/100`, inline: true })
            .setFooter({ text: 'Prepara la semilla para plantar' });
        
        return { embeds: [embed] };
    }
};