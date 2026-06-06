const { getPlayerData, getSettlement, savePlayerData, saveSettlement } = require('../utils/game');

module.exports = {
    name: 'manage',
    description: 'Administrar tu colonia',
    async execute(message, args) {
        const settlement = await getSettlement(message.author.id);
        
        if (!settlement) {
            return message.reply('❌ No has fundado una colonia. Usa !settle <nombre> primero.');
        }
        
        const player = await getPlayerData(message.author.id);
        const isTyrant = player.karma < 0;
        
        if (!args[0]) {
            return message.reply(`🏰 **Gobierno de ${settlement.name}**\n\n👑 Ruta: ${isTyrant ? 'Tirano 👑' : 'Rey Canute ⚖️'}\n👥 Población: ${settlement.population}\n💰 Tesoría: ${settlement.resources.wood} 🪵 | ${settlement.resources.iron} ⛏️\n\nAcciones: ${isTyrant ? '!tax, !slavery' : '!trade, !defense'}`);
        }
        
        const action = args[0].toLowerCase();
        
        if (action === 'tax' && isTyrant) {
            settlement.taxRate = (settlement.taxRate || 0) + 5;
            player.coins += 100;
            await savePlayerData(message.author.id, player);
            await saveSettlement(message.author.id, settlement);
            return message.reply(`💰 Cobraste impuestos. +100 monedas. Tasa: ${settlement.taxRate}%`);
        }
        
        if (action === 'slavery' && isTyrant) {
            const cost = 200;
            if (player.coins >= cost) {
                player.coins -= cost;
                player.resources.slaves = (player.resources.slaves || 0) + 2;
                settlement.population += 2;
                await savePlayerData(message.author.id, player);
                await saveSettlement(message.author.id, settlement);
                return message.reply('⛓️ Has adquirido 2 esclavos para tu colonia');
            }
            return message.reply('❌ Necesitas 200 monedas');
        }
        
        if (action === 'trade' && !isTyrant) {
            player.coins += 150;
            await savePlayerData(message.author.id, player);
            return message.reply('🚢 Has creado una ruta comercial. +150 monedas');
        }
        
        if (action === 'defense' && !isTyrant) {
            settlement.buildings.barracks = (settlement.buildings.barracks || 0) + 1;
            await saveSettlement(message.author.id, settlement);
            return message.reply(`🛡️ Has fortificado tu colonia. Barracas: ${settlement.buildings.barracks}`);
        }
        
        message.reply(`❌ Acción no válida. Usa ${isTyrant ? '!tax o !slavery' : '!trade o !defense'}`);
    }
};