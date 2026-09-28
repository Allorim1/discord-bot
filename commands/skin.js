const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSkins, getContentTiers, normalize } = require('../utils/valorant');
const { getSkinPrice } = require('../utils/valstore');

const COLORS = { PRIMARY: '#ff4655', WARNING: '#ffaa00' };

module.exports = {
    name: 'skin',
    description: 'Ver una skin de Valorant con sus variantes',
    category: 'valorant',
    cooldown: 5,

    data: () => new SlashCommandBuilder()
        .setName('skin')
        .setDescription('Ver una skin de Valorant con sus variantes')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de la skin, en español o inglés (ej: Vandal Araxys, Reaver Vandal)')
                .setRequired(true)),

    async execute(context, args = []) {
        const query = context.options?.getString?.('nombre') || args.join(' ');
        if (!query) return warning('Escribe el nombre de la skin, por ejemplo: `/skin Vandal Araxys`');

        const skins = await getSkins();
        let matches = searchSkins(skins, query);

        // Si no aparece en español, buscar por el nombre en ingles
        if (!matches.length) {
            const englishMatches = searchSkins(await getSkins('en-US'), query);
            matches = englishMatches
                .map(en => skins.find(skin => skin.uuid === en.uuid))
                .filter(Boolean);
        }

        if (!matches.length) return warning(`No encontré ninguna skin llamada **${query}**.`);

        const skin = matches[0];
        const tier = (await getContentTiers()).find(t => t.uuid === skin.contentTierUuid);
        // El precio sale de la API de HenrikDev: si falla, la skin se muestra igual
        // undefined = no se pudo consultar; null = no se vende en la tienda
        const price = await getSkinPrice(skin).catch(() => undefined);
        const video = [...skin.levels].reverse().find(level => level.streamedVideo)?.streamedVideo;

        const embed = new EmbedBuilder()
            .setColor(tier?.highlightColor ? `#${tier.highlightColor.slice(0, 6)}` : COLORS.PRIMARY)
            .setTitle(skin.displayName)
            .setImage(skin.displayIcon || skin.chromas[0]?.fullRender || null)
            .addFields(
                { name: 'Arma', value: skin.weaponName, inline: true },
                { name: 'Niveles', value: String(skin.levels.length), inline: true }
            );

        if (price !== undefined) {
            embed.addFields({ name: 'Precio', value: price ? `${price} VP` : 'No se vende en la tienda', inline: true });
        }

        if (tier) embed.setAuthor({ name: tier.displayName.trim(), iconURL: tier.displayIcon });

        const variants = skin.chromas.slice(1).map(variantName);
        if (variants.length) embed.addFields({ name: 'Variantes', value: variants.join('\n') });
        if (video) embed.addFields({ name: 'Video', value: `[Ver la skin en acción](${video})` });

        const others = matches.slice(1, 6).map(s => s.displayName);
        if (others.length) embed.setFooter({ text: `También: ${others.join(', ')}` });

        return { embeds: [embed] };
    }
};

// "Vandal Araxys nivel 4\n(Variante 1 Morada)" -> "Variante 1 Morada"
function variantName(chroma) {
    const inside = chroma.displayName.match(/\(([^)]+)\)/);
    return inside ? inside[1] : chroma.displayName.split('\n').pop();
}

// Coincidencia exacta, luego por inicio, luego contiene, luego todas las palabras en cualquier orden
function searchSkins(skins, query) {
    const q = normalize(query);
    const words = query.split(/\s+/).map(normalize).filter(Boolean);
    if (!q) return [];

    const scored = [];
    for (const skin of skins) {
        const name = normalize(skin.displayName);
        let score = 0;
        if (name === q) score = 4;
        else if (name.startsWith(q)) score = 3;
        else if (name.includes(q)) score = 2;
        else if (words.every(word => name.includes(word))) score = 1;
        if (score) scored.push({ skin, score });
    }

    return scored
        .sort((a, b) => b.score - a.score || a.skin.displayName.length - b.skin.displayName.length)
        .map(entry => entry.skin);
}

function warning(message) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setDescription(message);
    return { embeds: [embed], ephemeral: true };
}
