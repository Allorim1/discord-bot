const { getPlayerData, savePlayerData } = require('../utils/game');

const EXPEDITION_COST = 50;

module.exports = {
    name: 'explore',
    description: 'Explorar tierras desconocidas (Explorador)',
    async execute(message) {
        const player = await getPlayerData(message.author.id);
        
        if (player.founded) {
            return message.reply('❌ Ya fundaste tu colonia. Usa !manage para gobernar.');
        }
        
        if (player.coins < EXPEDITION_COST) {
            return message.reply(`❌ Necesitas ${EXPEDITION_COST} monedas para explorar.`);
        }
        
        player.coins -= EXPEDITION_COST;
        
        const outcomes = [
            { msg: 'Encontraste un mapa antiguo', reward: { maps: 1 }, karma: 5 },
            { msg: 'Recogiste pieles raras', reward: { rare_pelts: 2 }, karma: 10 },
            { msg: 'Encontraste madera especial', reward: { rare_wood: 3 }, karma: 5 },
            { msg: 'Descubriste coordenadas fértiles', reward: { fertile_coords: true }, karma: 15 },
            { msg: 'Encontraste recursos naturales', reward: { wood: 20, iron: 10 }, karma: 0 }
        ];
        
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        if (outcome.reward.maps) player.resources.maps += outcome.reward.maps;
        if (outcome.reward.rare_pelts) player.resources.rare_pelts += outcome.reward.rare_pelts;
        if (outcome.reward.rare_wood) player.resources.rare_wood += outcome.reward.rare_wood;
        if (outcome.reward.wood) player.resources.wood += outcome.reward.wood;
        if (outcome.reward.iron) player.resources.iron += outcome.reward.iron;
        if (outcome.reward.fertile_coords) player.resources.fertile_coords = true;
        
        player.karma = (player.karma || 0) + outcome.karma;
        
        await savePlayerData(message.author.id, player);
        
        message.reply(`🧭 Expedición exitosa: ${outcome.msg}\nKarma: +${outcome.karma}`);
    }
};