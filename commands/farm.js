const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFarm, getEnergy } = require('../utils/ketil');

const createEmbed = (color, title, author, fields = [], description, footer) => {
    const embed = new EmbedBuilder().setColor(color).setTitle(title);
    if (author) embed.setAuthor(author);
    if (description) embed.setDescription(description);
    for (const f of fields) embed.addFields(f);
    if (footer) embed.setFooter(footer);
    return embed;
};

const COLORS = {
    PRIMARY: '#6600ff',
    SUCCESS: '#00ff88',
    ERROR: '#ff4444',
    WARNING: '#ffaa00',
    INFO: '#0ea5e9'
};

module.exports = {
    name: 'farm',
    description: 'Ver tu granja',
    category: 'principal',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('farm')
        .setDescription('Ver tu granja'),
    
    async execute(context) {
        const userId = context.author?.id || context.user?.id;
        const farm = await getFarm(userId);
        await getEnergy(userId);
        
        if (!farm.plot) {
            const embed = createEmbed(COLORS.ERROR, 'Error', null, [], 'Primero usa /startv para comenzar tu aventura.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const plotStates = {
            cleared: 'Baldio (arboles)',
            tilled: 'Arado',
            ready: 'Lista para sembrar'
        };
        
        let plotStatus = plotStates[farm.plot.state];
        if (farm.plot.planted) {
            const timeLeft = Math.max(0, 300 - Math.floor((Date.now() - farm.plot.crop.plantedAt) / 1000));
            plotStatus = `Creciendo (${timeLeft}s)`;
        }
        
        const embed = createEmbed(
            COLORS.PRIMARY,
            `${context.author?.username || context.user?.username} - Tu Granja`,
            { name: 'Ketil Farm RPG', iconURL: context.client?.user?.displayAvatarURL() || context.user?.displayAvatarURL() },
            [
                { name: 'Monedas', value: String(farm.coins), inline: true },
                { name: 'Deuda', value: String(farm.debt), inline: true },
                { name: 'Energia', value: `${farm.energy}/100`, inline: true },
                { name: 'Region', value: farm.region, inline: true },
                { name: 'Trigo', value: String(farm.inventory.wheat), inline: true },
                { name: 'Parcela', value: plotStatus }
            ],
            null,
            { text: 'La libertad esta a la vuelta de la esquina...' }
        );
        
        if (farm.freedom) {
            embed.addFields({ name: 'Estado', value: '¡Eres libre!' });
        }
        
        return { embeds: [embed] };
    }
};