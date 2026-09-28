const { SlashCommandBuilder } = require('discord.js');
const { createLobby, renderLobby } = require('../utils/vallobby');

const MODES = {
    competitivo: 'Competitivo',
    noclasificado: 'No clasificado',
    swiftplay: 'Swiftplay',
    premier: 'Premier',
    personalizada: 'Personalizada'
};

module.exports = {
    name: 'buscar',
    description: 'Buscar compañeros para jugar Valorant',
    category: 'valorant',
    cooldown: 30,

    data: () => new SlashCommandBuilder()
        .setName('buscar')
        .setDescription('Buscar compañeros para jugar Valorant')
        .addStringOption(option =>
            option.setName('modo')
                .setDescription('Modo de juego (por defecto competitivo)')
                .addChoices(...Object.entries(MODES).map(([value, name]) => ({ name, value }))))
        .addIntegerOption(option =>
            option.setName('cupos')
                .setDescription('Cuantos jugadores buscas (1 = duo, 4 = full stack)')
                .setMinValue(1)
                .setMaxValue(9))
        .addStringOption(option =>
            option.setName('nota')
                .setDescription('Mensaje opcional, ej: "con micro, tranqui"')
                .setMaxLength(150)),

    // Prefijo: !buscar [cupos] [nota...]
    async execute(context, args = []) {
        const hostId = context.author?.id || context.user?.id;
        let slots = context.options?.getInteger?.('cupos');
        let note = context.options?.getString?.('nota');

        if (!context.options && args.length) {
            const number = parseInt(args[0], 10);
            if (number >= 1 && number <= 9) {
                slots = number;
                args = args.slice(1);
            }
            note = args.join(' ').slice(0, 150);
        }

        const lobby = createLobby({
            hostId,
            mode: MODES[context.options?.getString?.('modo')] || MODES.competitivo,
            slots: slots || 1,
            note
        });

        return renderLobby(lobby);
    }
};
