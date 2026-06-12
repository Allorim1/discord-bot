const { SlashCommandBuilder } = require('discord.js');
const { harvestWheat, getFarm } = require('../utils/ketil');

const COLORS = { PRIMARY: '#6600ff', SUCCESS: '#00ff88', ERROR: '#ff4444' };

async function assignFreedomRole(context, userId) {
    const GUILD_ID = process.env.GUILD_ID;
    const ROLE_ID = process.env.FREEDOM_ROLE_ID;
    if (!GUILD_ID || !ROLE_ID) return;
    
    try {
        const guild = await context.client?.guilds?.fetch(GUILD_ID) || context.client?.guilds?.cache?.first();
        const member = await guild?.members?.fetch(userId);
        const role = await guild?.roles?.fetch(ROLE_ID);
        if (role && member) await member.roles.add(role);
    } catch (error) {
        console.error('Error assigning freedom role:', error);
    }
}

module.exports = {
    name: 'harvestwheat',
    description: 'Cosechar el trigo de tu parcela',
    category: 'principal',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('harvestwheat')
        .setDescription('Cosechar el trigo de tu parcela'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        
        if (!farm.plot) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Primero usa /startv para comenzar tu aventura');
            return { embeds: [embed], ephemeral: true };
        }
        
        const result = await harvestWheat(userId);
        
        if (result?.error) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }
        
        const { EmbedBuilder } = require('discord.js');
        let color = COLORS.SUCCESS;
        let extraField = null;
        
        if (result.freed) {
            color = COLORS.PRIMARY;
            extraField = { name: '¡LIBERTAD!', value: 'Has pagado tu deuda. Ya no eres esclavo.' };
            await assignFreedomRole(context, userId);
        }
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .addFields(
                { name: 'Trigo', value: `${result.wheat} unidades`, inline: true },
                { name: 'Monedas Ganadas', value: '+50', inline: true },
                { name: 'Deuda Restante', value: `${result.debt}` }
            );
        
        if (extraField) embed.addFields(extraField);
        embed.setFooter({ text: 'Cada cosecha te acerca a la libertad' });
        
        return { embeds: [embed] };
    }
};