# Card Payoff Calculator Specification

This is the living product specification for cardpayoffcalculator.com. Update this file whenever a feature, UX rule, disclosure decision, monetization constraint, or QA standard is requested in the project channel.

## Product Scope

Card Payoff Calculator is a focused single-page calculator for people trying to understand and compare credit card debt payoff paths. The first priority is one excellent calculator page, not a broad personal finance site.

The calculator should answer:

- How long until my credit card debt is paid off?
- How much interest will I pay?
- What payment do I need to be debt-free by a target date?
- Which payoff method should I use: avalanche, snowball, fixed payment, minimum-only, or custom order?
- What happens if I add an extra monthly payment?
- Could a balance transfer or debt consolidation loan improve the payoff path?

## Current Page Requirements

- Single static HTML/CSS/JS page.
- No accounts, persistence, forms, payments, or backend dependency for core calculations.
- Inputs for credit cards: name, balance, APR, minimum payment, optional intro APR, intro months.
- Inputs for installment loans: name, balance, interest rate, fixed payment, optional remaining term.
- Payoff methods: avalanche, snowball, minimum-only, fixed payment behavior where supported, and custom order.
- Result summary: debt-free date, total interest, total balance, starting minimums, months to payoff, monthly payment, first payoff target, total paid.
- Warnings for minimum-payment traps and 50-year capped payoff paths.
- Target-date payment estimate.
- First-month payment breakdown.
- Payoff method comparison table.
- Payoff schedule with a manageable default view and expandable full view.
- Balance chart and payoff visualization where supported.
- Copy/share-friendly results and printable/PDF-friendly output.

## Payoff Options

After the main results, show a neutral Compare Payoff Options panel.

The panel must always include the current plan as the baseline. Users can add or remove zero or more scenarios:

- Balance transfer scenarios:
  - transfer amount in dollars, prefilled from the active credit card debt and editable
  - transfer fee percent
  - intro APR
  - promo months
  - post-promo APR, defaulting to the current weighted average card APR when blank
- Debt consolidation loan scenarios:
  - loan amount in dollars, prefilled from the active credit card debt and editable
  - loan APR
  - term months
  - origination fee percent

For each scenario, show:

- payoff date
- monthly payment
- interest plus fees
- savings versus the current plan
- watchout text, such as promo expiration before payoff or qualification/fee cautions

Assumptions:

- Balance transfer and consolidation loan scenarios model payoff of credit card balances only.
- If a scenario amount is less than the total credit card balance, the model applies the amount to the highest-APR card balances first and leaves the remaining card balances in the payoff plan.
- If a scenario amount exceeds the total credit card balance, cap it at the current total credit card balance.
- Debt-based default amounts should keep tracking the active credit card balance until the user edits the amount field.
- Existing installment loans remain in the plan.
- Fees are counted in Interest + fees.
- This is neutral modeling first. Do not add affiliate links until there is traffic and the affiliate/disclosure approach is explicitly approved.

Share links must save and restore the payoff option scenario list, including zero scenarios, multiple balance transfer scenarios, and multiple consolidation loan scenarios. A copied link should recreate the same option inputs before recalculating results.

## UX QA Requirements

Recent UX QA fixes should remain part of the product baseline:

- Supabase/data disclosure stays footer-only; results, FAQ copy, and schema should not repeat the full disclosure.
- Mobile users should have an obvious way to open the full payoff plan from the sticky summary.
- The result panel should be grouped into clear sections instead of one dense stack.
- Compare Payoff Options should have a visible shortcut near the top of the results.
- Collapsed mobile card rows should clearly signal that tapping opens editing.
- On mobile, export/share actions should appear after the hero payoff result, not above it.
- Payoff option assumptions should be compact on mobile so results are visible before dense inputs.
- Mobile card summary rows should be keyboard/focus accessible, not only mouse/touch clickable.
- Compare payoff methods should be reachable from the results shortcut area.
- Footer privacy copy should clearly say calculations run in the browser while non-identifying calculation inputs are also sent to Supabase and basic usage events to Plausible for product improvement.
- Results must label calculated minimums as estimated starting minimums and explain that the model uses the greater of entered minimum, $25, or 1% plus interest.
- First-run UX should include an Enter My Cards path that clears sample data, opens the first card row, and focuses editing.
- Clear all should produce a blank editable card state, not reload the sample.
- Target Payoff Date should be visible in the main payoff settings, not hidden in Advanced.
- Mobile collapsed card summaries should include name, balance, APR, and minimum payment.
- Data-heavy tables should remain horizontally scrollable on mobile rather than being squeezed.

## Intro APR UX

Intro APR controls must not be hidden behind a horizontal scrollbar. The intro-rate affordance should be visible near the primary APR field in the normal card-entry flow.

## Data Disclosure And Privacy Placement

Do not repeat the Supabase/data disclosure throughout the page. The current UX decision is footer-only disclosure, kept low-emphasis.

The results area should use concise estimate language only:

- Estimates only - Not financial advice

The footer should contain the data disclosure. If the project later adds accounts, saved plans, email capture, user profiles, payments, or personally identifying data collection, revisit this decision and add a proper privacy page and collection-point notice.

Preferred direction: reduce collection to aggregate/non-identifying metrics where practical rather than adding more prominent repeated disclosure.

## Calculation Data Payload

The Supabase calculation row should include the payoff option scenario inputs so later analysis can understand whether users are modeling balance transfers or debt consolidation loans.

Store payoff options without card or loan names:

- option type: balance transfer or consolidation loan
- amount modeled
- balance transfer fee, intro APR, promo months, and post-promo APR
- consolidation loan APR, term months, and origination fee
- counts for total payoff options, balance transfer options, and consolidation loan options

If the database schema is not updated yet, the app should fail gracefully and keep the legacy calculation insert path working.

## Monetization Direction

Balance transfer cards and debt consolidation loans are a likely affiliate opportunity after traffic is established.

Rules before affiliate links:

- Keep the calculator neutral and math-first.
- Do not steer users into new debt products by default.
- Add clear affiliate disclosure before or near affiliate placements.
- Add warnings for credit checks, transfer limits, post-promo APR, origination fees, qualification uncertainty, and risk of adding new debt.
- Only introduce affiliate links after explicit approval.

## QA Summary Standard

Each implementation summary should include a QA critic 1-10 ranking with:

- score
- short reason
- top improvement needed to raise the score

Example:

QA critic: 9/10. Matches the requested behavior and passes tests; next improvement is saving option scenarios into share links.

## Verification Standards

For code changes, run the smallest meaningful verification set before reporting completion:

- inline JavaScript parse check for index.html changes
- npm test
- targeted browser render check with headless Chrome when UI changes
- live Vercel HTML or DOM check after deploy

For feature changes that affect interaction, verify the interaction directly where practical. Example: add/remove payoff option scenarios and confirm the calculated results update.

## Deployment And Decision Gates

Local prototype work, commits, and pushes are okay.

Ask Erik before:

- buying or registering cardpayoffcalculator.com
- changing DNS
- adding or changing analytics/forms/payments
- adding affiliate links
- collecting new categories of user data
- spending money
- creating external accounts

## Maintenance Process

When a new feature request or product decision is made in the project channel:

1. Update this spec before implementation begins.
2. Keep the request phrased as product behavior, not just implementation detail.
3. Link major implementation decisions back to the relevant spec section in summaries when useful.
4. If the implemented behavior intentionally differs from this spec, update this spec in the same commit.

Exception: for an urgent production breakage or security issue, fix first, then update this spec in the same follow-up commit before reporting completion.
