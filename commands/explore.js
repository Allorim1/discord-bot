const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData } = require('../utils/game');

const EXPEDITION_COST = 50;
const COLORS = { INFO: '#0ea5e9', PRIMARY: '#6600ff', ERROR: '#ff4444' };

const OUTCOMES = [
    { msg: 'Encontraste un mapa antiguo', reward: { maps: 1 }, karma: 5 },
    { msg: 'Recogiste pieles raras de animales exoticos', reward: { rare_pelts: 2 }, karma: 10 },
    { msg: 'Encontraste madera especial en el bosque', reward: { rare_wood: 3 }, karma: 5 },
    { msg: 'Descubriste coordenadas de tierras fertilies', reward: { fertile_coords: true }, karma: 15 },
    { msg: 'Encontraste recursos naturales', reward: { wood: 20, iron: 10 }, karma: 0 }
];

module.exports = {
    name: 'explore',
    description: 'Explorar tierras desconocidas (Explorador)',
    category: 'accion',
    cooldown: 60,
    
    data: () => new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Explorar tierras desconocidas (Explorador)'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const player = await getPlayerData(userId);
        
        if (player.founded) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Ya fundaste tu colonia. Usa /manage para gobernar.');
            return { embeds: [embed], ephemeral: true };
        }
        
        if (player.coins < EXPEDITION_COST) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription(`Necesitas ${EXPEDITION_COST} monedas para explorar.`);
            return { embeds: [embed], ephemeral: true };
        }
        
        player.coins -= EXPEDITION_COST;
        const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
        
        if (outcome.reward.maps) player.resources.maps += outcome.reward.maps;
        if (outcome.reward.rare_pelts) player.resources.rare_pelts += outcome.reward.rare_pelts;
        if (outcome.reward.rare_wood) player.resources.rare_wood += outcome.reward.rare_wood;
        if (outcome.reward.wood) player.resources.wood += outcome.reward.wood;
        if (outcome.reward.iron) player.resources.iron += outcome.reward.iron;
        if (outcome.reward.fertile_coords) player.resources.fertile_coords = true;
        player.karma = (player.karma || 0) + outcome.karma;
        
        await savePlayerData(userId, player);
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle('Expedicion Exitosa')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(outcome.msg)
            .addFields({ name: 'Karma', value: `+${outcome.karma}`, inline: true })
            .setFooter({ text: 'La curiosidad es una virtud...' });
        
        return { embeds: [embed] };
    }
};