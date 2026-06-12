const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COLORS = { PRIMARY: '#6600ff' };

module.exports = {
    name: 'help',
    description: 'Ver ayuda de comandos',
    category: 'principal',
    cooldown: 10,
    
    data: () => new SlashCommandBuilder()
        .setName('help')
        .setDescription('Ver ayuda de comandos')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('Categoria de comandos a ver')
                .setRequired(false)
                .addChoices(
                    { name: 'Principal', value: 'principal' },
                    { name: 'Accion', value: 'accion' },
                    { name: 'Gobierno', value: 'gobierno' },
                    { name: 'Jardin', value: 'jardin' },
                    { name: 'Trivia', value: 'trivia' }
                )),
    
    async execute(context, args) {
        const commands = require('../utils/help');
        const category = context.options?.getString?.('categoria') || args[0];
        const categories = commands.getCommandsByCategory();
        
        if (category && categories[category]) {
            const cmds = categories[category];
            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle(`Comandos - ${category}`)
                .setAuthor({
                    name: context.author?.username || context.user?.username,
                    iconURL: context.client?.user?.displayAvatarURL?.()
                });
            
            for (const cmd of cmds) {
                embed.addFields({ name: `</${cmd.name}>`, value: cmd.description, inline: true });
            }
            
            embed.setFooter({ text: 'Usa /help para ver todas las categorias' });
            return { embeds: [embed] };
        }
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Ketil Farm Bot - Sistema de Ayuda')
            .setAuthor({
                name: `Bienvenido, ${context.author?.username || context.user?.username}`,
                iconURL: context.client?.user?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            })
            .setDescription('Selecciona una categoria para ver sus comandos')
            .addFields(
                { name: 'Principal', value: '!startv !farm !clear !till !plantwheat !harvestwheat !tutorial !daily', inline: false },
                { name: 'Accion', value: '!raid !explore', inline: false },
                { name: 'Gobierno', value: '!settle !manage', inline: false },
                { name: 'Jardin', value: '!garden !plant !shop', inline: false },
                { name: 'Trivia', value: '!leaderboard !triviascore', inline: false }
            )
            .setFooter({ text: 'Tip: Usa !help <categoria> para ver comandos especificos • Ketil Farm RPG' });
        
        return { embeds: [embed] };
    }
};