const { EmbedBuilder } = require('discord.js');
const { startAdventure, getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    name: 'startv',
    description: 'Comenzar tu aventura en la granja de Ketil',
    async execute(message) {
        const result = await startAdventure(message.author.id);
        
        if (result.error) {
            return message.reply(`❌ ${result.error}`);
        }
        
        const farm = await getFarm(message.author.id);
        const energy = await getEnergy(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#8b4513')
            .setTitle('🏞️ Granja de Ketil')
            .setDescription(`Has comenzado tu aventura como esclavo en la granja de Ketil.\nTe han asignado una parcela baldía.\n\n💰 Deuda: ${farm.debt} monedas de oro\n⚡ Energía: ${energy}/100`);
        
        await message.reply({ embeds: [embed] });
    }
};