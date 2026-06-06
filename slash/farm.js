const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farm')
        .setDescription('Ver tu granja'),
    async execute(interaction) {
        const farm = await getFarm(interaction.user.id);
        await getEnergy(interaction.user.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa `/startv` para comenzar tu aventura');
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
        
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle(`${interaction.user.username} - Tu Granja`)
            .setAuthor({
                name: 'Ketil Farm RPG',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .addFields(
                { name: 'Monedas', value: farm.coins.toString(), inline: true },
                { name: 'Deuda', value: farm.debt.toString(), inline: true },
                { name: 'Energia', value: `${farm.energy}/100`, inline: true },
                { name: 'Region', value: farm.region, inline: true },
                { name: 'Trigo', value: farm.inventory.wheat.toString(), inline: true },
                { name: 'Parcela', value: plotStatus }
            )
            .setFooter({ text: 'La libertad esta a la vuelta de la esquina...', timestamp: new Date() });
        
        if (farm.freedom) {
            embed.addFields({ name: 'Estado', value: '¡Eres libre!' });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};