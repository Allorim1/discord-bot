const { getPlayerData, savePlayerData } = require('../utils/game');

const RAIDS = [
    { id: 'coastal_village', name: 'Aldea Costera', karma: -10, rewards: { coins: 100, wood: 50 } },
    { id: 'merchant_ship', name: 'Barco Mercante', karma: -15, rewards: { coins: 150, iron: 30 } },
    { id: 'rich_merchant', name: 'Mercader Rico', karma: -5, rewards: { coins: 75 } }
];

module.exports = {
    name: 'raid',
    description: 'Asaltar objetivos (Mercenario)',
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('Uso: !raid <objetivo> - Opciones: coastal_village, merchant_ship, rich_merchant');
        }
        
        const target = RAIDS.find(r => r.id === args[0].toLowerCase() || r.name.toLowerCase().includes(args[0].toLowerCase()));
        
        if (!target) {
            return message.reply('❌ Objetivo no válido. Opciones: coastal_village, merchant_ship, rich_merchant');
        }
        
        const player = await getPlayerData(message.author.id);
        
        if (player.founded) {
            return message.reply('❌ Ya fundaste tu colonia. Usa !manage para gobernar.');
        }
        
        let success = Math.random() > 0.2;
        
        if (!success) {
            player.karma = (player.karma || 0) - 5;
            await savePlayerData(message.author.id, player);
            return message.reply(`❌ El escuadrón de Ketil te descubrió. Karma: ${player.karma}`);
        }
        
        player.coins += target.rewards.coins || 0;
        if (target.rewards.wood) player.resources.wood += target.rewards.wood;
        if (target.rewards.iron) player.resources.iron += target.rewards.iron;
        player.karma = (player.karma || 0) + target.karma;
        player.crew = (player.crew || 0) + 1;
        
        await savePlayerData(message.author.id, player);
        
        message.reply(`⚔️ Has asaltado **${target.name}**.\nRecompensas: 💰 +${target.rewards.coins || 0} | 🪵 +${target.rewards.wood || 0} | ⛏️ +${target.rewards.iron || 0}\nKarma: ${player.karma}`);
    }
};