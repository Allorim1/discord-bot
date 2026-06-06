const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData } = require('../utils/game');

const RAIDS = [
    { id: 'coastal_village', name: 'Aldea Costera', karma: -10, rewards: { coins: 100, wood: 50 } },
    { id: 'merchant_ship', name: 'Barco Mercante', karma: -15, rewards: { coins: 150, iron: 30 } },
    { id: 'rich_merchant', name: 'Mercader Rico', karma: -5, rewards: { coins: 75 } }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Asaltar objetivos (Mercenario)')
        .addStringOption(option =>
            option.setName('objetivo')
                .setDescription('Que asaltar')
                .setRequired(true)
                .addChoices(
                    { name: 'Aldea Costera', value: 'coastal_village' },
                    { name: 'Barco Mercante', value: 'merchant_ship' },
                    { name: 'Mercader Rico', value: 'rich_merchant' }
                )),
    async execute(interaction) {
        const targetId = interaction.options.getString('objetivo');
        const target = RAIDS.find(r => r.id === targetId);
        
        if (!target) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Objetivo no valido');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const player = await getPlayerData(interaction.user.id);
        
        if (player.founded) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Ya fundaste tu colonia. Usa /manage para gobernar.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        let success = Math.random() > 0.2;
        
        if (!success) {
            player.karma = (player.karma || 0) - 5;
            await savePlayerData(interaction.user.id, player);
            
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setTitle('Asalto Fallido')
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setDescription('El escuadron de Ketil te ha descubierto. Escapaste pero perdiste reputacion.')
                .addFields({ name: 'Karma', value: `${player.karma}`, inline: true });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        player.coins += target.rewards.coins || 0;
        if (target.rewards.wood) player.resources.wood += target.rewards.wood;
        if (target.rewards.iron) player.resources.iron += target.rewards.iron;
        player.karma = (player.karma || 0) + target.karma;
        player.crew = (player.crew || 0) + 1;
        
        await savePlayerData(interaction.user.id, player);
        
        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('Asalto Exitoso')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(`Has asaltado a **${target.name}**`)
            .addFields(
                { name: 'Recompensas', value: `+${target.rewards.coins || 0} monedas\n+${target.rewards.wood || 0} madera\n+${target.rewards.iron || 0} hierro`, inline: true },
                { name: 'Karma', value: `${player.karma}`, inline: true },
                { name: 'Tripulacion', value: `+1 (${player.crew})`, inline: true }
            )
            .setFooter({ text: 'La violencia es un camino oscuro...', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};