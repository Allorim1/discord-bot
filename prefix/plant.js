const { plantSeed, getUserGarden, getPlantTypes } = require('../utils/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'plant',
    description: 'Plantar una semilla',
    async execute(message, args) {
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Debes especificar que plantar. Usa !shop para ver opciones');
            return message.reply({ embeds: [embed] });
        }
        
        const plantType = args[0].toLowerCase();
        const result = await plantSeed(message.author.id, plantType);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const plants = await getPlantTypes();
        const plantName = plants.find(p => p.id === plantType).name;
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Planta Sembrada')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(`Has plantado ${plantName}`)
            .addFields({ name: 'Semillas Restantes', value: `${result.seeds}`, inline: true })
            .setFooter({ text: 'Espera a que la planta este lista' });
        
        message.reply({ embeds: [embed] });
    }
};