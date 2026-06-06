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
            return interaction.reply({ content: 'Primero usa /startv para comenzar tu aventura.', ephemeral: true });
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
            .setColor('#8b4513')
            .setTitle('Tu Granja')
            .addFields(
                { name: 'Monedas', value: farm.coins.toString(), inline: true },
                { name: 'Deuda', value: farm.debt.toString(), inline: true },
                { name: 'Energia', value: `${farm.energy}/100`, inline: true },
                { name: 'Region', value: farm.region, inline: true },
                { name: 'Trigo', value: farm.inventory.wheat.toString(), inline: true },
                { name: 'Parcela', value: plotStatus }
            );
        
        if (farm.freedom) {
            embed.addFields({ name: 'Estado', value: 'Eres libre!' });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};