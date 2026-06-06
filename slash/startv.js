const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { startAdventure, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startv')
        .setDescription('Comenzar tu aventura como esclavo en la granja de Ketil'),
    async execute(interaction) {
        const result = await startAdventure(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }
        
        const farm = await getFarm(interaction.user.id);
        const energy = await getEnergy(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setColor('#8b4513')
            .setTitle('🏞️ Granja de Ketil')
            .setDescription(`Has comenzado tu aventura como esclavo en la granja de Ketil.\nTe han asignado una parcela baldía.\n\n💰 Deuda: ${farm.debt} monedas de oro\n⚡ Energía: ${energy}/${100}`);
        
        await interaction.reply({ embeds: [embed] });
    }
};