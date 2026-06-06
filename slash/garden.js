const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserGarden, checkReadyPlants, getPlantTypes } = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('garden')
        .setDescription('Ver tu jardin'),
    async execute(interaction) {
        const garden = await getUserGarden(interaction.user.id);
        await checkReadyPlants(interaction.user.id);
        const plants = await getPlantTypes();
        
        const embed = new EmbedBuilder()
            .setColor('#4ade80')
            .setTitle(`Jardin de ${interaction.user.username}`)
            .addFields(
                { name: 'Semillas', value: garden.seeds.toString(), inline: true },
                { name: 'Monedas', value: garden.coins.toString(), inline: true }
            );
        
        if (garden.plants.length === 0) {
            embed.addFields({ name: 'Plantas', value: 'No tienes plantas. Planta alguna!' });
        } else {
            let plantList = '';
            for (let i = 0; i < garden.plants.length; i++) {
                const plant = garden.plants[i];
                const plantData = plants.find(p => p.id === plant.type);
                plantList += `${i + 1}. ${plantData.name} - ${plant.ready ? 'Lista' : 'Creciendo...'}\n`;
            }
            embed.addFields({ name: 'Plantas', value: plantList });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};