const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayerData, savePlayerData } = require('../utils/game');

const RAIDS = [
    { id: 'coastal_village', name: 'Aldea Costera', karma: -10, rewards: { coins: 100, wood: 50 } },
    { id: 'merchant_ship', name: 'Barco Mercante', karma: -15, rewards: { coins: 150, iron: 30 } },
    { id: 'rich_merchant', name: 'Mercader Rico', karma: -5, rewards: { coins: 75 } }
];

const COLORS = { PRIMARY: '#6600ff', ERROR: '#ff4444', WARNING: '#ffaa00' };

module.exports = {
    name: 'raid',
    description: 'Asaltar objetivos (Mercenario)',
    category: 'accion',
    cooldown: 60,
    
    data: () => new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Asaltar objetivos (Mercenario)')
        .addStringOption(option =>
            option.setName('objetivo')
                .setDescription('Que asaltar')
                .setRequired(true)
                .addChoices(...RAID_CHOICES)),
    
    async execute(context, args) {
        const userId = context.author?.id || context.user?.id;
        
        let targetId;
        if (context.options?.getString) {
            targetId = context.options.getString('objetivo');
        } else {
            targetId = args[0];
        }
        
        const target = RAIDS.find(r => r.id === targetId);
        
        if (!target) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Objetivo no valido.');
            return { embeds: [embed], ephemeral: true };
        }
        
        const player = await getPlayerData(userId);
        
        if (player.founded) {
            const embed = new EmbedBuilder().setColor(COLORS.ERROR).setDescription('Ya fundaste tu colonia. Usa /manage para gobernar.');
            return { embeds: [embed], ephemeral: true };
        }
        
        let success = Math.random() > 0.2;
        
        if (!success) {
            player.karma = (player.karma || 0) - 5;
            await savePlayerData(userId, player);
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('Asalto Fallido')
                .setAuthor({
                    name: context.author?.username || context.user?.username,
                    iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
                })
                .setDescription('El escuadron de Ketil te ha descubierto. Escapaste pero perdiste reputacion.')
                .addFields({ name: 'Karma', value: String(player.karma), inline: true });
            
            return { embeds: [embed] };
        }
        
        player.coins += target.rewards.coins || 0;
        if (target.rewards.wood) player.resources.wood += target.rewards.wood;
        if (target.rewards.iron) player.resources.iron += target.rewards.iron;
        player.karma = (player.karma || 0) + target.karma;
        player.crew = (player.crew || 0) + 1;
        
        await savePlayerData(userId, player);
        
        const embed = new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('Asalto Exitoso')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL() || context.user?.displayAvatarURL()
            })
            .setDescription(`Has asaltado a **${target.name}**`)
            .addFields(
                { name: 'Recompensas', value: `monedas +${target.rewards.coins || 0}\nmadera +${target.rewards.wood || 0}\nhierro +${target.rewards.iron || 0}`, inline: true },
                { name: 'Karma', value: String(player.karma), inline: true },
                { name: 'Tripulacion', value: `+1 (${player.crew})`, inline: true }
            )
            .setFooter({ text: 'La violencia es un camino oscuro...' });
        
        return { embeds: [embed] };
    }
};

const RAID_CHOICES = RAIDS.map(r => ({ name: r.name, value: r.id }));