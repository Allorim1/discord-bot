require('dotenv').config({ path: './.env' });
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/rest');
const { readdirSync } = require('fs');
const path = require('path');

const commands = [];
const slashCommandsPath = path.join(__dirname, 'slash');
readdirSync(slashCommandsPath).forEach(file => {
    const command = require(`./slash/${file}`);
    commands.push(command.data.toJSON());
});

const rest = new REST({ version: '10' }).setToken(process.env.token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        if (!process.env.clientID) {
            console.error('ERROR: clientID not found in .env file');
            process.exit(1);
        }
        await rest.put(
            Routes.applicationCommands(process.env.clientID),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();