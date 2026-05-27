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

Run `npm test` to execute the calculator regression suite, Playwright browser smoke tests, telemetry guards, and automated accessibility checks. The browser tests use the local Chrome channel by default; CI uses Playwright's installed Chromium. Set `PLAYWRIGHT_CHANNEL` if you want Playwright to use a different installed browser channel.

Run `npm run test:public` after deployment to smoke-test the public homepage, privacy page, robots file, sitemap, and favicon on both `cardpayoffcalculator.com` and `cardpayoffcalculator.vercel.app`. Set `PUBLIC_BASE_URL` or comma-separated `PUBLIC_BASE_URLS` to verify another deployment URL.

## Status

Production deployment is ready for public use, with ongoing regression coverage in CI.
