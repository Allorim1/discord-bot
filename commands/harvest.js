const { SlashCommandBuilder } = require('discord.js');
const { harvestPlant, getUserGarden } = require('../utils/db');

const COLORS = { SUCCESS: '#00ff88', ERROR: '#ff4444' };

module.exports = {
    name: 'harvest',
    description: 'Cosechar una planta',
    category: 'jardin',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Cosechar una planta')
        .addIntegerOption(option =>
            option.setName('numero')
                .setDescription('Numero de planta a cosechar')
                .setRequired(true)),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        
        let plantIndex;
        if (context.options?.getInteger) {
            plantIndex = context.options.getInteger('numero') - 1;
        } else {
            plantIndex = parseInt(args[0]) - 1;
        }
        
        const garden = await getUserGarden(userId);
        
        if (plantIndex < 0 || plantIndex >= garden.plants.length) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Planta no valida. Revisa tu jardin con /garden.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await harvestPlant(userId, plantIndex);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has cosechado una planta')
            .addFields(
                { name: 'Ganancia', value: `+${result.sellPrice} monedas`, inline: true },
                { name: 'Total', value: String(result.coins), inline: true }
            )
            .setFooter({ text: 'Buen trabajo agricultor' });
        
        return { embeds: [embed] };
    }
};