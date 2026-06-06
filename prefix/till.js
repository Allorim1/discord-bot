const { tillSoil, getFarm } = require('../utils/ketil');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'till',
    description: 'Arar la tierra de la parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa !startv para comenzar tu aventura');
            return message.reply({ embeds: [embed] });
        }
        
        const result = await tillSoil(message.author.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Tierra Arada')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has arado la tierra. La parcela esta lista para sembrar')
            .addFields({ name: 'Energia Restante', value: `${result.energy}/100`, inline: true })
            .setFooter({ text: 'Prepara la semilla para plantar' });
        
        message.reply({ embeds: [embed] });
    }
};