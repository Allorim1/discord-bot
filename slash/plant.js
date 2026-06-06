const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { plantSeed, getPlantTypes } = require('../utils/db');

const PLANTS = [
    { name: 'Trigo', value: 'wheat' },
    { name: 'Zanahoria', value: 'carrot' },
    { name: 'Tomate', value: 'tomato' },
    { name: 'Maiz', value: 'corn' }
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
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const plantName = PLANTS.find(p => p.value === plantType)?.name || plantType;
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Planta Sembrada')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(`Has plantado ${plantName}`)
            .addFields({ name: 'Semillas Restantes', value: `${result.seeds}`, inline: true })
            .setFooter({ text: 'Espera a que la planta este lista' });
        
        await interaction.reply({ embeds: [embed] });
    }
};