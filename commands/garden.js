const { SlashCommandBuilder } = require('discord.js');
const { getUserGarden, checkReadyPlants, getPlantTypes } = require('../utils/db');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'garden',
    description: 'Ver tu jardin',
    category: 'jardin',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('garden')
        .setDescription('Ver tu jardin'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const garden = await getUserGarden(userId);
        await checkReadyPlants(userId);
        const plants = await getPlantTypes();
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`${context.author?.username || context.user?.username} - Jardin`)
            .setAuthor({
                name: 'Mini Juego',
                iconURL: context.client?.user?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            })
            .addFields(
                { name: 'Semillas', value: String(garden.seeds), inline: true },
                { name: 'Monedas', value: String(garden.coins), inline: true }
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
        
        return { embeds: [embed] };
    }
};