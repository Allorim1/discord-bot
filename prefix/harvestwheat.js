const { harvestWheat, getFarm } = require('../utils/ketil');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'harvestwheat',
    description: 'Cosechar el trigo de tu parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa !startv para comenzar tu aventura');
            return message.reply({ embeds: [embed] });
        }
        
        const result = await harvestWheat(message.author.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .addFields(
                { name: 'Trigo', value: `${result.wheat} unidades`, inline: true },
                { name: 'Monedas Ganadas', value: `+50`, inline: true },
                { name: 'Deuda Restante', value: `${result.debt}` }
            )
            .setFooter({ text: 'Cada cosecha te acerca a la libertad' });
        
        if (result.freed) {
            embed.addFields({ name: '¡LIBERTAD!', value: 'Has pagado tu deuda. Ya no eres esclavo.' });
            embed.setColor('#6600ff');
            assignFreedomRole(message, message.author.id);
        }
        
        message.reply({ embeds: [embed] });
    }
};

async function assignFreedomRole(message, userId) {
    const GUILD_ID = process.env.GUILD_ID;
    const ROLE_ID = process.env.FREEDOM_ROLE_ID;
    
    if (!GUILD_ID || !ROLE_ID) return;
    
    try {
        const guild = await message.client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);
        const role = await guild.roles.fetch(ROLE_ID);
        
        if (role && member) {
            await member.roles.add(role);
            console.log(`Assigned freedom role to ${userId}`);
        }
    } catch (error) {
        console.error('Error assigning freedom role:', error);
    }
}