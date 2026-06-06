const { SlashCommandBuilder } = require('discord.js');
const { getUserGarden, saveUserGarden } = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Recoger recompensa diaria'),
    async execute(interaction) {
        const garden = await getUserGarden(interaction.user.id);
        const now = Date.now();
        
        if (!garden.lastDaily) garden.lastDaily = 0;
        
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - garden.lastDaily < oneDay) {
            const hoursLeft = Math.ceil((oneDay - (now - garden.lastDaily)) / (60 * 60 * 1000));
            return interaction.reply({ content: `⏰ Ya reclamaste tu recompensa diaria. Vuelve en ${hoursLeft} horas.`, ephemeral: true });
        }
        
        const seedsGained = 50;
        garden.seeds += seedsGained;
        garden.lastDaily = now;
        await saveUserGarden(interaction.user.id, garden);
        
        await interaction.reply(`🎁 Has recibido ${seedsGained} semillas! Total: ${garden.seeds}`);
    }
};