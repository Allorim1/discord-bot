const { EmbedBuilder } = require('discord.js');
const { getStoreFeatured, getStoreOffers, getBundles, getCosmeticIndex } = require('./valorant');

const VP_CURRENCY = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
const OFFERS_TTL = 60 * 60 * 1000;
const COLORS = { PRIMARY: '#ff4655' };

let offersCache = null;

function firstCost(cost) {
    if (typeof cost === 'number') return cost;
    if (!cost || typeof cost !== 'object') return null;
    return cost[VP_CURRENCY] ?? Object.values(cost)[0] ?? null;
}

// Paquetes destacados en un formato comun. La API tiene dos formatos (v1 y v2).
// -> [{ uuid, price, secondsRemaining, items: [{ uuid, name, basePrice, price, amount }] }]
function normalizeFeatured(data) {
    if (Array.isArray(data)) {
        return data.map(b => ({
            uuid: b.bundle_uuid,
            price: b.bundle_price ?? null,
            secondsRemaining: b.seconds_remaining ?? null,
            items: (b.items || []).map(i => ({
                uuid: i.uuid,
                name: i.name,
                basePrice: i.base_price ?? null,
                price: i.discounted_price ?? i.base_price ?? null,
                amount: i.amount ?? 1
            }))
        }));
    }

    const featured = data?.FeaturedBundle;
    const bundles = featured?.Bundles?.length ? featured.Bundles : (featured?.Bundle ? [featured.Bundle] : []);
    return bundles.map(b => {
        const items = (b.Items || []).map(i => ({
            uuid: i.Item?.ItemID,
            name: null,
            basePrice: i.BasePrice ?? null,
            price: i.DiscountedPrice ?? i.BasePrice ?? null,
            amount: i.Item?.Amount ?? 1
        }));
        return {
            uuid: b.DataAssetID,
            price: items.reduce((sum, i) => sum + (i.price || 0), 0) || null,
            secondsRemaining: b.DurationRemainingInSeconds ?? null,
            items
        };
    });
}

async function getFeaturedBundles() {
    return normalizeFeatured(await getStoreFeatured());
}

// uuid de skin o de nivel de skin -> precio en VP
async function getPriceIndex() {
    if (offersCache && Date.now() - offersCache.time < OFFERS_TTL) return offersCache.index;

    const data = await getStoreOffers();
    const index = new Map();
    for (const offer of data?.offers || []) {
        const cost = firstCost(offer.cost);
        if (!cost) continue;
        if (offer.offer_id) index.set(offer.offer_id, cost);
        if (offer.skin_id) index.set(offer.skin_id, cost);
    }
    for (const offer of data?.Offers || []) {
        const cost = firstCost(offer.Cost);
        if (!cost) continue;
        if (offer.OfferID) index.set(offer.OfferID, cost);
        for (const reward of offer.Rewards || []) index.set(reward.ItemID, cost);
    }

    offersCache = { index, time: Date.now() };
    return index;
}

async function getSkinPrice(skin) {
    const index = await getPriceIndex();
    return index.get(skin.uuid) ?? index.get(skin.levels?.[0]?.uuid) ?? null;
}

async function buildBundleEmbeds(bundles) {
    const [bundleData, cosmetics] = await Promise.all([
        getBundles().catch(() => []),
        getCosmeticIndex().catch(() => new Map())
    ]);

    return bundles.slice(0, 10).map(bundle => {
        const info = bundleData.find(b => b.uuid === bundle.uuid);
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`🛒 ${info?.displayName || 'Paquete destacado'}`);

        if (info?.displayIcon) embed.setImage(info.displayIcon);

        const lines = bundle.items.map(item => {
            const cosmetic = cosmetics.get(item.uuid);
            const name = cosmetic?.name || item.name || 'Objeto';
            const amount = item.amount > 1 ? ` x${item.amount}` : '';
            const price = item.price ? ` — ${item.price} VP` : '';
            const discount = item.basePrice && item.price && item.price < item.basePrice ? ` ~~${item.basePrice}~~` : '';
            return `• ${name}${amount}${price}${discount}`;
        });
        if (lines.length) embed.setDescription(lines.join('\n').slice(0, 4000));

        const fields = [];
        if (bundle.price) fields.push({ name: 'Precio del paquete', value: `${bundle.price} VP`, inline: true });
        if (bundle.secondsRemaining) {
            const ends = Math.floor(Date.now() / 1000) + bundle.secondsRemaining;
            fields.push({ name: 'Termina', value: `<t:${ends}:R>`, inline: true });
        }
        if (fields.length) embed.addFields(fields);

        return embed;
    });
}

module.exports = {
    getFeaturedBundles,
    getSkinPrice,
    buildBundleEmbeds
};
