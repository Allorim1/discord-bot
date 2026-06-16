const { getRandomTriviaQuestion, addTriviaPoint } = require('../utils/db');

let currentQuestion = null;
const TRIVIA_CHANNEL_ID = '1514320666029981728';

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot conectado como ${client.user.tag}`);
        
        setInterval(async () => {
            const channel = client.channels.cache.get(TRIVIA_CHANNEL_ID);
            if (!channel) {
                console.log('Trivia channel not found, skipping...');
                return;
            }
            
            currentQuestion = await getRandomTriviaQuestion();
            channel.send(`Trivia de la hora: ${currentQuestion.question}\nEscribelo en 60 segundos para ganar un punto!`);
            
            setTimeout(() => {
                currentQuestion = null;
            }, 60000);
        }, 3600000);
    }
};

module.exports.handleAnswer = async (message) => {
    if (!currentQuestion || message.author.bot || message.channelId !== TRIVIA_CHANNEL_ID) return false;
    
    const answer = message.content.toLowerCase().trim();
    if (answer === currentQuestion.answer.toLowerCase()) {
        const points = await addTriviaPoint(message.author.id);
        message.reply(`${message.author.username} respondio correctamente! Gano 1 punto. Total: ${points}`);
        currentQuestion = null;
        return true;
    }
    return false;
};