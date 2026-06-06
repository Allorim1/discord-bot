const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData } = require('../utils/game');

const EXPEDITION_COST = 50;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Explorar tierras desconocidas (Explorador)'),
    async execute(interaction) {
        const player = await getPlayerData(interaction.user.id);
        
        if (player.founded) {
            return interaction.reply({ content: '❌ Ya fundaste tu colonia. Usa `/manage` para gobernar.', ephemeral: true });
        }
        
        if (player.coins < EXPEDITION_COST) {
            return interaction.reply({ content: `❌ Necesitas ${EXPEDITION_COST} monedas para explorar.`, ephemeral: true });
        }
        
        player.coins -= EXPEDITION_COST;
        
        const outcomes = [
            { msg: 'Encontraste un mapa antiguo', reward: { maps: 1 }, karma: 5 },
            { msg: 'Recogiste pieles raras de animales exóticos', reward: { rare_pelts: 2 }, karma: 10 },
            { msg: 'Encontraste madera especial en el bosque', reward: { rare_wood: 3 }, karma: 5 },
            { msg: 'Descubriste coordenadas de tierras fértiles', reward: { fertile_coords: true }, karma: 15 },
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
        
        await savePlayerData(interaction.user.id, player);
        
        const embed = new EmbedBuilder()
            .setColor('#0ea5e9')
            .setTitle('🧭 Expedición Exitosa')
            .setDescription(outcome.msg)
            .addFields({ name: 'Karma', value: `+${outcome.karma}` });
        
        await interaction.reply({ embeds: [embed] });
    }
};