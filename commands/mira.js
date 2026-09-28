const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getCrosshairImage, ValorantApiError } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'mira',
    description: 'Ver como se ve una mira de Valorant a partir de su codigo',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('mira')
        .setDescription('Ver como se ve una mira de Valorant a partir de su codigo')
        .addStringOption(option =>
            option.setName('codigo')
                .setDescription('Codigo de la mira, ej: 0;P;c;5;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0')
                .setRequired(true)),

    async execute(context, args = []) {
        const code = (context.options?.getString?.('codigo') || args.join('')).trim();

        // Los codigos de mira empiezan con un numero y estan separados por ";"
        if (!/^\d;[^\s]+$/.test(code)) {
            return warning('Ese no parece un código de mira. Cópialo desde Configuración → Mira → Importar/Exportar.');
        }

        if (context.deferReply) await context.deferReply();

        let image;
        try {
            image = await getCrosshairImage(code);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        const file = new AttachmentBuilder(image, { name: 'mira.png' });
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎯 Mira')
            .setDescription(`\`\`\`\n${code}\n\`\`\``)
            .setImage('attachment://mira.png')
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            });

        return { embeds: [embed], files: [file] };
    }
};

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
