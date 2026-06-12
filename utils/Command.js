const { Collection } = require('discord.js');

class GameCommand {
    constructor(options) {
        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
        this.cooldown = options.cooldown || 0;
        this.aliases = options.aliases || [];
    }
    
    async execute(context, args) {
        throw new Error('Implement execute method in subclass');
    }
    
    createSlashCommand() {
        const { SlashCommandBuilder } = require('discord.js');
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description);
    }
}

class KetilCommand extends GameCommand {
    constructor(options) {
        super(options);
    }
    
    async execute(context, args) {
        const { getFarm, getEnergy } = require('../utils/ketil');
        const { EmbedBuilder } = require('discord.js');
        
        const farm = await getFarm(context.author?.id || context.user?.id);
        await getEnergy(context.author?.id || context.user?.id);
        
        if (!farm.plot) {
            return this.createErrorEmbed(context, 'Primero usa /startv para comenzar tu aventura.');
        }
        
        return this.executeCommand(farm, context, args);
    }
    
    async executeCommand(farm, context, args) {
        throw new Error('Implement executeCommand method');
    }
    
    createErrorEmbed(context, description) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#ff4444')
            .setDescription(description);
        
        if (context.reply) {
            return { embeds: [embed], ephemeral: true };
        }
        return { embeds: [embed], ephemeral: true };
    }
    
    createSuccessEmbed(context, title, fields = [], description) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#6600ff')
            .setTitle(title)
            .setAuthor({
                name: context.author?.username || context.user?.username,
                iconURL: context.author?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            });
        
        if (description) embed.setDescription(description);
        for (const field of fields) {
            embed.addFields(field);
        }
        
        return { embeds: [embed] };
    }
}

class GardenCommand extends GameCommand {
    constructor(options) {
        super(options);
    }
    
    async execute(context, args) {
        const { getUserGarden, checkReadyPlants, getPlantTypes } = require('../utils/db');
        const { EmbedBuilder } = require('discord.js');
        
        const userId = context.author?.id || context.user?.id;
        const garden = await getUserGarden(userId);
        await checkReadyPlants(userId);
        const plants = await getPlantTypes();
        
        return this.executeGarden(garden, plants, context, args);
    }
}

module.exports = {
    GameCommand,
    KetilCommand,
    GardenCommand
};