const { harvestPlant, getUserGarden } = require('../utils/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'harvest',
    description: 'Cosechar una planta',
    async execute(message, args) {
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Debes especificar que planta cosechar. Usa !garden para ver tus plantas');
            return message.reply({ embeds: [embed] });
        }
        
        const plantIndex = parseInt(args[0]) - 1;
        const garden = await getUserGarden(message.author.id);
        
        if (plantIndex < 0 || plantIndex >= garden.plants.length) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Planta no valida. Revisa tu jardin con !garden');
            return message.reply({ embeds: [embed] });
        }
        
        const result = await harvestPlant(message.author.id, plantIndex);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has cosechado una planta')
            .addFields(
                { name: 'Ganancia', value: `+${result.sellPrice} monedas`, inline: true },
                { name: 'Total', value: `${result.coins}`, inline: true }
            )
            .setFooter({ text: 'Buen trabajo agricultor' });
        
        message.reply({ embeds: [embed] });
    }
};