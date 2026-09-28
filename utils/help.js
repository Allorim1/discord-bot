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
    },
    {
        name: 'vincular',
        description: 'Vincular tu Discord con tu Riot ID',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'desvincular',
        description: 'Quitar tu Riot ID vinculado',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'partida',
        description: 'Ver la tabla de la ultima partida (Nombre#TAG, @usuario o tu cuenta)',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'valcanal',
        description: 'Elegir el canal de avisos de partidas o noticias (admins)',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'agente',
        description: 'Ver informacion y habilidades de un agente',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'arma',
        description: 'Ver estadisticas de un arma',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'mapa',
        description: 'Ver informacion de un mapa',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'rango',
        description: 'Ver rango y ultimas partidas (Nombre#TAG, @usuario o tu cuenta)',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'valtrivia',
        description: 'Lanzar una pregunta de trivia de Valorant',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'stats',
        description: 'Estadisticas de las ultimas 20 competitivas',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'comparar',
        description: 'Comparar tus estadisticas con otro jugador',
        category: 'Valorant',
        cooldown: 15,
        aliases: []
    },
    {
        name: 'valtop',
        description: 'Ranking de Valorant del servidor',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'valroles',
        description: 'Roles automaticos por rango (admins)',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'equipos',
        description: 'Armar 2 equipos con el canal de voz y sortear mapa',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'agenterandom',
        description: 'Agente al azar (opcional por rol)',
        category: 'Valorant',
        cooldown: 3,
        aliases: []
    },
    {
        name: 'buscar',
        description: 'Buscar companeros para jugar',
        category: 'Valorant',
        cooldown: 30,
        aliases: []
    },
    {
        name: 'apostar',
        description: 'Apostar creditos a si alguien gana su proxima competitiva',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'creditos',
        description: 'Ver tus creditos o el ranking',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'skin',
        description: 'Ver una skin con sus variantes',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'mira',
        description: 'Ver una mira a partir de su codigo',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'vct',
        description: 'Proximos partidos y resultados de esports',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'bundle',
        description: 'Paquete destacado de la tienda',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'progreso',
        description: 'Grafico de RR de las ultimas competitivas',
        category: 'Valorant',
        cooldown: 15,
        aliases: []
    },
    {
        name: 'perfil',
        description: 'Tu perfil: rango, creditos, insignias',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'logros',
        description: 'Logros desbloqueados y los que faltan',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
    },
    {
        name: 'valordle',
        description: 'Adivina el agente del dia',
        category: 'Valorant',
        cooldown: 2,
        aliases: []
    },
    {
        name: 'veto',
        description: 'Veto de mapas entre dos capitanes',
        category: 'Valorant',
        cooldown: 10,
        aliases: []
    },
    {
        name: 'callouts',
        description: 'Nombres de las zonas de un mapa',
        category: 'Valorant',
        cooldown: 5,
        aliases: []
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