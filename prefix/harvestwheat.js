const { harvestWheat, getFarm } = require('../utils/ketil');

module.exports = {
    name: 'harvestwheat',
    description: 'Cosechar el trigo de tu parcela',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        
        if (!farm.plot) {
            return message.reply('❌ Primero usa `!startv` para comenzar tu aventura.');
        }
        
        const result = await harvestWheat(message.author.id);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        let msg = `✅ Has cosechado trigo. Ahora tienes ${result.wheat} trigo(s). Deuda restante: ${result.debt} monedas.`;
        
        if (result.freed) {
            msg += '\n\n🎉 ¡HAS LOGRADO TU LIBERTAD! Ya no eres esclavo. Puedes viajar a nuevas tierras.';
            assignFreedomRole(message, message.author.id);
        }
        
        message.reply(msg);
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