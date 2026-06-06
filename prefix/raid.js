const { getPlayerData, savePlayerData } = require('../utils/game');
const { EmbedBuilder } = require('discord.js');

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
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Uso: !raid <objetivo>\nOpciones: coastal_village, merchant_ship, rich_merchant');
            return message.reply({ embeds: [embed] });
        }
        
        const target = RAIDS.find(r => r.id === args[0].toLowerCase() || r.name.toLowerCase().includes(args[0].toLowerCase()));
        
        if (!target) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Objetivo no valido.');
            return message.reply({ embeds: [embed] });
        }
        
        const player = await getPlayerData(message.author.id);
        
        if (player.founded) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Ya fundaste tu colonia. Usa !manage para gobernar.');
            return message.reply({ embeds: [embed] });
        }
        
        let success = Math.random() > 0.2;
        
        if (!success) {
            player.karma = (player.karma || 0) - 5;
            await savePlayerData(message.author.id, player);
            
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('Asalto Fallido')
                .setAuthor({
                    name: message.author.username,
                    iconURL: message.author.displayAvatarURL()
                })
                .setDescription('El escuadron de Ketil te ha descubierto. Escapaste pero perdiste reputacion.')
                .addFields({ name: 'Karma', value: `${player.karma}`, inline: true });
            
            return message.reply({ embeds: [embed] });
        }
        
        player.coins += target.rewards.coins || 0;
        if (target.rewards.wood) player.resources.wood += target.rewards.wood;
        if (target.rewards.iron) player.resources.iron += target.rewards.iron;
        player.karma = (player.karma || 0) + target.karma;
        player.crew = (player.crew || 0) + 1;
        
        await savePlayerData(message.author.id, player);
        
        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('Asalto Exitoso')
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL()
            })
            .setDescription(`Has asaltado a **${target.name}**`)
            .addFields(
                { name: 'Recompensas', value: `monedas +${target.rewards.coins || 0}\nmadera +${target.rewards.wood || 0}\nhierro +${target.rewards.iron || 0}`, inline: true },
                { name: 'Karma', value: `${player.karma}`, inline: true },
                { name: 'Tripulacion', value: `+1 (${player.crew})`, inline: true }
            )
            .setFooter({ text: 'La violencia es un camino oscuro...' });
        
        message.reply({ embeds: [embed] });
    }
};