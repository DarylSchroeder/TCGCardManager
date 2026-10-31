# Development quick reference

## Coding practices

- Keep the existing implementation simple: vanilla browser JavaScript, HTML, CSS, and CommonJS-compatible Node modules.
- `index.html` is the current source for UI and most application behavior; avoid introducing a second implementation of existing behavior.
- Keep business pricing logic in `js/pricing.js` and call it from consumers.
- Preserve CSV column names and ordering documented in [architecture-and-data.md](architecture-and-data.md); import/export compatibility is a user-facing contract.
- Follow nearby style and naming. Validate values at boundaries, preserve existing user-visible error handling, and use safe DOM APIs when rendering untrusted card/CSV text.
- Update focused docs when changing durable behavior, especially pricing rules, storage keys, object fields, and CSV headers.

## Commands

| Task | Command |
| --- | --- |
| Start app | `./run.sh` or `npm start`; open `http://localhost:3000` |
| Run official suite | `npm test` |
| Same suite directly | `./test/run-tests.sh` |
| Validate CSV pricing output | `npm run validate:pricing-output` |
| Run pricing unit file | `node test/pricing.test.js` |
| Run CSV tests | `node test/csv.test.js` |

The validator reads newest `tmp/TCGplayer__MyPricing_*.csv` and `tmp/updated_inventory_*.csv` by default. Pass `--input`, `--output`, `--strategy`, or `--tmp` to override. It defaults to `marketAwareLow` (distinct from the app's `shippingAdjusted` default).

## Main files

- `index.html` — UI, Scryfall interaction, inventory, CSV, storage, orchestration.
- `js/pricing.js` — strategy rules and pricing helpers.
- `js/imageCache.js` — image cache data/support.
- `server.js`, `run.sh` — local static server and startup.
- `test/` — focused and integration tests; `test/data/sample_inventory.csv` is representative input.
- `scripts/validate-pricing-output.js` — checks output rows/prices against source CSV and shared pricing logic.

## Repository hygiene

Generated/user data may be under `tmp/` when present; do not treat sample or timestamped CSVs as source code. Check `git status` before and after edits. Root `README.md` is the user-facing introduction; this docs directory is the concise engineering reference. `ROADMAP.md` contains dated planning notes, so confirm status in code before using it as current guidance.
