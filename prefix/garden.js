const { EmbedBuilder } = require('discord.js');
const { getUserGarden, checkReadyPlants, getPlantTypes } = require('../utils/db');

module.exports = {
    name: 'garden',
    description: 'Ver tu jardin',
    async execute(message) {
        const userId = message.author.id;
        const garden = await getUserGarden(userId);
        await checkReadyPlants(userId);
        const plants = await getPlantTypes();
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle(`${message.author.username} - Jardin`)
            .setAuthor({
                name: 'Mini Juego',
                iconURL: message.client.user.displayAvatarURL()
            })
            .addFields(
                { name: 'Semillas', value: garden.seeds.toString(), inline: true },
                { name: 'Monedas', value: garden.coins.toString(), inline: true }
            )
            .setFooter({ text: 'Juego secundario de cultivo' });
        
        if (garden.plants.length === 0) {
            embed.addFields({ name: 'Plantas', value: 'No tienes plantas. Planta alguna con !plant' });
        } else {
            let plantList = '';
            for (let i = 0; i < garden.plants.length; i++) {
                const plant = garden.plants[i];
                const plantData = plants.find(p => p.id === plant.type);
                plantList += `${i + 1}. ${plantData.name} - ${plant.ready ? 'Lista' : 'Creciendo...'}\n`;
            }
            embed.addFields({ name: 'Plantas', value: plantList });
        }
        
        message.reply({ embeds: [embed] });
    }
};