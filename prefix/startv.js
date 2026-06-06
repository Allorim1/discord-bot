const { EmbedBuilder } = require('discord.js');
const { startAdventure, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    name: 'startv',
    description: 'Comenzar tu aventura en la granja de Ketil',
    async execute(message) {
        const result = await startAdventure(message.author.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const farm = await getFarm(message.author.id);
        const energy = await getEnergy(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Granjas de Ketil')
            .setAuthor({
                name: `Bienvenido, ${message.author.username}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has comenzado tu aventura como esclavo.\nTe han asignado una parcela baldida.')
            .addFields(
                { name: 'Deuda', value: `${farm.debt} monedas de oro`, inline: true },
                { name: 'Energia', value: `${energy}/100`, inline: true }
            )
            .setFooter({ text: 'Tu camino hacia la libertad empieza ahora' });
        
        message.reply({ embeds: [embed] });
    }
};