const { SlashCommandBuilder } = require('discord.js');
const { startAdventure, getFarm, getEnergy } = require('../utils/ketil');

const COLORS = {
    PRIMARY: '#6600ff',
    ERROR: '#ff4444',
    SUCCESS: '#00ff88'
};

module.exports = {
    name: 'startv',
    description: 'Comenzar tu aventura como esclavo en la granja de Ketil',
    category: 'principal',
    cooldown: 0,
    
    data: () => new SlashCommandBuilder()
        .setName('startv')
        .setDescription('Comenzar tu aventura como esclavo'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const result = await startAdventure(userId);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const farm = await getFarm(userId);
        const energy = await getEnergy(userId);
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Granjas de Ketil')
            .setAuthor({
                name: `Bienvenido, ${context.author?.username || context.user?.username}`,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has comenzado tu aventura como esclavo.\nTe han asignado una parcela baldida.')
            .addFields(
                { name: 'Deuda', value: `${farm.debt} monedas de oro`, inline: true },
                { name: 'Energia', value: `${energy}/100`, inline: true },
                { name: 'Objetivo', value: 'Pagar la deuda para ganar libertad' }
            )
            .setFooter({ text: 'Tu camino hacia la libertad empieza ahora' });
        
        return { embeds: [embed] };
    }
};