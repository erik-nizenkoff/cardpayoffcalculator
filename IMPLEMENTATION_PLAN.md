# CardPayoffCalculator.com Implementation Plan

## Reference Findings

PlainFigure's debt payoff calculator is implemented as a static page at:

- `/home/ubuntu/.openclaw/workspace-entrepreneur/projects/plain-figure/public/debt-payoff.html`
- `credit-card-payoff.html` redirects to `/debt-payoff`

The useful behavior to carry forward is:

- month-by-month payoff simulation
- interest accrues monthly from APR / 12 before payments are applied
- required payments are paid first, then extra payoff budget is aimed by method
- avalanche ranks by highest APR, snowball ranks by smallest balance, custom uses user order
- estimates stop at 600 months and warn when a payoff plan does not clear the debt
- minimum-payment traps are called out when minimums barely cover interest
- results include payoff month, duration, total interest, schedule, and share/export helpers

PlainFigure also includes balance transfer and consolidation flows. Those are intentionally out of scope for the first Card Payoff version.

## First Version Scope

Build a single static page that answers:

- How long until my credit card debt is paid off?
- How much interest will I pay?
- What payment do I need to be debt-free by a target date?
- Which method should I use: avalanche, snowball, fixed payment, or custom order?
- What happens if I add an extra monthly payment?

## Implementation Shape

- Static HTML/CSS/JS, no backend.
- Live payoff math and browser UI are in `index.html`.
- Node tests execute the inline calculator engine through `tests/live-calculator.test.js`.
- No analytics, forms, payments, accounts, cookies, or data collection.
- Share/export is local only: copy a text summary and download CSV in the browser.

## Next Product Steps

1. Add Playwright screenshot/accessibility smoke checks once the visual direction settles.
2. Improve custom-order controls with drag-and-drop if needed.
3. Add optional URL state only after deciding whether share links should include balances.
4. Prepare Vercel/GitHub deploy only after Erik approves public publishing.
