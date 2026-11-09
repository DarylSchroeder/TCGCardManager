/* Shared catalog key and product-name matching used by the browser and tests. */
(function(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TCGCatalogMatching = api;
})(typeof self !== 'undefined' ? self : globalThis, function() {
    function normalizeValue(value) {
        return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function normalizeNumber(value) {
        return normalizeValue(value).replace(/p$/i, '').replace(/^0+(?=\d)/, '');
    }

    function matchKey(setName, number, condition) {
        return [normalizeValue(setName), normalizeNumber(number), normalizeValue(condition)].join('|');
    }

    function setNameAliases(setName) {
        const normalized = normalizeValue(setName);
        const aliases = new Set([normalized]);
        const promoSuffix = normalized.match(/^(.+) promos$/);
        const promoPrefix = normalized.match(/^promo pack: (.+)$/);
        const commanderSuffix = normalized.match(/^(.+) commander$/);
        const commanderPrefix = normalized.match(/^commander: (.+)$/);
        const universesBeyondPrefix = normalized.match(/^universes beyond: (.+)$/);
        const timeshiftsSuffix = normalized.match(/^(.+) timeshifts$/);

        if (promoSuffix) aliases.add(`promo pack: ${promoSuffix[1]}`);
        if (promoPrefix) aliases.add(`${promoPrefix[1]} promos`);
        if (commanderSuffix) aliases.add(`commander: ${commanderSuffix[1]}`);
        if (commanderPrefix) aliases.add(`${commanderPrefix[1]} commander`);
        if (universesBeyondPrefix) aliases.add(universesBeyondPrefix[1]);
        if (timeshiftsSuffix) aliases.add(timeshiftsSuffix[1]);
        return [...aliases];
    }

    function lookupKeys(setName, number, condition) {
        const keys = new Set();
        for (const alias of setNameAliases(setName)) {
            keys.add(matchKey(alias, number, condition));
            // Older databases indexed collector numbers before stripping the
            // promo `p` suffix. Query both formats until the catalog is reloaded.
            keys.add([normalizeValue(alias), normalizeValue(number).replace(/^0+(?=\d)/, ''), normalizeValue(condition)].join('|'));
        }
        return [...keys];
    }

    function normalizeProductName(value) {
        return normalizeValue(value)
            .split(/\s+\/\/\s+/)[0]
            .replace(/\s*\([^)]*\)\s*$/, '')
            .trim();
    }

    function findMatchingRow(candidates, cardName) {
        const uniqueCandidates = [...new Map(candidates.map(row => [row.tcgplayerId, row])).values()];
        const wantedName = normalizeValue(cardName);
        const exactMatches = uniqueCandidates.filter(row => normalizeValue(row.productName) === wantedName);
        if (exactMatches.length === 1) return exactMatches[0];
        if (exactMatches.length > 1) return null;

        const normalizedWantedName = normalizeProductName(cardName);
        const normalizedMatches = uniqueCandidates.filter(row => normalizeProductName(row.productName) === normalizedWantedName);
        return normalizedMatches.length === 1 ? normalizedMatches[0] : null;
    }

    function skuFallbackCondition(condition) {
        const normalized = normalizeValue(condition);
        const isFoil = /\s+foil$/.test(normalized);
        const baseCondition = normalized.replace(/\s+foil$/, '');
        if (baseCondition === 'near mint') return null;
        return isFoil ? 'Near Mint Foil' : 'Near Mint';
    }

    return { normalizeValue, normalizeNumber, matchKey, setNameAliases, lookupKeys, normalizeProductName, findMatchingRow, skuFallbackCondition };
});
