# Pricing quick reference

## Where to change behavior

Implement all calculation changes in `js/pricing.js`. The browser calls it from `index.html`; Node tests and `scripts/validate-pricing-output.js` import the same module. Avoid copying pricing formulas into UI or validation code.

## Inputs and baseline guardrails

`calculatePrice(item, strategyId)` reads `name`, `marketPrice`, `lowPrice`, `lowShipping`, and `originalPrice`. Missing/falsy numeric values become zero. `roundPrice` rounds to cents. The selected browser strategy is saved in `tcg_pricing_strategy`; the default remains `shippingAdjusted`.

Order of rules:

1. Excluded card name: return `originalPrice`.
2. Market or low price above `$30`: return `originalPrice`. A card enters Manual Review for this reason only when its current listing price is above Market.
3. For `marketGuardedShippedLow`, missing or zero Market, Low, or Low With Shipping returns `originalPrice`.
4. Both market and low are below `$0.50`: return the `$0.50` minimum.
5. Otherwise apply the selected strategy, with a `$0.50` floor.

The named exclusions are in `EXCLUDED_CARDS` in `js/pricing.js` and matched as case-insensitive substrings. Current names include Godless Shrine, Cavern of Souls, all ten shock lands, Heroic Intervention, T'Challa's Protection - Teferi's Protection (Borderless), Seize the Day, Steelshaper's Gift, Simulacrum Synthesizer, Defense of he Heart, No Mercy, Primal Vigor, and Show and Tell. Preserve spelling as implemented unless intentionally correcting the list.

## Strategies

| Id | Current rule |
| --- | --- |
| `shippingAdjusted` | Compute estimated shipping as `max(0, lowShipping - lowPrice)`. Set `trueMarket = max(marketPrice, lowPrice)`. Shipping advantage is `$0.99` below `$2`, `$0.50` from `$2` to below `$10`, and `$0.25` at `$10+`. Price is the lower of `trueMarket` and `lowPrice + estimatedShipping - advantage`, then apply the floor. |
| `undercutLow` | `max(lowPrice - $0.01, $0.50)`. |
| `marketAwareLow` | If low is more than `$0.50` below market, target market; otherwise target low. Undercut target by `$0.01`, then apply floor. |
| `marketGuardedShippedLow` | Compare our price plus `$0.99` shipping with TCG Low Price With Shipping and undercut that delivered total by `$0.01`. Never go below TCG Low or `$0.50`, and limit the discount below Market to the smaller of 5% or `$0.50`. If Market, Low, or Low With Shipping is unavailable, preserve the original price. |

`calculateTCGPrice(item)` remains a compatibility wrapper for the default strategy. `needsPricingReview(item)` is true when market is at least `$0.50` and low is absent/zero; the UI prioritizes those rows. The Review column shows a warning icon when TCG Low is missing, the current listing price is below the Market guardrail (more than 5% or `$0.50`, whichever is smaller, under Market), or a Manual Review item is priced above Market. Normal strategy discounts within the guardrail are not review warnings.

The **Manual Review** inventory tab contains named exclusions and cards above the `$30` expensive-card threshold whose current listing price is above Market. Both inventory tabs have per-row and bulk actions to set prices to Market, TCG Low, or TCG Low Price With Shipping minus `$0.01`. Each tab's toolbar applies a price action to every row currently in that view; its delete action removes those rows after confirmation. Rows priced manually at or below Market leave the expensive-card review tab after the next display update; named exclusions stay there.

## Validation and tests

- Unit rules: `test/pricing.test.js` and `test/simple-pricing.test.js`.
- Workflow: `test/pricing-integration.test.js`.
- CSV input/output validation: `npm run validate:pricing-output`; defaults to newest matching files under `tmp/` and `marketAwareLow`. See `scripts/validate-pricing-output.js --help` for overrides.

Update `test/pricing.test.js` when changing a calculation rule; update the integration/validator only if the data contract changes.
