const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgents, normalize } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };
const ROLES = ['Duelista', 'Iniciador', 'Centinela', 'Controlador'];

module.exports = {
    name: 'agenterandom',
    description: 'Elegir un agente de Valorant al azar',
    category: 'valorant',
    cooldown: 3,

    data: () => new SlashCommandBuilder()
        .setName('agenterandom')
        .setDescription('Elegir un agente de Valorant al azar')
        .addStringOption(option =>
            option.setName('rol')
                .setDescription('Solo agentes de este rol')
                .addChoices(...ROLES.map(role => ({ name: role, value: role })))),

    async execute(context, args = []) {
        const roleQuery = context.options?.getString?.('rol') || args[0];
        let agents = await getAgents();

        if (roleQuery) {
            const role = ROLES.find(r => normalize(r).startsWith(normalize(roleQuery)));
            if (!role) {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.WARNING)
                    .setDescription(`Ese rol no existe. Opciones: ${ROLES.join(', ')}`);
                return { embeds: [embed], ephemeral: true };
            }
            agents = agents.filter(a => a.role?.displayName === role);
        }

        const agent = agents[Math.floor(Math.random() * agents.length)];
        const color = agent.backgroundGradientColors?.[0]?.slice(0, 6);

        const embed = new EmbedBuilder()
            .setColor(color ? `#${color}` : COLORS.PRIMARY)
            .setTitle(`🎲 Te toca jugar ${agent.displayName}`)
            .setDescription(agent.role ? `Rol: **${agent.role.displayName}**` : null)
            .setImage(agent.fullPortrait)
            .setFooter({ text: 'Usa /agente para ver sus habilidades' });

        return { embeds: [embed] };
    }
};
