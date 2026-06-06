const { getPlayerData, savePlayerData, getSettlement } = require('../utils/game');

const COMMANDS = [
    {
        name: 'startv',
        description: 'Comenzar tu aventura como esclavo en la granja de Ketil',
        category: 'Principal',
        cooldown: 0,
        aliases: []
    },
    {
        name: 'farm',
        description: 'Ver tu granja, deuda, energia y trigo',
        category: 'Principal',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'clear',
        description: 'Desarraigar arboles de la parcela (20 energia)',
        category: 'Principal',
        cooldown: 30,
        aliases: []
    },
    {
        name: 'till',
        description: 'Arar la tierra (15 energia)',
        category: 'Principal',
        cooldown: 30,
        aliases: []
    },
    {
        name: 'plantwheat',
        description: 'Sembrar trigo (10 energia, crece en 5 minutos)',
        category: 'Principal',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'harvestwheat',
        description: 'Cosechar trigo (+50 monedas, -50 deuda)',
        category: 'Principal',
        cooldown: 5,
        aliases: ['harvest']
    },
    {
        name: 'raid',
        description: 'Asaltar aldeas o barcos (Mercenario)',
        category: 'Accion',
        cooldown: 60,
        aliases: []
    },
    {
        name: 'explore',
        description: 'Explorar tierras (Explorador)',
        category: 'Accion',
        cooldown: 60,
        aliases: []
    },
    {
        name: 'settle',
        description: 'Fundar una colonia',
        category: 'Gobierno',
        cooldown: 0,
        aliases: []
    },
    {
        name: 'manage',
        description: 'Panel de gobierno de tu colonia',
        category: 'Gobierno',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'tutorial',
        description: 'Guia completa para nuevos jugadores',
        category: 'Principal',
        cooldown: 0,
        aliases: []
    },
    {
        name: 'help',
        description: 'Ver ayuda de comandos',
        category: 'Principal',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'garden',
        description: 'Ver tu jardin (juego secundario)',
        category: 'Jardin',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'plant',
        description: 'Plantar en el jardin',
        category: 'Jardin',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'shop',
        description: 'Ver la tienda de semillas',
        category: 'Jardin',
        cooldown: 30,
        aliases: []
    },
    {
        name: 'leaderboard',
        description: 'Ver top de puntos de trivia',
        category: 'Trivia',
        cooldown: 30,
        aliases: []
    },
    {
        name: 'triviascore',
        description: 'Ver tu puntuacion de trivia',
        category: 'Trivia',
        cooldown: 5,
        aliases: ['trivia']
    }
];

function getCommand(name) {
    return COMMANDS.find(cmd => cmd.name === name || cmd.aliases.includes(name));
}

function getAllCommands() {
    return COMMANDS;
}

function getCommandsByCategory() {
    const categories = {};
    for (const cmd of COMMANDS) {
        if (!categories[cmd.category]) {
            categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd);
    }
    return categories;
}

module.exports = {
    COMMANDS,
    getCommand,
    getAllCommands,
    getCommandsByCategory
};