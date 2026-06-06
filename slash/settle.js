const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData, saveSettlement, getSettlement, getAllSettlements } = require('../utils/game');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settle')
        .setDescription('Fundar una colonia')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de tu colonia')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('nombre');
        const player = await getPlayerData(interaction.user.id);
        
        if (!player.resources.fertile_coords) {
            return interaction.reply({ content: '❌ Necesitas descubrir coordenadas fértiles primero. Usa `/explore`.', ephemeral: true });
        }
        
        const hasSettlement = Object.values(await getAllSettlements()).some(s => s.ownerId === interaction.user.id);
        if (hasSettlement) {
            return interaction.reply({ content: '❌ Ya tienes una colonia fundada. Usa `/manage` para administrarla.', ephemeral: true });
        }
        
        const settlement = {
            name,
            ownerId: interaction.user.id,
            karma: player.karma,
            population: player.crew || 1,
            buildings: {
                farm: 1,
                barracks: player.karma < 0 ? 1 : 0,
                market: player.karma >= 0 ? 1 : 0
            },
            resources: {
                wheat: 0,
                wood: 0,
                iron: 0
            },
            taxRate: 0,
            createdAt: Date.now()
        };
        
        await saveSettlement(interaction.user.id, settlement);
        player.founded = true;
        await savePlayerData(interaction.user.id, player);
        
        await interaction.reply(`🏰 Has fundado tu colonia **${name}** con ${settlement.population} colonos. Usa \`/manage\` para gobernar.`);
    }
};