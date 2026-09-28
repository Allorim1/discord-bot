const { getAgents, findByName, normalize } = require('./valorant');
const { dayKey } = require('./valtime');
const { getValordleGame, setValordleGame, getValordleStats, setValordleStats, addCredits } = require('./db');
const { grantAchievements } = require('./valachievements');

const MAX_GUESSES = 6;
// Creditos segun el intento en que se adivina (1er intento = 150)
const REWARDS = [150, 120, 100, 80, 60, 40];
const STREAK_ACHIEVEMENT = 7;

// Numero estable a partir del dia, para que todos tengan el mismo agente
function hash(text) {
    let h = 2166136261;
    for (const char of text) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

async function getDailyAgent(day = dayKey()) {
    const agents = await getAgents();
    return agents[hash(`valordle:${day}`) % agents.length];
}

function previousDay(day) {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

// Pistas que se van revelando con cada intento fallido
function getClues(agent, wrongGuesses) {
    const abilities = agent.abilities || [];
    const signature = abilities.find(a => a.slot === 'Ability2');
    const firstAbility = abilities.find(a => a.slot === 'Ability1');
    const ultimate = abilities.find(a => a.slot === 'Ultimate');

    const clues = [
        { text: `Rol: **${agent.role?.displayName || '?'}**` },
        { text: 'Ícono de una de sus habilidades:', image: firstAbility?.displayIcon },
        { text: `Habilidad firma: **${signature?.displayName || '?'}**` },
        { text: `Definitiva: **${ultimate?.displayName || '?'}**` },
        { text: `> ${agent.description.replace(new RegExp(agent.displayName, 'gi'), '█████')}` }
    ];
    return clues.slice(0, Math.min(wrongGuesses, clues.length));
}

// Compara un intento con el agente del dia
function compare(guessAgent, agent) {
    const sameRole = guessAgent.role?.displayName === agent.role?.displayName;
    const order = guessAgent.displayName.localeCompare(agent.displayName);
    return {
        name: guessAgent.displayName,
        correct: guessAgent.uuid === agent.uuid,
        role: sameRole ? '🟩' : '🟥',
        // Flecha hacia donde esta el agente en orden alfabetico
        alphabet: order === 0 ? '✅' : (order < 0 ? '⬇️' : '⬆️')
    };
}

async function getState(userId) {
    const day = dayKey();
    const [agent, game, agents] = await Promise.all([getDailyAgent(day), getValordleGame(day, userId), getAgents()]);
    const rows = game.guesses
        .map(name => agents.find(a => a.displayName === name))
        .filter(Boolean)
        .map(g => compare(g, agent));
    return { day, agent, game, rows };
}

// Devuelve { error } o { state, finished, unlocked, reward }
async function guess(userId, input) {
    const state = await getState(userId);
    const { day, agent, game } = state;

    if (game.solved) return { error: '¡Ya adivinaste el Valordle de hoy! Vuelve mañana.' };
    if (game.lost) return { error: `Ya usaste tus ${MAX_GUESSES} intentos de hoy. Vuelve mañana.` };

    const agents = await getAgents();
    const guessAgent = findByName(agents, input);
    if (!guessAgent) return { error: `No conozco a ningún agente llamado **${input}**.` };
    if (game.guesses.some(name => normalize(name) === normalize(guessAgent.displayName))) {
        return { error: `Ya intentaste con **${guessAgent.displayName}**.` };
    }

    game.guesses.push(guessAgent.displayName);
    const row = compare(guessAgent, agent);
    state.rows.push(row);

    let unlocked = [];
    let reward = 0;
    if (row.correct) {
        game.solved = true;
        reward = REWARDS[game.guesses.length - 1] || REWARDS[REWARDS.length - 1];
        await addCredits(userId, reward);

        const stats = await getValordleStats(userId);
        stats.wins++;
        stats.streak = stats.lastWinDay === previousDay(day) ? stats.streak + 1 : 1;
        stats.best = Math.max(stats.best, stats.streak);
        stats.lastWinDay = day;
        await setValordleStats(userId, stats);

        const ids = ['detective'];
        if (game.guesses.length === 1) ids.push('adivino');
        if (stats.streak >= STREAK_ACHIEVEMENT) ids.push('constante');
        unlocked = await grantAchievements(userId, ids);
    } else if (game.guesses.length >= MAX_GUESSES) {
        game.lost = true;
        const stats = await getValordleStats(userId);
        stats.streak = 0;
        await setValordleStats(userId, stats);
    }

    await setValordleGame(day, userId, game);
    return { state, finished: game.solved || game.lost, unlocked, reward };
}

module.exports = {
    MAX_GUESSES,
    getState,
    getClues,
    guess
};
