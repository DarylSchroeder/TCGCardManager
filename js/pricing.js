(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        const pricing = factory();
        root.calculatePrice = pricing.calculatePrice;
        root.calculateTCGPrice = pricing.calculateTCGPrice;
        root.roundPrice = pricing.roundPrice;
        root.needsPricingReview = pricing.needsPricingReview;
        root.isBelowMarketGuardrail = pricing.isBelowMarketGuardrail;
        root.isExcludedCard = pricing.isExcludedCard;
        root.EXCLUDED_CARDS = pricing.EXCLUDED_CARDS;
        root.MINIMUM_PRICE = pricing.MINIMUM_PRICE;
        root.DEFAULT_PRICING_STRATEGY = pricing.DEFAULT_PRICING_STRATEGY;
        root.PRICING_STRATEGIES = pricing.PRICING_STRATEGIES;
    }
}(typeof self !== 'undefined' ? self : this, function() {
    const MINIMUM_PRICE = 0.50;
    const SELLER_SHIPPING_PRICE = 0.99;
    const DEFAULT_PRICING_STRATEGY = 'shippingAdjusted';
    const PRICING_STRATEGIES = {
        shippingAdjusted: {
            id: 'shippingAdjusted',
            label: 'Shipping-adjusted low',
            description: 'Uses the lower of true market value and the low listing after a sliding shipping advantage.'
        },
        undercutLow: {
            id: 'undercutLow',
            label: 'Undercut TCG Low by $0.01',
            description: 'Lists one cent below TCG Low while retaining the standard pricing guardrails.'
        },
        marketAwareLow: {
            id: 'marketAwareLow',
            label: 'Market-aware TCG Low',
            description: 'Undercuts TCG Low unless it is more than $0.50 below market, then undercuts market instead.'
        },
        marketGuardedShippedLow: {
            id: 'marketGuardedShippedLow',
            label: 'Market-guarded shipped low',
            description: 'Undercuts the lowest shipped listing using $0.99 shipping, while limiting discounts below Market to 5% or $0.50 and never pricing below TCG Low.'
        }
    };
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
        'Hallowed Fountain', 
        "Heroic Intervention", 
        "T'Challa's Protection - Teferi's Protection (Borderless)",
        "Seize the Day",
        "Steelshaper's Gift", 
        "Simulacrum Synthesizer",
        "Defense of he Heart",
        "No Mercy",
        "Primal Vigor",
        "Show and Tell"
    ];

    function roundPrice(price) {
        return Math.round((parseFloat(price) || 0) * 100) / 100;
    }

    function getPricingStrategy(strategyId) {
        return PRICING_STRATEGIES[strategyId] || PRICING_STRATEGIES[DEFAULT_PRICING_STRATEGY];
    }

    function needsPricingReview(item) {
        const marketPrice = Number(item.marketPrice || 0);
        const lowPrice = Number(item.lowPrice || 0);

        // A valid market price with no TCG Low listing cannot be safely undercut.
        return marketPrice >= MINIMUM_PRICE && lowPrice <= 0;
    }

    function isBelowMarketGuardrail(item) {
        const marketPrice = Number(item.marketPrice || 0);
        const listingPrice = roundPrice(item.calculatedPrice ?? item.originalPrice ?? item.price ?? 0);

        if (marketPrice <= 0 || listingPrice >= marketPrice) return false;

        const allowedDiscount = Math.min(marketPrice * 0.05, 0.50);
        const minimumAllowedPrice = roundPrice(Math.max(MINIMUM_PRICE, marketPrice - allowedDiscount));
        return listingPrice < minimumAllowedPrice;
    }

    function isExcludedCard(cardName) {
        return EXCLUDED_CARDS.some(excludedName =>
            cardName &&
            cardName.toLowerCase().includes(excludedName.toLowerCase())
        );
    }

    function calculatePrice(item, strategyId = DEFAULT_PRICING_STRATEGY) {
        const marketPrice = Number(item.marketPrice || 0);
        const lowPrice = Number(item.lowPrice || 0);
        const lowShipping = Number(item.lowShipping || 0);
        const originalPrice = Number(item.originalPrice || 0);
        const strategy = getPricingStrategy(strategyId);

        const estimatedShipping = Math.max(0, lowShipping - lowPrice);

        if (isExcludedCard(item.name)) {
            return roundPrice(originalPrice);
        }

        if (marketPrice > 30 || lowPrice > 30) {
            return roundPrice(originalPrice);
        }

        // Without a TCG Low value, keep the supplied baseline rather than letting
        // a low-based strategy push the card to its minimum price by mistake.
        if (marketPrice >= MINIMUM_PRICE && lowPrice <= 0) {
            return roundPrice(originalPrice);
        }

        if (
            strategy.id === 'marketGuardedShippedLow' &&
            (marketPrice <= 0 || lowPrice <= 0 || lowShipping <= 0)
        ) {
            return roundPrice(originalPrice);
        }

        if (marketPrice < MINIMUM_PRICE && lowPrice < MINIMUM_PRICE) {
            return MINIMUM_PRICE;
        }

        if (strategy.id === 'undercutLow') {
            return roundPrice(Math.max(lowPrice - 0.01, MINIMUM_PRICE));
        }

        if (strategy.id === 'marketAwareLow') {
            const targetPrice = lowPrice < marketPrice - 0.50 ? marketPrice : lowPrice;
            return roundPrice(Math.max(targetPrice - 0.01, MINIMUM_PRICE));
        }

        if (strategy.id === 'marketGuardedShippedLow') {
            // The shipped-low field is the competitor's delivered price. Compare it
            // with our listing price plus our fixed shipping charge, then undercut by $0.01.
            const shippedLowTarget = lowShipping - SELLER_SHIPPING_PRICE - 0.01;
            const marketDiscountLimit = Math.min(marketPrice * 0.05, 0.50);
            const marketFloor = marketPrice - marketDiscountLimit;
            const competitiveTarget = Math.min(marketPrice, shippedLowTarget);
            const safeFloor = Math.max(MINIMUM_PRICE, lowPrice, marketFloor);

            return roundPrice(Math.max(safeFloor, competitiveTarget));
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

    // Retained for existing callers and imports; this is the original strategy.
    function calculateTCGPrice(item) {
        return calculatePrice(item, DEFAULT_PRICING_STRATEGY);
    }

    return {
        calculatePrice,
        calculateTCGPrice,
        roundPrice,
        needsPricingReview,
        isBelowMarketGuardrail,
        isExcludedCard,
        MINIMUM_PRICE,
        EXCLUDED_CARDS,
        DEFAULT_PRICING_STRATEGY,
        PRICING_STRATEGIES,
        getPricingStrategy
    };
}));
