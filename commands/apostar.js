const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getValorantLink, getCredits, addCredits, createBet, getAllBets } = require('../utils/db');
const { BET_EXPIRY, PAYOUT } = require('../utils/valbets');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
const MIN_BET = 10;

module.exports = {
    name: 'apostar',
    description: 'Apostar creditos a si un jugador gana o pierde su proxima competitiva',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('apostar')
        .setDescription('Apostar creditos a si un jugador gana o pierde su proxima competitiva')
        .setDMPermission(false)
        .addUserOption(option =>
            option.setName('jugador')
                .setDescription('Jugador con cuenta de Valorant vinculada')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prediccion')
                .setDescription('Que crees que va a pasar')
                .setRequired(true)
                .addChoices(
                    { name: 'Gana', value: 'gana' },
                    { name: 'Pierde', value: 'pierde' }
                ))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription(`Creditos a apostar (minimo ${MIN_BET})`)
                .setRequired(true)
                .setMinValue(MIN_BET)),

    // Prefijo: !apostar @jugador gana 100
    async execute(context, args = []) {
        if (!context.guild) return warning('Este comando solo funciona en un servidor.');

        const userId = context.author?.id || context.user?.id;
        const target = context.options?.getUser?.('jugador') || context.mentions?.users?.first();
        const prediction = (context.options?.getString?.('prediccion') || args[1] || '').toLowerCase();
        const amount = context.options?.getInteger?.('cantidad') ?? parseInt(args[2], 10);

        if (!target || !['gana', 'pierde'].includes(prediction) || !Number.isInteger(amount)) {
            return warning('Uso: `/apostar jugador:@alguien prediccion:gana cantidad:100`');
        }
        if (amount < MIN_BET) return warning(`La apuesta mínima es de **${MIN_BET}** créditos.`);
        if (target.id === userId && prediction === 'pierde') {
            return warning('No puedes apostar a que tú mismo pierdes 😉');
        }

        const link = await getValorantLink(target.id);
        if (!link) return warning(`**${target.username}** no tiene una cuenta de Valorant vinculada.`);

        const bets = await getAllBets();
        if (bets.some(b => b.userId === userId && b.targetUserId === target.id)) {
            return warning(`Ya tienes una apuesta activa sobre **${link.name}**. Espera a que termine su próxima partida.`);
        }

        const credits = await getCredits(userId);
        if (credits < amount) return warning(`No te alcanza: tienes **${credits}** créditos.`);

        const total = await addCredits(userId, -amount);
        await createBet({
            id: `${Date.now()}_${userId}`,
            userId,
            guildId: context.guild.id,
            channelId: context.channel.id,
            targetUserId: target.id,
            targetName: link.name,
            prediction,
            amount,
            createdAt: Date.now()
        });

        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎰 Apuesta registrada')
            .setDescription(`Apostaste **${amount}** créditos a que **${link.name}#${link.tag}** **${prediction}** su próxima competitiva.`)
            .addFields(
                { name: 'Si aciertas', value: `+${amount * PAYOUT} créditos`, inline: true },
                { name: 'Saldo', value: `${total} créditos`, inline: true }
            )
            .setFooter({ text: `Solo cuenta una partida que empiece después de ahora. Si no juega en ${BET_EXPIRY / 3600000} h, se te devuelve.` });

        return { embeds: [embed] };
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
