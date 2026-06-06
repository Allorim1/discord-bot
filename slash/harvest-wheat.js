const { SlashCommandBuilder } = require('discord.js');
const { harvestWheat, getFarm } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Cosechar el trigo de tu parcela'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        
        if (!farm.plot) {
            return interaction.reply({ content: '❌ Primero usa `/startv` para comenzar tu aventura.', ephemeral: true });
        }
        
        const result = await harvestWheat(interaction.user.id);
        
        if (result.error) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }
        
        let msg = `✅ Has cosechado trigo. Ahora tienes ${result.wheat} trigo(s). Deuda restante: ${result.debt} monedas.`;
        
        if (result.freed) {
            msg += '\n\n🎉 ¡HAS LOGRADO TU LIBERTAD! Ya no eres esclavo. Puedes viajar a nuevas tierras.';
            assignFreedomRole(interaction, interaction.user.id);
        }
        
        await interaction.reply(msg);
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