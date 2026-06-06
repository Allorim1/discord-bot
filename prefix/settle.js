const { savePlayerData, saveSettlement, getPlayerData, getAllSettlements } = require('../utils/game');

module.exports = {
    name: 'settle',
    description: 'Fundar una colonia',
    async execute(message, args) {
        const name = args.join(' ');
        
        if (!name) {
            return message.reply('Uso: !settle <nombre>');
        }
        
        const player = await getPlayerData(message.author.id);
        
        if (!player.resources.fertile_coords) {
            return message.reply('❌ Necesitas descubrir coordenadas fértiles primero. Usa !explore.');
        }
        
        const hasSettlement = Object.values(await getAllSettlements()).some(s => s.ownerId === message.author.id);
        if (hasSettlement) {
            return message.reply('❌ Ya tienes una colonia fundada. Usa !manage para administrarla.');
        }
        
        const settlement = {
            name,
            ownerId: message.author.id,
            karma: player.karma,
            population: player.crew || 1,
            buildings: {
                farm: 1,
                barracks: player.karma < 0 ? 1 : 0,
                market: player.karma >= 0 ? 1 : 0
            },
            resources: {
                wheat: 0,
                wood: 0,
                iron: 0
            },
            taxRate: 0,
            createdAt: Date.now()
        };
        
        await saveSettlement(message.author.id, settlement);
        player.founded = true;
        await savePlayerData(message.author.id, player);
        
        message.reply(`🏰 Has fundado tu colonia **${name}** con ${settlement.population} colonos. Usa !manage para gobernar.`);
    }
};