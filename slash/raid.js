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
            return interaction.reply({ content: 'Objetivo no valido', ephemeral: true });
        }
        
        const player = await getPlayerData(interaction.user.id);
        
        if (player.founded) {
            return interaction.reply({ content: 'Ya fundaste tu colonia. Usa /manage para gobernar.', ephemeral: true });
        }
        
        let success = Math.random() > 0.2;
        
        if (!success) {
            player.karma -= 5;
            await savePlayerData(interaction.user.id, player);
            return interaction.reply(`El escuadron de Ketil te ha descubierto. Escapaste pero perdiste reputacion. Karma: ${player.karma}`);
        }
        
        player.coins += target.rewards.coins || 0;
        if (target.rewards.wood) player.resources.wood += target.rewards.wood;
        if (target.rewards.iron) player.resources.iron += target.rewards.iron;
        player.karma += target.karma;
        player.crew = (player.crew || 0) + 1;
        
        await savePlayerData(interaction.user.id, player);
        
        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('Asalto Exitoso')
            .setDescription(`Has asaltado a ${target.name}`)
            .addFields(
                { name: 'Recompensas', value: `monedas +${target.rewards.coins || 0}\nmadera +${target.rewards.wood || 0}\nhierro +${target.rewards.iron || 0}` },
                { name: 'Karma', value: `${player.karma}`, inline: true },
                { name: 'Tripulacion', value: `+1 (${player.crew})`, inline: true }
            );
        
        await interaction.reply({ embeds: [embed] });
    }
};