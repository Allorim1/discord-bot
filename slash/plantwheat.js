const { SlashCommandBuilder } = require('discord.js');
const { plantWheat, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantwheat')
        .setDescription('Plantar trigo en la parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            return interaction.reply({ content: '❌ Primero usa `/startv` para comenzar tu aventura.', ephemeral: true });
        }
        
        const result = await plantWheat(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }
        
        await interaction.reply(`✅ Has sembrado trigo. La cosecha tardará 5 minutos. Energía restante: ${result.energy}`);
    }
};