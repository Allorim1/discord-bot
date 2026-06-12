const { SlashCommandBuilder } = require('discord.js');
const { plantSeed } = require('../utils/db');

const PLANTS = [
    { name: 'Trigo', value: 'wheat' },
    { name: 'Zanahoria', value: 'carrot' },
    { name: 'Tomate', value: 'tomato' },
    { name: 'Maiz', value: 'corn' }
];

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'plant',
    description: 'Plantar una semilla',
    category: 'jardin',
    cooldown: 10,
    
    data: () => new SlashCommandBuilder()
        .setName('plant')
        .setDescription('Plantar una semilla')
        .addStringOption(option =>
            option.setName('planta')
                .setDescription('Tipo de planta a plantar')
                .setRequired(true)
                .addChoices(...PLANTS)),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        
        // For slash commands
        let plantType;
        if (context.options?.getString) {
            plantType = context.options.getString('planta').toLowerCase();
        } else {
            plantType = args[0]?.toLowerCase();
        }
        
        if (!plantType) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Debes especificar que plantar. Usa !shop para ver opciones');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await plantSeed(userId, plantType);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const plantName = PLANTS.find(p => p.value === plantType)?.name || plantType;
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Planta Sembrada')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(`Has plantado ${plantName}`)
            .addFields({ name: 'Semillas Restantes', value: String(result.seeds), inline: true })
            .setFooter({ text: 'Espera a que la planta este lista' });
        
        return { embeds: [embed] };
    }
};