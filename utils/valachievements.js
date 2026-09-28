const { RANK_TIERS, rankTierName } = require('./valorant');
const { getAchievements, setAchievements, addCredits } = require('./db');

// reward: creditos que se ganan al desbloquearlo
const ACHIEVEMENTS = [
    { id: 'primera_victoria', emoji: '🏅', name: 'Primera victoria', description: 'Gana una competitiva', reward: 100 },
    { id: 'racha_5', emoji: '🔥', name: 'Imparable', description: 'Gana 5 competitivas seguidas', reward: 300 },
    { id: 'kills_30', emoji: '💀', name: 'Masacre', description: 'Haz 30 kills o más en una partida', reward: 300 },
    { id: 'ace', emoji: '🃏', name: 'Ace', description: 'Mata a los 5 enemigos en una ronda', reward: 250 },
    { id: 'mvp', emoji: '⭐', name: 'MVP', description: 'Termina con la mejor puntuación de la partida', reward: 150 },
    { id: 'cazacabezas', emoji: '🎯', name: 'Cazacabezas', description: '50% de headshots o más en una partida (mín. 15 kills)', reward: 200 },
    { id: 'rango_diamante', emoji: '💎', name: 'Diamante', description: 'Llega a Diamante', reward: 300 },
    { id: 'rango_inmortal', emoji: '🩸', name: 'Inmortal', description: 'Llega a Inmortal', reward: 500 },
    { id: 'rango_radiante', emoji: '☀️', name: 'Radiante', description: 'Llega a Radiante', reward: 1000 },
    { id: 'jugador_semana', emoji: '👑', name: 'Jugador de la semana', description: 'Gana más RR que nadie en una semana', reward: 300 },
    { id: 'sabelotodo', emoji: '🧠', name: 'Sabelotodo', description: 'Responde bien 10 preguntas de /valtrivia', reward: 150 },
    { id: 'buen_ojo', emoji: '🎰', name: 'Buen ojo', description: 'Gana una apuesta', reward: 100 },
    { id: 'alto_riesgo', emoji: '💰', name: 'Alto riesgo', description: 'Gana una apuesta de 1000 créditos o más', reward: 300 },
    { id: 'detective', emoji: '🔎', name: 'Detective', description: 'Adivina un Valordle', reward: 50 },
    { id: 'adivino', emoji: '🧙', name: 'Adivino', description: 'Adivina el Valordle al primer intento', reward: 300 },
    { id: 'constante', emoji: '📅', name: 'Constante', description: 'Adivina el Valordle 7 días seguidos', reward: 300 }
];

const RANK_ACHIEVEMENTS = [
    { id: 'rango_diamante', tier: 'Diamante' },
    { id: 'rango_inmortal', tier: 'Inmortal' },
    { id: 'rango_radiante', tier: 'Radiante' }
];

function getAchievement(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

// Otorga los logros que el usuario todavia no tiene. Devuelve solo los nuevos.
async function grantAchievements(userId, ids) {
    const owned = await getAchievements(userId);
    const fresh = [...new Set(ids)].filter(id => !owned[id] && getAchievement(id));
    if (!fresh.length) return [];

    for (const id of fresh) owned[id] = Date.now();
    await setAchievements(userId, owned);

    const unlocked = fresh.map(getAchievement);
    const credits = unlocked.reduce((sum, a) => sum + a.reward, 0);
    if (credits) await addCredits(userId, credits);
    return unlocked;
}

async function grantAchievement(userId, id) {
    return grantAchievements(userId, [id]);
}

function tierIndex(name) {
    return RANK_TIERS.findIndex(t => t.name === name);
}

// Logros de rango segun el ultimo rango conocido
async function checkRankAchievements(userId, rank) {
    const current = tierIndex(rankTierName(rank?.rank));
    if (current < 0) return [];
    const ids = RANK_ACHIEVEMENTS.filter(r => current >= tierIndex(r.tier)).map(r => r.id);
    return grantAchievements(userId, ids);
}

// Logros de una partida: victoria, racha, kills, ace, MVP y headshots
async function checkMatchAchievements(userId, puuid, match, history) {
    const players = match?.players?.all_players || [];
    const player = players.find(p => p.puuid === puuid);
    if (!player) return [];

    const ids = [];
    const team = match.teams?.[player.team?.toLowerCase()];
    if (team?.has_won) ids.push('primera_victoria');

    let streak = 0;
    for (const entry of history || []) {
        if (entry.mmr_change_to_last_game > 0) streak++;
        else break;
    }
    if (streak >= 5) ids.push('racha_5');

    const stats = player.stats || {};
    if ((stats.kills || 0) >= 30) ids.push('kills_30');

    const topScore = Math.max(...players.map(p => p.stats?.score || 0));
    if (stats.score && stats.score === topScore) ids.push('mvp');

    const shots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0);
    if ((stats.kills || 0) >= 15 && shots && stats.headshots / shots >= 0.5) ids.push('cazacabezas');

    const hasAce = (match.rounds || []).some(round =>
        (round.player_stats || []).some(ps => ps.player_puuid === puuid && ps.kills >= 5));
    if (hasAce) ids.push('ace');

    return grantAchievements(userId, ids);
}

// "🏆 Logro desbloqueado: 🔥 **Imparable** (+300 créditos)"
function formatUnlocked(unlocked) {
    return unlocked.map(a => `🏆 Logro desbloqueado: ${a.emoji} **${a.name}** (+${a.reward} créditos)`);
}

module.exports = {
    ACHIEVEMENTS,
    getAchievement,
    grantAchievement,
    grantAchievements,
    checkRankAchievements,
    checkMatchAchievements,
    formatUnlocked
};
