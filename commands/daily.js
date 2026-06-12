const { SlashCommandBuilder } = require('discord.js');
const { getUserGarden, saveUserGarden } = require('../utils/db');

const COLORS = { PRIMARY: '#6600ff', WARNING: '#ffaa00' };

module.exports = {
    name: 'daily',
    description: 'Recoger recompensa diaria',
    category: 'principal',
    cooldown: 0,
    
    data: () => new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Recoger recompensa diaria'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const garden = await getUserGarden(userId);
        const now = Date.now();
        
        if (!garden.lastDaily) garden.lastDaily = 0;
        
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - garden.lastDaily < oneDay) {
            const hoursLeft = Math.ceil((oneDay - (now - garden.lastDaily)) / (60 * 60 * 1000));
            
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setTitle('Recompensa Diaria')
                .setDescription(`Ya reclamaste tu recompensa. Vuelve en ${hoursLeft} horas`);
            
            return { embeds: [embed], ephemeral: true };
        }
        
        const seedsGained = 50;
        garden.seeds += seedsGained;
        garden.lastDaily = now;
        await saveUserGarden(userId, garden);
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Recompensa Diaria')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription('Has recibido tu recompensa diaria')
            .addFields(
                { name: 'Semillas Ganadas', value: `+${seedsGained}`, inline: true },
                { name: 'Total', value: String(garden.seeds), inline: true }
            )
            .setFooter({ text: 'Vuelve mañana' });
        
        return { embeds: [embed] };
    }
};