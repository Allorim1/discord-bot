const { EmbedBuilder } = require('discord.js');

const COLORS = {
    PRIMARY: '#6600ff',
    SUCCESS: '#00ff88',
    ERROR: '#ff4444',
    WARNING: '#ffaa00',
    INFO: '#3399ff'
};

function createBaseEmbed(title, description = '', userAvatarURL) {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(title)
        .setAuthor({
            name: description || 'Ketil Farm',
            iconURL: userAvatarURL
        });
}

function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(title)
        .setDescription(description);
}

function createErrorEmbed(description) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setDescription(description);
}

module.exports = {
    COLORS,
    createBaseEmbed,
    createSuccessEmbed,
    createErrorEmbed
};