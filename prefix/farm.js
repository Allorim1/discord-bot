const { EmbedBuilder } = require('discord.js');
const { getFarm, getEnergy } = require('../utils/ketil');

module.exports = {
    name: 'farm',
    description: 'Ver tu granja',
    async execute(message) {
        const farm = await getFarm(message.author.id);
        await getEnergy(message.author.id);
        
        if (!farm.plot) {
            const embed = new EmbedBuilder()
                .setColor('#ff4444')
                .setDescription('Primero usa !startv para comenzar tu aventura');
            return message.reply({ embeds: [embed] });
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
            .setTitle(`${message.author.username} - Tu Granja`)
            .setAuthor({
                name: 'Ketil Farm RPG',
                iconURL: message.client.user.displayAvatarURL()
            })
            .addFields(
                { name: 'Monedas', value: farm.coins.toString(), inline: true },
                { name: 'Deuda', value: farm.debt.toString(), inline: true },
                { name: 'Energia', value: `${farm.energy}/100`, inline: true },
                { name: 'Region', value: farm.region, inline: true },
                { name: 'Trigo', value: farm.inventory.wheat.toString(), inline: true },
                { name: 'Parcela', value: plotStatus }
            )
            .setFooter({ text: 'La libertad esta a la vuelta de la esquina...' });
        
        if (farm.freedom) {
            embed.addFields({ name: 'Estado', value: '¡Eres libre!' });
        }
        
        message.reply({ embeds: [embed] });
    }
};