const { plantWheat, getFarm } = require('../utils/ketil');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'plantwheat',
    description: 'Plantar trigo en la parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa !startv para comenzar tu aventura');
            return message.reply({ embeds: [embed] });
        }
        
        const result = await plantWheat(message.author.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Trigo Sembrado')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has plantado trigo en tu parcela')
            .addFields(
                { name: 'Tiempo de Crecimiento', value: '5 minutos', inline: true },
                { name: 'Energia Restante', value: `${result.energy}/100`, inline: true }
            )
            .setFooter({ text: 'Espera a que el trigo este listo para cosechar' });
        
        message.reply({ embeds: [embed] });
    }
};