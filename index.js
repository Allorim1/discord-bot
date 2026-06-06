require('dotenv').config({ path: './.env' });

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.prefixCommands = new Collection();

// Load prefix commands
const prefixCommandsPath = path.join(__dirname, 'prefix');
readdirSync(prefixCommandsPath).forEach(file => {
    const command = require(`./prefix/${file}`);
    client.prefixCommands.set(command.name, command);
});

// Load slash commands
const slashCommandsPath = path.join(__dirname, 'slash');
readdirSync(slashCommandsPath).forEach(file => {
    const command = require(`./slash/${file}`);
    client.commands.set(command.data.name, command);
});

// Load events
const eventsPath = path.join(__dirname, 'events');
readdirSync(eventsPath).forEach(file => {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
});

client.login(process.env.token);