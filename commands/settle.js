const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerData, savePlayerData, saveSettlement, getSettlement, getAllSettlements } = require('../utils/game');

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444' };

module.exports = {
    name: 'settle',
    description: 'Fundar una colonia',
    category: 'gobierno',
    cooldown: 0,
    
    data: () => new SlashCommandBuilder()
        .setName('settle')
        .setDescription('Fundar una colonia')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de tu colonia')
                .setRequired(true)),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        
        let name;
        if (context.options?.getString) {
            name = context.options.getString('nombre');
        } else {
            name = args.join(' ');
        }
        
        if (!name) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Necesitas descubrir coordenadas fertilies primero. Usa /explore.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const player = await getPlayerData(userId);
        
        if (!player.resources.fertile_coords) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Necesitas descubrir coordenadas fertilies primero. Usa /explore.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const hasSettlement = Object.values(await getAllSettlements()).some(s => s.ownerId === userId);
        if (hasSettlement) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Ya tienes una colonia fundada. Usa /manage para administrarla.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const settlement = {
            name,
            ownerId: userId,
            karma: player.karma,
            population: player.crew || 1,
            buildings: {
                farm: 1,
                barracks: player.karma < 0 ? 1 : 0,
                market: player.karma >= 0 ? 1 : 0
            },
            resources: { wheat: 0, wood: 0, iron: 0 },
            taxRate: 0,
            createdAt: Date.now()
        };
        
        await saveSettlement(userId, settlement);
        player.founded = true;
        await savePlayerData(userId, player);
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Colonia Fundada')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(`Has fundado tu colonia **${name}**`)
            .addFields(
                { name: 'Poblacion', value: `${settlement.population} colonos`, inline: true },
                { name: 'Karma', value: player.karma >= 0 ? 'Rey Pacifico' : 'Tirano', inline: true }
            )
            .setFooter({ text: 'Goberna tu nuevo reino con /manage' });
        
        return { embeds: [embed] };
    }
};