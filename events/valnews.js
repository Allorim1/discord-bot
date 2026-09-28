const { EmbedBuilder } = require('discord.js');
const { getNews, getServerStatus } = require('../utils/valorant');
const { getAllValorantChannels, getSeenNews, setSeenNews } = require('../utils/db');

const POLL_INTERVAL = 30 * 60 * 1000;
// Region de la que se avisan mantenimientos e incidentes
const STATUS_REGION = process.env.VALORANT_STATUS_REGION || 'latam';
// Categorias de noticias que no se publican
const SKIPPED_CATEGORIES = ['esports'];
const CATEGORY_NAMES = {
    patch_notes: '📝 Notas del parche',
    game_updates: '🎮 Actualización del juego',
    dev: '🛠️ Desarrollo',
    announcements: '📢 Anuncio',
    community: '👥 Comunidad'
};
const COLORS = { NEWS: '#ff4655', MAINTENANCE: '#ffaa00', INCIDENT: '#ed4245' };

let running = false;

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        if (!process.env.HENRIK_API_KEY) return;
        setInterval(() => checkNews(client), POLL_INTERVAL);
        checkNews(client);
    }
};

async function checkNews(client) {
    if (running) return;
    running = true;

    try {
        const channels = await getAllValorantChannels('noticias');
        if (!channels.length) return;

        const [news, status] = await Promise.all([
            getNews().catch(() => []),
            getServerStatus(STATUS_REGION).catch(() => null)
        ]);

        const items = [
            ...(news || [])
                .filter(n => !SKIPPED_CATEGORIES.includes(n.category))
                .map(n => ({ id: `news:${n.url}`, embed: () => newsEmbed(n) })),
            ...(status?.maintenances || []).map(s => ({ id: `status:${s.id}`, embed: () => statusEmbed(s, 'MAINTENANCE') })),
            ...(status?.incidents || []).map(s => ({ id: `status:${s.id}`, embed: () => statusEmbed(s, 'INCIDENT') }))
        ];

        const seen = await getSeenNews();
        // La primera vez solo se guardan, para no publicar todas las noticias viejas
        if (!seen) {
            await setSeenNews(items.map(item => item.id));
            return;
        }

        const fresh = items.filter(item => !seen.includes(item.id)).reverse();
        if (!fresh.length) return;
        await setSeenNews([...seen, ...fresh.map(item => item.id)]);

        for (const item of fresh) {
            let embed;
            try {
                embed = item.embed();
            } catch (error) {
                console.error(`Noticia de Valorant con datos invalidos (${item.id}):`, error.message);
                continue;
            }
            for (const { channelId } of channels) {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (!channel) continue;
                await channel.send({ embeds: [embed] })
                    .catch(error => console.error(`No se pudo publicar noticia en ${channelId}:`, error.message));
            }
        }
    } catch (error) {
        console.error('Error revisando noticias de Valorant:', error);
    } finally {
        running = false;
    }
}

function newsEmbed(news) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.NEWS)
        .setAuthor({ name: CATEGORY_NAMES[news.category] || '📰 Noticias de Valorant' })
        .setTitle(news.title.slice(0, 256));

    const url = news.external_link || news.url;
    if (/^https?:\/\//.test(url)) embed.setURL(url);
    if (/^https?:\/\//.test(news.banner_url)) embed.setImage(news.banner_url);
    if (news.date) embed.setTimestamp(new Date(news.date));
    return embed;
}

// Los textos vienen en varios idiomas: se prefiere español
function pickTranslation(list) {
    if (!list?.length) return null;
    const found = list.find(t => t.locale?.startsWith('es'))
        || list.find(t => t.locale?.startsWith('en'))
        || list[0];
    return found.content;
}

function statusEmbed(status, type) {
    const title = pickTranslation(status.titles) || (type === 'MAINTENANCE' ? 'Mantenimiento' : 'Problema en los servidores');
    const update = pickTranslation(status.updates?.[0]?.translations);

    const embed = new EmbedBuilder()
        .setColor(COLORS[type])
        .setAuthor({ name: `${type === 'MAINTENANCE' ? '🔧 Mantenimiento' : '⚠️ Incidente'} · ${STATUS_REGION.toUpperCase()}` })
        .setTitle(title.slice(0, 256));

    if (update) embed.setDescription(update.slice(0, 4000));
    if (status.created_at) embed.setTimestamp(new Date(status.created_at));
    return embed;
}
