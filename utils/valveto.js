const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMaps, getQueueStatus, normalize } = require('./valorant');

const VETO_DURATION = 30 * 60 * 1000;
const MAX_MAPS = 20;
const COLORS = { ACTIVE: '#ff4655', DONE: '#3ba55d', CANCELLED: '#99aab5' };

// vetoId -> estado
const vetos = new Map();

// Mapas de la rotacion de competitivo; si la API falla, todos los mapas
async function getMapPool() {
    const maps = await getMaps();
    try {
        const queues = await getQueueStatus('na');
        const competitive = (queues || []).find(q => q.mode_id === 'competitive');
        const enabled = (competitive?.maps || []).filter(m => m.enabled).map(m => normalize(m.map?.name));
        const pool = maps.filter(m => enabled.includes(normalize(m.displayName)));
        if (pool.length >= 3) return { maps: pool, rotation: true };
    } catch {
        // Se usan todos los mapas
    }
    return { maps: maps.slice(0, MAX_MAPS), rotation: false };
}

// Pasos del veto. Bo1: se banea por turnos hasta que queda 1.
// Bo3: ban, ban, pick, pick y despues bans por turnos hasta el mapa decisivo.
function buildSteps(format, mapCount) {
    const steps = [];
    let turn = 0;
    if (format === 'bo3' && mapCount >= 5) {
        steps.push({ action: 'ban', team: 0 }, { action: 'ban', team: 1 }, { action: 'pick', team: 0 }, { action: 'pick', team: 1 });
    }
    const remaining = mapCount - steps.length;
    for (let i = 0; i < remaining - 1; i++) {
        steps.push({ action: 'ban', team: turn });
        turn = 1 - turn;
    }
    return steps;
}

function createVeto({ captains, format, maps, rotation }) {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const veto = {
        id,
        captains,
        format,
        rotation,
        maps: maps.map(m => ({ name: m.displayName, splash: m.splash, status: 'available', by: null })),
        steps: buildSteps(format, maps.length),
        step: 0,
        cancelled: false
    };
    vetos.set(id, veto);
    setTimeout(() => vetos.delete(id), VETO_DURATION);
    return veto;
}

function getVeto(id) {
    return vetos.get(id) || null;
}

function isDone(veto) {
    return veto.step >= veto.steps.length;
}

function currentStep(veto) {
    return veto.steps[veto.step] || null;
}

// Aplica la accion del turno sobre un mapa. Devuelve un error o null.
function applyChoice(veto, userId, mapIndex) {
    const step = currentStep(veto);
    if (veto.cancelled || !step) return 'Este veto ya terminó.';
    if (veto.captains[step.team] !== userId) return 'No es tu turno.';

    const map = veto.maps[mapIndex];
    if (!map || map.status !== 'available') return 'Ese mapa ya no está disponible.';

    map.status = step.action === 'ban' ? 'banned' : 'picked';
    map.by = step.team;
    veto.step++;

    // Al terminar, el mapa que queda es el decisivo (o el unico en Bo1)
    if (isDone(veto)) {
        const last = veto.maps.find(m => m.status === 'available');
        if (last) {
            last.status = 'decider';
            last.by = null;
        }
    }
    return null;
}

function render(veto) {
    const done = isDone(veto);
    const step = currentStep(veto);
    const [a, b] = veto.captains;

    const embed = new EmbedBuilder()
        .setColor(veto.cancelled ? COLORS.CANCELLED : (done ? COLORS.DONE : COLORS.ACTIVE))
        .setTitle(`🗺️ Veto ${veto.format.toUpperCase()}`)
        .setFooter({ text: veto.rotation ? 'Mapas de la rotación de competitivo' : 'No se pudo obtener la rotación: se usan todos los mapas' });

    const lines = [`🟥 <@${a}>  vs  🟦 <@${b}>`, ''];
    const played = veto.maps.filter(m => m.status === 'picked' || m.status === 'decider');

    if (veto.cancelled) {
        lines.push('Veto cancelado.');
    } else if (done) {
        const order = veto.format === 'bo3'
            ? veto.maps.filter(m => m.status === 'picked').concat(veto.maps.filter(m => m.status === 'decider'))
            : played;
        lines.push('**Mapas:**');
        order.forEach((m, i) => {
            const who = m.by === null ? 'decisivo' : `elegido por <@${veto.captains[m.by]}>`;
            lines.push(`**${i + 1}.** ${m.name} · ${who}`);
        });
        if (order[0]?.splash) embed.setImage(order[0].splash);
    } else {
        const verb = step.action === 'ban' ? 'banear' : 'elegir';
        lines.push(`Turno de <@${veto.captains[step.team]}>: **${verb}** un mapa`);
    }

    const history = veto.maps
        .filter(m => m.status === 'banned' || m.status === 'picked')
        .map(m => `${m.status === 'banned' ? '❌' : '✅'} ${m.name} · ${m.by === 0 ? '🟥' : '🟦'}`);
    if (history.length && !done) lines.push('', history.join('\n'));

    embed.setDescription(lines.join('\n'));
    return embed;
}

function buttons(veto) {
    const finished = veto.cancelled || isDone(veto);
    const rows = [];
    const styles = {
        available: ButtonStyle.Secondary,
        banned: ButtonStyle.Danger,
        picked: ButtonStyle.Success,
        decider: ButtonStyle.Primary
    };

    veto.maps.forEach((map, i) => {
        if (i % 5 === 0) rows.push(new ActionRowBuilder());
        rows[rows.length - 1].addComponents(
            new ButtonBuilder()
                .setCustomId(`valveto:map:${veto.id}:${i}`)
                .setLabel(map.name)
                .setStyle(styles[map.status])
                .setDisabled(finished || map.status !== 'available')
        );
    });

    if (!finished && rows.length < 5) {
        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`valveto:cancel:${veto.id}`)
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        ));
    }
    return rows;
}

function renderMessage(veto) {
    return { embeds: [render(veto)], components: buttons(veto), allowedMentions: { parse: [] } };
}

module.exports = {
    MAX_MAPS,
    getMapPool,
    createVeto,
    getVeto,
    applyChoice,
    renderMessage
};
