const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerData, getSettlement } = require('../utils/game');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Administrar tu colonia'),
    async execute(interaction) {
        const player = await getPlayerData(interaction.user.id);
        const settlement = await getSettlement(interaction.user.id);
        
        if (!settlement) {
            return interaction.reply({ content: 'No has fundado una colonia. Usa /settle <nombre> primero.', ephemeral: true });
        }
        
        const isTyrant = player.karma < 0;
        
        const embed = new EmbedBuilder()
            .setColor(isTyrant ? '#ef4444' : '#22c55e')
            .setTitle(`Gobierno de ${settlement.name}`)
            .setDescription(isTyrant 
                ? 'Ruta del Tirano: Gobiernas con miedo y oppression' 
                : 'Ruta del Rey: Gobiernas con comercio y paz')
            .addFields(
                { name: 'Poblacion', value: settlement.population.toString(), inline: true },
                { name: 'Tesoria', value: `${settlement.resources.wood} madera | ${settlement.resources.iron} hierro`, inline: true },
                { name: 'Edificios', value: `Granja: ${settlement.buildings.farm}\n${isTyrant ? 'Barracas' : 'Mercado'}: ${isTyrant ? settlement.buildings.barracks : settlement.buildings.market}` }
            );
        
        const row = new ActionRowBuilder();
        
        if (isTyrant) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('tax_collect')
                    .setLabel('Cobrar Impuestos')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('slavery')
                    .setLabel('Esclavitud')
                    .setStyle(ButtonStyle.Danger)
            );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('trade_route')
                    .setLabel('Crear Ruta Comercial')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('defense')
                    .setLabel('Fortificar')
                    .setStyle(ButtonStyle.Primary)
            );
        }
        
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};