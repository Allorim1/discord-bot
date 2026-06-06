const { clearPlot, getFarm } = require('../utils/ketil');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Desarraigar arboles de la parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa !startv para comenzar tu aventura');
            return message.reply({ embeds: [embed] });
        }
        
        const result = await clearPlot(message.author.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Arboles Desarraigados')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has eliminado los arboles de tu parcela')
            .addFields({ name: 'Energia Restante', value: `${result.energy}/100`, inline: true })
            .setFooter({ text: 'La tierra esta lista para ser arada' });
        
        message.reply({ embeds: [embed] });
    }
};