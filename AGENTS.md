# Repository guide

Project root: `/root/code/tcg_card_manager`.

Read only the reference needed for the task:

- [docs/architecture-and-data.md](docs/architecture-and-data.md) — runtime, file ownership, inventory fields, CSV columns, persistence.
- [docs/pricing.md](docs/pricing.md) — current pricing strategies, guardrails, exclusions, and implementation pointers.
- [docs/card-add-troubleshooting.md](docs/card-add-troubleshooting.md) — diagnosing below-market add prices, missing catalog SKUs, and stale helper scripts.
- [docs/development.md](docs/development.md) — coding practices, commands, and test locations.

## Source of truth

- The working UI and most application behavior are in `index.html` (inline CSS and JavaScript).
- Pricing calculations and strategy metadata are in `js/pricing.js`; change pricing behavior there.
- HTTP serving is in `server.js`; startup is `run.sh`.
- Tests are in `test/`; CSV pricing validation is in `scripts/validate-pricing-output.js`.
- Card SKU resolution is in `js/catalogMatching.js`; require exact condition/finish matches and keep unresolved SKUs flagged and blocked from export.
- `shippingAdjusted` can intentionally price below Market; its guardrail warns but does not clamp. See [docs/card-add-troubleshooting.md](docs/card-add-troubleshooting.md) before changing pricing behavior.
- Root `README.md` is user-facing orientation. `ROADMAP.md` and `AmazonQ.md` are historical/planning material and may be stale; verify claims against code before relying on them.

Keep this index brief. Put durable reference material in `docs/` and add it here when creating a new reference.
