const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MAX_GUESSES, getState, getClues, guess } = require('../utils/valordle');
const { formatUnlocked } = require('../utils/valachievements');

const COLORS = { PRIMARY: '#ff4655', WIN: '#3ba55d', LOSS: '#99aab5', WARNING: '#ffaa00' };

module.exports = {
    name: 'valordle',
    description: 'Adivina el agente de Valorant del dia',
    category: 'valorant',
    cooldown: 2,

    data: () => new SlashCommandBuilder()
        .setName('valordle')
        .setDescription('Adivina el agente de Valorant del dia')
        .addStringOption(option =>
            option.setName('agente')
                .setDescription('Tu intento (vacio para ver como vas)')),

    async execute(context, args = []) {
        const userId = context.author?.id || context.user?.id;
        const username = context.author?.username || context.user?.username;
        const input = context.options?.getString?.('agente') || args.join(' ');

        if (!input) {
            const state = await getState(userId);
            return { embeds: [render(state)], ephemeral: true };
        }

        const result = await guess(userId, input);
        if (result.error) {
            const embed = new EmbedBuilder().setColor(COLORS.WARNING).setDescription(result.error);
            return { embeds: [embed], ephemeral: true };
        }

        const { state, unlocked, reward } = result;
        const embed = render(state, reward, unlocked);

        // Anuncio publico sin revelar el agente
        if (result.finished && context.channel?.send) {
            const grid = state.rows.map(r => r.correct ? '🟩' : '🟥').join('');
            const text = state.game.solved
                ? `🔎 **${username}** adivinó el Valordle de hoy en **${state.rows.length}/${MAX_GUESSES}** ${grid}`
                : `😵 **${username}** no adivinó el Valordle de hoy ${grid}`;
            await context.channel.send(text).catch(() => null);
        }

        return { embeds: [embed], ephemeral: true };
    }
};

function render(state, reward, unlocked = []) {
    const { game, rows, agent } = state;
    const wrong = rows.filter(r => !r.correct).length;

    const embed = new EmbedBuilder()
        .setColor(game.solved ? COLORS.WIN : (game.lost ? COLORS.LOSS : COLORS.PRIMARY))
        .setTitle(`🔎 Valordle · ${rows.length}/${MAX_GUESSES}`);

    const lines = rows.length
        ? rows.map(r => `${r.correct ? '✅' : '❌'} **${r.name}** · Rol ${r.role} · ${r.alphabet}`)
        : ['Adivina el agente del día con `/valordle agente:<nombre>`.'];

    if (game.solved) {
        lines.push('', `🎉 ¡Era **${agent.displayName}**!${reward ? ` Ganaste **${reward} créditos**.` : ''}`, ...formatUnlocked(unlocked));
        embed.setThumbnail(agent.displayIcon);
    } else if (game.lost) {
        lines.push('', `Era **${agent.displayName}**. ¡Mañana hay otro!`);
        embed.setThumbnail(agent.displayIcon);
    } else {
        const clues = getClues(agent, wrong);
        if (clues.length) {
            lines.push('', '**Pistas:**', ...clues.map(c => c.text));
            const image = clues.find(c => c.image)?.image;
            if (image) embed.setThumbnail(image);
        }
    }

    embed.setDescription(lines.join('\n'));
    embed.setFooter({ text: 'Rol 🟩 = mismo rol · ⬆️⬇️ = el agente está antes o después en orden alfabético' });
    return embed;
}
