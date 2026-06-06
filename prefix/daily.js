const { saveUserGarden } = require('../utils/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Recoger recompensa diaria',
    async execute(message) {
        const { getUserGarden } = require('../utils/db');
        const garden = await getUserGarden(message.author.id);
        const now = Date.now();
        
        if (!garden.lastDaily) garden.lastDaily = 0;
        
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - garden.lastDaily < oneDay) {
            const hoursLeft = Math.ceil((oneDay - (now - garden.lastDaily)) / (60 * 60 * 1000));
            
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('Recompensa Diaria')
                .setDescription(`Ya reclamaste tu recompensa. Vuelve en ${hoursLeft} horas`);
            
            return message.reply({ embeds: [embed] });
        }
        
        const seedsGained = 50;
        garden.seeds += seedsGained;
        garden.lastDaily = now;
        await saveUserGarden(message.author.id, garden);
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Recompensa Diaria')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription('Has recibido tu recompensa diaria')
            .addFields(
                { name: 'Semillas Ganadas', value: `+${seedsGained}`, inline: true },
                { name: 'Total', value: `${garden.seeds}`, inline: true }
            )
            .setFooter({ text: 'Vuelve mañana' });
        
        message.reply({ embeds: [embed] });
    }
};