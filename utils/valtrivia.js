const { getAgents, getWeapons, getMaps, getSkins, normalize } = require('./valorant');
const { addTriviaPoint, addCredits } = require('./db');

const ANSWER_TIME = 30000;
const CREDITS_REWARD = 25;

// Una pregunta activa por canal: channelId -> { answers, display, timeout }
const activeQuestions = new Map();

function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

const GENERATORS = [
    async function abilityOwner() {
        const agent = pick(await getAgents());
        const ability = pick(agent.abilities.filter(a => a.displayName && a.slot !== 'Passive'));
        return {
            question: `¿Qué agente tiene la habilidad **${ability.displayName}**?`,
            answers: [agent.displayName],
            thumbnail: ability.displayIcon
        };
    },
    async function agentRole() {
        const agent = pick(await getAgents());
        return {
            question: `¿Qué rol tiene **${agent.displayName}**?`,
            answers: [agent.role.displayName],
            thumbnail: agent.displayIcon
        };
    },
    async function ultimateName() {
        const agent = pick(await getAgents());
        const ultimate = agent.abilities.find(a => a.slot === 'Ultimate');
        return {
            question: `¿Cómo se llama la definitiva de **${agent.displayName}**?`,
            answers: [ultimate.displayName],
            thumbnail: agent.displayIcon
        };
    },
    async function guessAgent() {
        const agent = pick(await getAgents());
        const hidden = agent.description.replace(new RegExp(agent.displayName, 'gi'), '█████');
        return {
            question: `¿De qué agente es esta descripción?\n> ${hidden}`,
            answers: [agent.displayName]
        };
    },
    async function abilityIcon() {
        const agent = pick(await getAgents());
        const ability = pick(agent.abilities.filter(a => a.displayIcon && a.slot !== 'Passive'));
        return {
            question: '¿De qué agente es esta habilidad?',
            answers: [agent.displayName],
            image: ability.displayIcon
        };
    },
    async function minimap() {
        const map = pick((await getMaps()).filter(m => m.displayIcon));
        return {
            question: '¿Qué mapa es este?',
            answers: [map.displayName],
            image: map.displayIcon
        };
    },
    async function skinWeapon() {
        const skin = pick((await getSkins()).filter(s => s.displayIcon));
        return {
            question: '¿De qué arma es esta skin?',
            answers: [skin.weaponName],
            image: skin.displayIcon
        };
    },
    async function weaponCost() {
        const weapon = pick((await getWeapons()).filter(w => w.shopData?.cost));
        return {
            question: `¿Cuántos créditos cuesta el arma **${weapon.displayName}**?`,
            answers: [String(weapon.shopData.cost)],
            thumbnail: weapon.displayIcon
        };
    }
];

function hasActiveQuestion(channelId) {
    return activeQuestions.has(channelId);
}

// Reserva el canal antes de cualquier await para evitar dos preguntas a la vez
async function startQuestion(channel) {
    if (activeQuestions.has(channel.id)) return null;
    activeQuestions.set(channel.id, { answers: [] });

    let generated;
    try {
        generated = await pick(GENERATORS)();
    } catch (error) {
        activeQuestions.delete(channel.id);
        throw error;
    }

    const state = {
        answers: generated.answers.map(normalize),
        display: generated.answers[0],
        timeout: setTimeout(() => {
            if (activeQuestions.get(channel.id) !== state) return;
            activeQuestions.delete(channel.id);
            channel.send(`⏰ Se acabó el tiempo. La respuesta era **${state.display}**.`).catch(console.error);
        }, ANSWER_TIME)
    };
    activeQuestions.set(channel.id, state);

    return { ...generated, seconds: ANSWER_TIME / 1000 };
}

async function handleAnswer(message) {
    const state = activeQuestions.get(message.channelId);
    if (!state || message.author.bot || !state.answers.length) return false;
    if (!state.answers.includes(normalize(message.content))) return false;

    // Se borra antes del await para que solo el primero gane
    activeQuestions.delete(message.channelId);
    clearTimeout(state.timeout);

    const points = await addTriviaPoint(message.author.id);
    await addCredits(message.author.id, CREDITS_REWARD);
    await message.reply(`✅ ¡Correcto, ${message.author.username}! Era **${state.display}**. Ganaste 1 punto (total: ${points}) y ${CREDITS_REWARD} créditos.`);
    return true;
}

module.exports = {
    startQuestion,
    handleAnswer,
    hasActiveQuestion
};
