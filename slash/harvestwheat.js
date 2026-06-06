const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { harvestWheat, getFarm } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvestwheat')
        .setDescription('Cosechar el trigo de tu parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa `/startv` para comenzar tu aventura');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const result = await harvestWheat(interaction.user.id);
        
        if (result.error) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription(result.error);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('Cosecha Exitosa')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .addFields(
                { name: 'Trigo', value: `${result.wheat} unidades`, inline: true },
                { name: 'Monedas Ganadas', value: `+50`, inline: true },
                { name: 'Deuda Restante', value: `${result.debt}` }
            )
            .setFooter({ text: 'Cada cosecha te acerca a la libertad', timestamp: new Date() });
        
        if (result.freed) {
            embed.addFields({ name: '¡LIBERTAD!', value: 'Has pagado tu deuda. Ya no eres esclavo.' });
            embed.setColor('#6600ff');
            assignFreedomRole(interaction, interaction.user.id);
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};

async function assignFreedomRole(interaction, userId) {
    const GUILD_ID = process.env.GUILD_ID;
    const ROLE_ID = process.env.FREEDOM_ROLE_ID;
    
    if (!GUILD_ID || !ROLE_ID) return;
    
    try {
        const guild = await interaction.client.guilds.fetch(GUILD_ID);
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