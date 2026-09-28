const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { getAccount, getMMRHistoryByPuuid, resolveTarget, translateRank, ValorantApiError } = require('../utils/valorant');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

// elo / 100 -> rango (Hierro 1 = 0, Radiante = 2400)
const RANK_LABELS = [
    'Hierro 1', 'Hierro 2', 'Hierro 3', 'Bronce 1', 'Bronce 2', 'Bronce 3',
    'Plata 1', 'Plata 2', 'Plata 3', 'Oro 1', 'Oro 2', 'Oro 3',
    'Platino 1', 'Platino 2', 'Platino 3', 'Diamante 1', 'Diamante 2', 'Diamante 3',
    'Ascendente 1', 'Ascendente 2', 'Ascendente 3', 'Inmortal 1', 'Inmortal 2', 'Inmortal 3', 'Radiante'
];

module.exports = {
    name: 'progreso',
    description: 'Grafico de la subida y bajada de RR en las ultimas competitivas',
    category: 'valorant',
    cooldown: 15,

    data: () => new SlashCommandBuilder()
        .setName('progreso')
        .setDescription('Grafico de la subida y bajada de RR en las ultimas competitivas')
        .addStringOption(option =>
            option.setName('riotid')
                .setDescription('Riot ID del jugador, ej: Nombre#LAS (vacio para usar tu cuenta vinculada)'))
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario de Discord con cuenta vinculada')),

    async execute(context, args = []) {
        const target = await resolveTarget(context, args, 'progreso');
        if (target.error) return warning(target.error);

        if (context.deferReply) await context.deferReply();
        else await context.channel?.sendTyping?.();

        let account;
        let history;
        try {
            account = target.puuid ? target : await getAccount(target.name, target.tag);
            history = await getMMRHistoryByPuuid(account.region, account.puuid);
        } catch (error) {
            if (!(error instanceof ValorantApiError)) throw error;
            return warning(error.message);
        }

        // La API devuelve de la mas nueva a la mas vieja
        const games = (history || []).filter(h => typeof h.elo === 'number').reverse();
        if (games.length < 2) return warning(`**${account.name}#${account.tag}** necesita al menos 2 competitivas recientes.`);

        let image;
        try {
            image = await renderChart(games, `${account.name}#${account.tag}`);
        } catch (error) {
            console.error('Error generando grafico de progreso:', error.message);
            return warning('No se pudo generar el gráfico. Intenta más tarde.');
        }

        const net = games.reduce((sum, g) => sum + (g.mmr_change_to_last_game || 0), 0);
        const wins = games.filter(g => g.mmr_change_to_last_game > 0).length;
        const losses = games.filter(g => g.mmr_change_to_last_game < 0).length;
        const last = games[games.length - 1];

        const embed = new EmbedBuilder()
            .setColor(net >= 0 ? '#3ba55d' : COLORS.PRIMARY)
            .setAuthor({ name: `${account.name}#${account.tag}` })
            .setTitle(`📈 Últimas ${games.length} competitivas`)
            .addFields(
                { name: 'Rango actual', value: `${translateRank(last.currenttierpatched)} · ${last.ranking_in_tier} RR`, inline: true },
                { name: 'RR neto', value: `${net >= 0 ? '+' : ''}${net} RR`, inline: true },
                { name: 'Victorias / Derrotas', value: `${wins} / ${losses}`, inline: true }
            )
            .setImage('attachment://progreso.png');

        return { embeds: [embed], files: [new AttachmentBuilder(image, { name: 'progreso.png' })] };
    }
};

async function renderChart(games, title) {
    const elos = games.map(g => g.elo);
    const pointColors = games.map((g, i) => i === 0 ? '#99aab5' : (g.mmr_change_to_last_game >= 0 ? '#3ba55d' : '#ff4655'));
    const min = Math.max(0, Math.floor((Math.min(...elos) - 50) / 100) * 100);
    const max = Math.min(2500, Math.ceil((Math.max(...elos) + 50) / 100) * 100);

    // Se envia como texto para poder usar una funcion en las etiquetas del eje Y
    const chart = `{
        type: 'line',
        data: {
            labels: ${JSON.stringify(games.map(g => g.map?.name || ''))},
            datasets: [{
                data: ${JSON.stringify(elos)},
                borderColor: '#ff4655',
                backgroundColor: 'rgba(255,70,85,0.15)',
                pointBackgroundColor: ${JSON.stringify(pointColors)},
                pointBorderColor: ${JSON.stringify(pointColors)},
                pointRadius: 5,
                fill: true,
                lineTension: 0.25
            }]
        },
        options: {
            legend: { display: false },
            title: { display: true, text: ${JSON.stringify(title)}, fontColor: '#ffffff', fontSize: 18 },
            scales: {
                xAxes: [{ ticks: { fontColor: '#b9bbbe' }, gridLines: { color: 'rgba(255,255,255,0.05)' } }],
                yAxes: [{
                    ticks: {
                        min: ${min}, max: ${max}, stepSize: 100, fontColor: '#ffffff',
                        callback: function (value) {
                            var labels = ${JSON.stringify(RANK_LABELS)};
                            return value % 100 === 0 ? (labels[value / 100] || '') : '';
                        }
                    },
                    gridLines: { color: 'rgba(255,255,255,0.12)' }
                }]
            }
        }
    }`;

    const response = await axios.post('https://quickchart.io/chart', {
        chart,
        width: 800,
        height: 400,
        backgroundColor: '#1e1f22',
        format: 'png'
    }, { responseType: 'arraybuffer', timeout: 15000 });

    return Buffer.from(response.data);
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
