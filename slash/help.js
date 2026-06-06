const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllCommands, getCommandsByCategory } = require('../utils/help');

const GOBLET_EMBED_COLOR = '#6600ff';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Ver ayuda de comandos')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Categoria de comandos a ver')
                .setRequired(false)
                .addChoices(
                    { name: 'Principal', value: 'Principal' },
                    { name: 'Accion', value: 'Accion' },
                    { name: 'Gobierno', value: 'Gobierno' },
                    { name: 'Jardin', value: 'Jardin' },
                    { name: 'Trivia', value: 'Trivia' }
                )),
    async execute(interaction) {
        const category = interaction.options.getString('categoria');
        const categories = getCommandsByCategory();
        
        if (category) {
            const cmds = categories[category];
            if (!cmds) {
                return interaction.reply({ content: 'Categoria no encontrada.', ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor(GOBLET_EMBED_COLOR)
                .setTitle(`Comandos - ${category}`)
                .setAuthor({
                    name: 'Ketil Farm Bot',
                    iconURL: interaction.client.user.displayAvatarURL()
                });
            
            for (const cmd of cmds) {
                embed.addFields({
                    name: `</${cmd.name}>`,
                    value: cmd.description,
                    inline: true
                });
            }
            
            embed.setFooter({ text: 'Usa /help para ver todas las categorias' });
            return interaction.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor(GOBLET_EMBED_COLOR)
            .setTitle('Ketil Farm Bot - Sistema de Ayuda')
            .setAuthor({
                name: 'Bienvenido, viajero',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription('Selecciona una categoria para ver sus comandos')
            .setThumbnail('https://i.imgur.com/6GkJhYt.png')
            .addFields(
                { 
                    name: 'Principal', 
                    value: '```/startv /farm /clear /till /plantwheat /harvestwheat /tutorial```',
                    inline: false 
                },
                { 
                    name: 'Accion', 
                    value: '```/raid /explore```',
                    inline: false 
                },
                { 
                    name: 'Gobierno', 
                    value: '```/settle /manage```',
                    inline: false 
                },
                { 
                    name: 'Jardin', 
                    value: '```/garden /plant /shop```',
                    inline: false 
                },
                { 
                    name: 'Trivia', 
                    value: '```/leaderboard /triviascore```',
                    inline: false 
                }
            )
            .setImage('https://i.imgur.com/mVvKzFg.png')
            .setFooter({ text: 'Tip: Usa /help <categoria> para ver comandos especificos • Ketil Farm RPG', timestamp: new Date() });
        
        await interaction.reply({ embeds: [embed] });
    }
};