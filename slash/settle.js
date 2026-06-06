const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData, saveSettlement, getSettlement, getAllSettlements } = require('../utils/game');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settle')
        .setDescription('Fundar una colonia')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de tu colonia')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('nombre');
        const player = await getPlayerData(interaction.user.id);
        
        if (!player.resources.fertile_coords) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Necesitas descubrir coordenadas fertilies primero. Usa /explore.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const hasSettlement = Object.values(await getAllSettlements()).some(s => s.ownerId === interaction.user.id);
        if (hasSettlement) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Ya tienes una colonia fundada. Usa /manage para administrarla.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const settlement = {
            name,
            ownerId: interaction.user.id,
            karma: player.karma,
            population: player.crew || 1,
            buildings: {
                farm: 1,
                barracks: player.karma < 0 ? 1 : 0,
                market: player.karma >= 0 ? 1 : 0
            },
            resources: {
                wheat: 0,
                wood: 0,
                iron: 0
            },
            taxRate: 0,
            createdAt: Date.now()
        };
        
        await saveSettlement(interaction.user.id, settlement);
        player.founded = true;
        await savePlayerData(interaction.user.id, player);
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle('Colonia Fundada')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(`Has fundado tu colonia **${name}**`)
            .addFields(
                { name: 'Poblacion', value: `${settlement.population} colonos`, inline: true },
                { name: 'Karma', value: player.karma >= 0 ? 'Rey Pacifico' : 'Tirano', inline: true }
            )
            .setFooter({ text: 'Goberna tu nuevo reino con /manage', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};