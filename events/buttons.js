const { getPlayerData, savePlayerData, getSettlement, saveSettlement, getAllSettlements } = require('../utils/game');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;
        
        const settlement = await getSettlement(interaction.user.id);
        if (!settlement) return;
        
        const player = await getPlayerData(interaction.user.id);
        const isTyrant = player.karma < 0;
        
        switch (interaction.customId) {
            case 'tax_collect':
                if (isTyrant) {
                    settlement.taxRate = (settlement.taxRate || 0) + 5;
                    player.coins += 100;
                    await savePlayerData(interaction.user.id, player);
                    await saveSettlement(interaction.user.id, settlement);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#ef4444')
                        .setTitle('Impuestos Cobrados')
                        .setDescription(`+100 monedas. Tasa: ${settlement.taxRate}%`);
                    
                    await interaction.reply({ embeds: [embed] });
                }
                break;
                
            case 'slavery':
                if (isTyrant) {
                    const cost = 200;
                    if (player.coins >= cost) {
                        player.coins -= cost;
                        player.resources.slaves = (player.resources.slaves || 0) + 2;
                        settlement.population += 2;
                        await savePlayerData(interaction.user.id, player);
                        await saveSettlement(interaction.user.id, settlement);
                        
                        const embed = new EmbedBuilder()
                            .setColor('#ef4444')
                            .setTitle('Esclavitud')
                            .setDescription('Has adquirido 2 esclavos para tu colonia');
                        
                        await interaction.reply({ embeds: [embed] });
                    } else {
                        await interaction.reply({ content: 'Necesitas 200 monedas', ephemeral: true });
                    }
                }
                break;
                
            case 'trade_route':
                if (!isTyrant) {
                    const allSettlements = await getAllSettlements();
                    const otherSettlements = Object.entries(allSettlements).filter(([id]) => id !== interaction.user.id.toString());
                    
                    if (otherSettlements.length > 0) {
                        const [_, other] = otherSettlements[Math.floor(Math.random() * otherSettlements.length)];
                        player.coins += 150;
                        await savePlayerData(interaction.user.id, player);
                        
                        const embed = new EmbedBuilder()
                            .setColor('#22c55e')
                            .setTitle('Ruta Comercial')
                            .setDescription(`Has creado una ruta comercial con ${other.name}. +150 monedas`);
                        
                        await interaction.reply({ embeds: [embed] });
                    } else {
                        player.coins += 50;
                        await savePlayerData(interaction.user.id, player);
                        
                        const embed = new EmbedBuilder()
                            .setColor('#22c55e')
                            .setTitle('Ruta Comercial')
                            .setDescription('+50 monedas');
                        
                        await interaction.reply({ embeds: [embed] });
                    }
                }
                break;
                
            case 'defense':
                if (!isTyrant) {
                    settlement.buildings.barracks = (settlement.buildings.barracks || 0) + 1;
                    await saveSettlement(interaction.user.id, settlement);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#3b82f6')
                        .setTitle('Fortificacion')
                        .setDescription(`Has fortificado tu colonia. Barracas: ${settlement.buildings.barracks}`);
                    
                    await interaction.reply({ embeds: [embed] });
                }
                break;
        }
    }
};