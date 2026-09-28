const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMapPool, createVeto, renderMessage } = require('../utils/valveto');

const COLORS = { WARNING: '#ffaa00' };

module.exports = {
    name: 'veto',
    description: 'Veto de mapas por turnos entre dos capitanes',
    category: 'valorant',
    cooldown: 10,

    data: () => new SlashCommandBuilder()
        .setName('veto')
        .setDescription('Veto de mapas por turnos entre dos capitanes')
        .addUserOption(option =>
            option.setName('rival')
                .setDescription('Capitan del otro equipo')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('formato')
                .setDescription('Bo1 (un mapa) o Bo3 (tres mapas). Por defecto Bo1')
                .addChoices(
                    { name: 'Bo1', value: 'bo1' },
                    { name: 'Bo3', value: 'bo3' }
                )),

    // Prefijo: !veto @rival [bo3]
    async execute(context, args = []) {
        const userId = context.author?.id || context.user?.id;
        const rival = context.options?.getUser?.('rival') || context.mentions?.users?.first();
        const format = context.options?.getString?.('formato') || (args.includes('bo3') ? 'bo3' : 'bo1');

        if (!rival) return warning('Elige al capitán rival: `/veto rival:@alguien`');
        if (rival.bot || rival.id === userId) return warning('El rival tiene que ser otra persona.');

        const { maps, rotation } = await getMapPool();
        if (format === 'bo3' && maps.length < 5) return warning('No hay suficientes mapas para un Bo3.');

        const veto = createVeto({ captains: [userId, rival.id], format, maps, rotation });
        return renderMessage(veto);
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
