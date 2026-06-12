require('dotenv').config({ path: './.env' });

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
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

// Load unified commands
const commandsPath = path.join(__dirname, 'commands');
readdirSync(commandsPath).forEach(file => {
    const command = require(`./commands/${file}`);
    
    // Register slash command
    if (command.data) {
        client.commands.set(command.name, command);
    }
    
    // Register prefix command
    client.prefixCommands.set(command.name, command);
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

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    try {
        const result = await command.execute(interaction);
        if (result) await interaction.reply(result);
    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Error al ejecutar el comando.', ephemeral: true });
        }
    }
});

// Handle prefix commands
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Handle trivia answers
    const triviaHandler = require('./events/trivia');
    if (await triviaHandler.handleAnswer(message)) return;
    
    const prefix = process.env.prefix;
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.prefixCommands.get(commandName);
    if (!command) return;
    
    try {
        const result = await command.execute(message, args);
        if (result && typeof result === 'object') {
            if (result.embeds) await message.reply(result);
            else await message.reply(result);
        } else if (result) {
            await message.reply(result);
        }
    } catch (error) {
        console.error(error);
        await message.reply('Error al ejecutar el comando.');
    }
});

client.login(process.env.token);