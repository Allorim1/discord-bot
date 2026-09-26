const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAgents, findByName, ABILITY_SLOTS } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'agente',
    description: 'Ver informacion de un agente de Valorant',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('agente')
        .setDescription('Ver informacion de un agente de Valorant')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del agente (vacio para ver la lista)')),

    async execute(context, args = []) {
        const query = context.options?.getString?.('nombre') || args.join(' ');
        const agents = await getAgents();

        if (!query) {
            const byRole = {};
            for (const agent of agents) {
                const role = agent.role?.displayName || 'Sin rol';
                (byRole[role] ||= []).push(agent.displayName);
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.PRIMARY)
                .setTitle('Agentes de Valorant')
                .setDescription('Usa `/agente <nombre>` para ver sus habilidades')
                .addFields(Object.entries(byRole).map(([role, names]) => ({
                    name: role, value: names.join(', '), inline: false
                })));
            return { embeds: [embed] };
        }

        const agent = findByName(agents, query);
        if (!agent) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.WARNING)
                .setDescription(`No encontré al agente **${query}**. Usa \`/agente\` para ver la lista.`);
            return { embeds: [embed], ephemeral: true };
        }

        const color = agent.backgroundGradientColors?.[0]?.slice(0, 6);
        const embed = new EmbedBuilder()
            .setColor(color ? `#${color}` : COLORS.PRIMARY)
            .setTitle(agent.displayName)
            .setDescription(agent.description)
            .setThumbnail(agent.displayIcon)
            .setImage(agent.fullPortrait);

        if (agent.role) {
            embed.setAuthor({ name: agent.role.displayName, iconURL: agent.role.displayIcon });
        }

        for (const ability of agent.abilities) {
            if (!ability.displayName) continue;
            const key = ABILITY_SLOTS[ability.slot] || ability.slot;
            embed.addFields({
                name: `[${key}] ${ability.displayName}`,
                value: ability.description.slice(0, 1024)
            });
        }

        return { embeds: [embed] };
    }
};
