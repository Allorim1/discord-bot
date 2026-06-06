const { EmbedBuilder } = require('discord.js');
const { getAllCommands, getCommandsByCategory } = require('../utils/help');

const GOBLET_EMBED_COLOR = '#6600ff';

module.exports = {
    name: 'help',
    description: 'Ver ayuda de comandos',
    async execute(message, args) {
        const category = args[0];
        const categories = getCommandsByCategory();
        
        if (category && categories[category]) {
            const cmds = categories[category];
            const embed = new EmbedBuilder()
                .setColor(GOBLET_EMBED_COLOR)
                .setTitle(`Comandos - ${category}`)
                .setAuthor({
                    name: 'Ketil Farm Bot',
                    iconURL: message.client.user.displayAvatarURL()
                });
            
            for (const cmd of cmds) {
                embed.addFields({
                    name: `${cmd.name}`,
                    value: cmd.description,
                    inline: true
                });
            }
            
            embed.setFooter({ text: 'Usa !help para ver todas las categorias' });
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor(GOBLET_EMBED_COLOR)
            .setTitle('Ketil Farm Bot - Sistema de Ayuda')
            .setAuthor({
                name: 'Bienvenido, viajero',
                iconURL: message.client.user.displayAvatarURL()
            })
            .setDescription('Selecciona una categoria para ver sus comandos')
            .addFields(
                { 
                    name: 'Principal', 
                    value: '!startv !farm !clear !till !plantwheat !harvestwheat !tutorial',
                    inline: false 
                },
                { 
                    name: 'Accion', 
                    value: '!raid !explore',
                    inline: false 
                },
                { 
                    name: 'Gobierno', 
                    value: '!settle !manage',
                    inline: false 
                },
                { 
                    name: 'Jardin', 
                    value: '!garden !plant !shop',
                    inline: false 
                },
                { 
                    name: 'Trivia', 
                    value: '!leaderboard !triviascore',
                    inline: false 
                }
            )
            .setFooter({ text: 'Tip: Usa !help <categoria> para ver comandos especificos • Ketil Farm RPG', timestamp: new Date() });
        
        message.reply({ embeds: [embed] });
    }
};