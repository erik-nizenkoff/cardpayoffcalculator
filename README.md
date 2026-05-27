# cardpayoffcalculator.com

A single-page credit card debt payoff calculator.

## Specification

Product decisions and requested features are maintained in [SPEC.md](SPEC.md). Update it when new feature requests or UX decisions come from the project channel.

## What it does

- How long until your credit card debt is paid off?
- How much total interest will you pay?
- What payment do you need to be debt-free by a target date?
- Avalanche, snowball, fixed payment, and custom payoff methods
- Extra payment impact calculator

## Stack

Static HTML + CSS + vanilla JS. Core calculations run client-side. No accounts or backend dependency for calculations; current usage/data disclosure is maintained in the page footer and product spec.

Privacy details live in [privacy.html](privacy.html).

## Development

Open `index.html` in a browser — no build step required.

Run `npm test` to execute the calculator regression suite and the mobile Playwright smoke test. The browser test uses the local Chrome channel by default; set `PLAYWRIGHT_CHANNEL` if you want Playwright to use a different installed browser channel.

## Status

🚧 In development
