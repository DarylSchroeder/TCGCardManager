(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const pricing = factory();
        root.calculateTCGPrice = pricing.calculateTCGPrice;
        root.roundPrice = pricing.roundPrice;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    const MINIMUM_PRICE = 0.50;
    const EXCLUDED_CARDS = [
        'Godless Shrine',
        'Cavern of Souls',
        'Temple Garden',
        'Steam Vents',
        'Overgrown Tomb',
        'Sacred Foundry',
        'Watery Grave',
        'Stomping Ground',
        'Breeding Pool',
        'Blood Crypt',
        'Hallowed Fountain'
    ];

    function roundPrice(price) {
        return Math.round((parseFloat(price) || 0) * 100) / 100;
    }

    function calculateTCGPrice(item) {
        const marketPrice = Number(item.marketPrice || 0);
        const lowPrice = Number(item.lowPrice || 0);
        const lowShipping = Number(item.lowShipping || 0);
        const originalPrice = Number(item.originalPrice || 0);

        const estimatedShipping = Math.max(0, lowShipping - lowPrice);

        const isExcludedCard = EXCLUDED_CARDS.some(excludedName =>
            item.name &&
            item.name.toLowerCase().includes(excludedName.toLowerCase())
        );

        if (isExcludedCard) {
            return roundPrice(originalPrice);
        }

        if (marketPrice > 30 || lowPrice > 30) {
            return roundPrice(originalPrice);
        }

        if (marketPrice < MINIMUM_PRICE && lowPrice < MINIMUM_PRICE) {
            return MINIMUM_PRICE;
        }

        const trueMarket = Math.max(marketPrice, lowPrice);
        let shippingAdvantage;

        if (trueMarket < 2) {
            shippingAdvantage = 0.99;
        } else if (trueMarket < 10) {
            shippingAdvantage = 0.50;
        } else {
            shippingAdvantage = 0.25;
        }

        const lowestWithShippingAdjusted = lowPrice + estimatedShipping - shippingAdvantage;
        const preliminaryPrice = Math.min(trueMarket, lowestWithShippingAdjusted);
        const finalPrice = Math.max(preliminaryPrice, MINIMUM_PRICE);

        return roundPrice(finalPrice);
    }

    return {
        calculateTCGPrice,
        roundPrice,
        MINIMUM_PRICE,
        EXCLUDED_CARDS
    };
}));
