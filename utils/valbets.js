const { addCredits, deleteBet, getAllBets } = require('./db');
const { grantAchievements, formatUnlocked } = require('./valachievements');

// Si el jugador no juega una competitiva en este tiempo, se devuelve lo apostado
const BET_EXPIRY = 12 * 60 * 60 * 1000;
const PAYOUT = 2;
// Apuesta minima para el logro "Alto riesgo"
const HIGH_ROLLER = 1000;

const PREDICTION_NAMES = { gana: 'gana', pierde: 'pierde' };

async function notify(client, bet, text) {
    const channel = await client.channels.fetch(bet.channelId).catch(() => null);
    if (!channel) return;
    await channel.send({ content: text, allowedMentions: { users: [bet.userId] } })
        .catch(error => console.error('No se pudo avisar una apuesta:', error.message));
}

// Paga las apuestas sobre el jugador de esta partida.
// Solo cuentan las apuestas hechas ANTES de que empezara la partida.
async function resolveBets(client, bets, link, match) {
    const gameStart = (match.metadata?.game_start || 0) * 1000;
    const player = match.players?.all_players?.find(p => p.puuid === link.puuid);
    const team = match.teams?.[player?.team?.toLowerCase()];
    if (!gameStart || !team) return;

    const draw = !team.has_won && team.rounds_won === team.rounds_lost;
    const score = `${team.rounds_won}-${team.rounds_lost}`;

    for (const bet of bets) {
        if (bet.createdAt >= gameStart) continue;
        await deleteBet(bet.id);

        if (draw) {
            await addCredits(bet.userId, bet.amount);
            await notify(client, bet, `🤝 **${link.name}** empató (${score}). <@${bet.userId}>, se te devolvieron **${bet.amount}** créditos.`);
            continue;
        }

        const won = (bet.prediction === 'gana') === team.has_won;
        const result = team.has_won ? 'ganó' : 'perdió';

        if (won) {
            await addCredits(bet.userId, bet.amount * PAYOUT);
            const unlocked = await grantAchievements(bet.userId, bet.amount >= HIGH_ROLLER ? ['buen_ojo', 'alto_riesgo'] : ['buen_ojo']);
            const total = await addCredits(bet.userId, 0);
            const lines = [`💰 **${link.name}** ${result} (${score}). <@${bet.userId}> ganó **${bet.amount * PAYOUT}** créditos. Saldo: ${total}`, ...formatUnlocked(unlocked)];
            await notify(client, bet, lines.join('\n'));
        } else {
            await notify(client, bet, `💸 **${link.name}** ${result} (${score}). <@${bet.userId}> perdió los **${bet.amount}** créditos que apostó.`);
        }
    }
}

async function refundExpiredBets(client) {
    const now = Date.now();
    for (const bet of await getAllBets()) {
        if (now - bet.createdAt < BET_EXPIRY) continue;
        await deleteBet(bet.id);
        await addCredits(bet.userId, bet.amount);
        await notify(client, bet, `⌛ <@${bet.userId}>, tu apuesta a **${bet.targetName}** venció sin partida competitiva. Se te devolvieron **${bet.amount}** créditos.`);
    }
}

module.exports = {
    BET_EXPIRY,
    PAYOUT,
    PREDICTION_NAMES,
    resolveBets,
    refundExpiredBets
};
