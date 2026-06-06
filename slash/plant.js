const { SlashCommandBuilder } = require('discord.js');
const { plantSeed } = require('../utils/db');

const PLANTS = [
    { name: 'Trigo', value: 'wheat' },
    { name: 'Zanahoria', value: 'carrot' },
    { name: 'Tomate', value: 'tomato' },
    { name: 'Maíz', value: 'corn' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plant')
        .setDescription('Plantar una semilla')
        .addStringOption(option =>
            option.setName('planta')
                .setDescription('Tipo de planta a plantar')
                .setRequired(true)
                .addChoices(...PLANTS)),
    async execute(interaction) {
        const plantType = interaction.options.getString('planta').toLowerCase();
        
        const result = await plantSeed(interaction.user.id, plantType);
        
        if (result.error) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }
        
        const plantName = PLANTS.find(p => p.value === plantType)?.name || plantType;
        await interaction.reply(`✅ Has plantado ${plantName}! Te quedan ${result.seeds} semillas.`);
    }
};