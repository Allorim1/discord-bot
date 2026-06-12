const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerData, getSettlement } = require('../utils/game');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'manage',
    description: 'Administrar tu colonia',
    category: 'gobierno',
    cooldown: 5,
    
    data: () => new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Administrar tu colonia'),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        const player = await getPlayerData(userId);
        const settlement = await getSettlement(userId);
        
        if (!settlement) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('No has fundado una colonia. Usa /settle <nombre> primero.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const isTyrant = player.karma < 0;
        
        const embed = new EmbedBuilder()
            .setColor(isTyrant ? '#ef4444' : '#22c55e')
            .setTitle(`Gobierno de ${settlement.name}`)
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(isTyrant 
                ? 'Ruta del Tirano: Gobiernas con miedo y oppression' 
                : 'Ruta del Rey: Gobiernas con comercio y paz')
            .addFields(
                { name: 'Poblacion', value: String(settlement.population), inline: true },
                { name: 'Tesoria', value: `${settlement.resources.wood} madera | ${settlement.resources.iron} hierro`, inline: true },
                { name: 'Edificios', value: `Granja: ${settlement.buildings.farm}\n${isTyrant ? 'Barracas' : 'Mercado'}: ${isTyrant ? settlement.buildings.barracks : settlement.buildings.market}` }
            );
        
        const row = new ActionRowBuilder();
        
        if (isTyrant) {
            row.addComponents(
                new ButtonBuilder().setCustomId('tax_collect').setLabel('Cobrar Impuestos').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('slavery').setLabel('Esclavitud').setStyle(ButtonStyle.Danger)
            );
        } else {
            row.addComponents(
                new ButtonBuilder().setCustomId('trade_route').setLabel('Crear Ruta Comercial').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('defense').setLabel('Fortificar').setStyle(ButtonStyle.Primary)
            );
        }
        
        return { embeds: [embed], components: [row] };
    }
};