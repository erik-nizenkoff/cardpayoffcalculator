const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElementStub() {
  return {
    value: "",
    innerHTML: "",
    textContent: "",
    dataset: {},
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getContext() { return null; },
    focus() {},
    closest() { return null; }
  };
}

function loadLiveMath() {
  const mainScript = fs.readFileSync("src/app.js", "utf8");
  const elementCache = new Map();
  const document = {
    body: createElementStub(),
    head: createElementStub(),
    activeElement: null,
    createElement: createElementStub,
    getElementById(id) {
      if (!elementCache.has(id)) elementCache.set(id, createElementStub());
      return elementCache.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    execCommand() { return true; }
  };
  const window = {
    CP_TEST_MODE: true,
    CP_TELEMETRY_DISABLED: true,
    CP_TELEMETRY_KEY: "cpoc_telemetry_opt_out",
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); },
    location: { href: "https://example.test/" },
    history: { replaceState() {} },
    URL,
    navigator: { doNotTrack: "1" }
  };
  const context = {
    window,
    document,
    navigator: window.navigator,
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    },
    console,
    setTimeout(callback) { callback(); },
    clearTimeout() {},
    URL,
    fetch() { return Promise.resolve({ ok: true }); }
  };
  vm.runInNewContext(mainScript, context, { filename: "index.html" });
  return context.window.CardPayoffLiveMath;
}

const live = loadLiveMath();

const budgetResult = live.simulate([
  { id: "card-a", name: "Card A", balance: 10000, apr: 20, minimum: 25 }
], { method: "avalanche", monthlyBudget: 500 });

assert.equal(budgetResult.capped, false, "monthly budget scenario pays off");
budgetResult.timeline.slice(0, -1).forEach((row) => {
  assert.equal(row.payment, 500, "non-final months use the full entered monthly budget");
});
assert(budgetResult.timeline.at(-1).payment <= 500, "final month may be less than the budget");

const snowballOffer = live.simulateWithPaymentPlan([
  { id: "small", name: "Small Low APR", balance: 1000, apr: 5, minimum: 25 },
  { id: "large", name: "Large High APR", balance: 2000, apr: 20, minimum: 25 }
], [], { mode: "total", monthlyBudget: 500 }, "snowball");
assert.equal(snowballOffer.timeline[0].target, "Small Low APR", "offer simulations honor selected snowball order");

const fixedExtraOffer = live.simulateWithPaymentPlan([
  { id: "card-b", name: "Card B", balance: 10000, apr: 25, minimum: 250 }
], [], { mode: "extra", extraPayment: 0 }, "avalanche");
assert(
  fixedExtraOffer.timeline[1].payment < fixedExtraOffer.timeline[0].payment,
  "extra-payment offer simulations keep fixed extra behavior instead of a fixed total budget"
);

const extraTargetSchedule = live.simulate([
  { id: "extra-target", name: "Extra Target", balance: 1000, apr: 12, minimum: 50 }
], { method: "avalanche", extraPayment: 200 });
assert.equal(extraTargetSchedule.timeline[0].payments[0], 250, "schedule timeline includes total target payment");
assert.equal(extraTargetSchedule.timeline[0].extraPayments[0], 200, "schedule timeline includes extra payment applied to target");

const overBudgetOffer = live.simulateWithPaymentPlan([], [
  { id: "loan-b", name: "Short loan", balance: 10000, rate: 20, payment: live.loanPaymentForTerm(10000, 20, 12), term: 12 }
], { mode: "total", monthlyBudget: 266.67 }, "avalanche");
assert.equal(overBudgetOffer.monthlyPayment, live.maxTimelinePayment(overBudgetOffer), "offer simulations display actual required payments above the entered budget");

const promoSpike = live.simulate([
  { id: "promo", name: "Promo Card", balance: 10000, apr: 79.99, minimum: 25, introApr: 0, introMonths: 1 }
], { method: "avalanche", monthlyBudget: 150 });
assert(promoSpike.timeline[1].payment > 700, "promo expiry can force future minimums above the entered budget");
assert.equal(promoSpike.monthlyPayment, live.maxTimelinePayment(promoSpike), "total-budget results report the actual max monthly payment when minimums spike");

const requiredPromoPayment = live.requiredPaymentForTarget([
  { id: "promo", name: "Promo Card", balance: 10000, apr: 79.99, minimum: 25, introApr: 0, introMonths: 1 }
], [], "avalanche", 90);
assert(requiredPromoPayment.monthlyPayment > requiredPromoPayment.plannedMonthlyPayment, "target-month payment reports future minimum spikes above the searched budget");
assert.equal(requiredPromoPayment.monthlyPayment, requiredPromoPayment.maxMonthlyPayment, "target-month required payment exposes actual max payment");

const mappedOrder = live.buildOfferCustomOrder(
  ["priority-card", "loan-1", "other-card"],
  [{ id: "other-card" }],
  ["option-consolidation-loan-1"],
  ["priority-card"]
);
assert.equal(
  JSON.stringify(mappedOrder.slice(0, 3)),
  JSON.stringify(["option-consolidation-loan-1", "loan-1", "other-card"]),
  "offer-created debts are mapped near the custom-order card they replaced"
);

const refinanceMethodCards = [
  { id: "small-low", name: "Small Low", balance: 1000, apr: 5, minimum: 25 },
  { id: "large-high", name: "Large High", balance: 5000, apr: 25, minimum: 100 },
  { id: "mid", name: "Middle", balance: 3000, apr: 12, minimum: 75 }
];
assert.equal(
  JSON.stringify(live.refinanceCardsByAmount(refinanceMethodCards, 1000, "avalanche").appliedCardIds),
  JSON.stringify(["large-high"]),
  "offer model refinances avalanche's highest-APR card first"
);
assert.equal(
  JSON.stringify(live.refinanceCardsByAmount(refinanceMethodCards, 1000, "snowball").appliedCardIds),
  JSON.stringify(["small-low"]),
  "offer model refinances snowball's smallest card first"
);
assert.equal(
  JSON.stringify(live.refinanceCardsByAmount(refinanceMethodCards, 1000, "custom", ["mid", "small-low", "large-high"]).appliedCardIds),
  JSON.stringify(["mid"]),
  "offer model refinances the first custom-order card first"
);
const partialRefinance = live.refinanceCardsByAmount([
  { id: "card-one", name: "Card One", balance: 3000, apr: 20, minimum: 75 },
  { id: "card-two", name: "Card Two", balance: 2000, apr: 10, minimum: 50 }
], 3500, "avalanche");
assert.equal(
  JSON.stringify(partialRefinance.coverage.map((debt) => [debt.name, debt.appliedAmount, debt.remainingBalance])),
  JSON.stringify([["Card One", 3000, 0], ["Card Two", 500, 1500]]),
  "offer model records which debts are covered and remaining balances"
);

const negativeLoan = live.simulate([], { method: "avalanche", extraPayment: 0 }, [
  { id: "loan-a", name: "Underpaid loan", balance: 10000, rate: 30, payment: 100 }
]);
assert(
  negativeLoan.warnings.some((warning) => warning.includes("fixed payment is less than or equal to the first month's interest")),
  "negative-amortizing loans receive a specific warning"
);

const underInterestCard = live.simulate([
  { id: "low-min", name: "Low Minimum Card", balance: 10000, apr: 36, minimum: 100 }
], { method: "avalanche", extraPayment: 0 });
assert(
  underInterestCard.warnings.some((warning) => warning.includes("uses an estimated first-month minimum")),
  "card warnings explain when entered minimums are below first-month interest"
);

const shortPromoTransferRate = live.optionSortRate("balance-transfer", {
  introApr: 0,
  introMonths: 1,
  postApr: 29.99,
  feeRate: 3
}, 36);
const consolidationRate = live.optionSortRate("consolidation-loan", {
  apr: 8,
  feeRate: 0
}, 36);
assert(shortPromoTransferRate > consolidationRate, "short 0% promos do not outrank better long-term loan rates");

const shortPromoCost = live.optionModeledCostScore({
  type: "balance-transfer",
  introApr: 0,
  introMonths: 1,
  postApr: 29.99,
  feeRate: 3
}, 36);
const loanCost = live.optionModeledCostScore({
  type: "consolidation-loan",
  apr: 8,
  term: 36,
  feeRate: 0
}, 36);
const fullPromoCost = live.optionModeledCostScore({
  type: "balance-transfer",
  introApr: 0,
  introMonths: 36,
  postApr: 29.99,
  feeRate: 3
}, 36);
assert(shortPromoCost > loanCost, "modeled offer ordering accounts for post-promo cost");
assert(fullPromoCost < loanCost, "modeled offer ordering can still prefer a promo that lasts through payoff");

const actualPaymentCards = [
  { id: "card-expensive", name: "Card", balance: 10000, apr: 24, minimum: 200 }
];
const actualPaymentPlan = { mode: "total", monthlyBudget: 350 };
const shortPromoOffer = {
  type: "balance-transfer",
  name: "Short promo",
  amount: 10000,
  introApr: 0,
  introMonths: 3,
  postApr: 12,
  feeRate: 0,
  sortRate: 0,
  modeledCostScore: 0
};
const lowRateLongLoan = {
  type: "consolidation-loan",
  name: "Low-rate loan",
  amount: 10000,
  apr: 4,
  term: 120,
  feeRate: 0,
  sortRate: 0,
  modeledCostScore: 0
};
const actualShortPromoCost = live.optionActualCostScore(shortPromoOffer, actualPaymentCards, [], actualPaymentPlan, "avalanche", []);
const actualLoanCost = live.optionActualCostScore(lowRateLongLoan, actualPaymentCards, [], actualPaymentPlan, "avalanche", []);
assert(actualShortPromoCost > actualLoanCost, "actual offer scoring uses the user's payment plan, not only generic offer terms");
const scoredScenario = live.scorePayoffScenarioEntries({
  entries: [Object.assign({}, shortPromoOffer), Object.assign({}, lowRateLongLoan)]
}, actualPaymentCards, [], actualPaymentPlan, "avalanche", []);
assert.equal(scoredScenario.entries[0].name, "Low-rate loan", "offer allocation applies the lower actual-cost offer first");

const currentActualPaymentResult = live.simulateWithPaymentPlan(actualPaymentCards, [], actualPaymentPlan, "avalanche", []);
const smallLowRateLoan = {
  type: "consolidation-loan",
  name: "Small low-rate loan",
  amount: 1000,
  apr: 4,
  term: 120,
  feeRate: 0,
  sortRate: 0,
  modeledCostScore: 0
};
const largeOkayTransfer = {
  type: "balance-transfer",
  name: "Large okay transfer",
  amount: 10000,
  introApr: 12,
  introMonths: 120,
  postApr: 12,
  feeRate: 0,
  sortRate: 0,
  modeledCostScore: 0
};
const mixedCapacityScenario = live.scorePayoffScenarioEntries({
  entries: [Object.assign({}, largeOkayTransfer), Object.assign({}, smallLowRateLoan)]
}, actualPaymentCards, [], actualPaymentPlan, "avalanche", [], currentActualPaymentResult);
assert.equal(mixedCapacityScenario.entries[0].name, "Small low-rate loan", "mixed-capacity offer allocation uses modeled savings per dollar");
assert(mixedCapacityScenario.entries[0].modeledSavingsPerDollar > mixedCapacityScenario.entries[1].modeledSavingsPerDollar, "smaller better offer has higher modeled savings per dollar");

const permutationLoanA = {
  type: "consolidation-loan",
  name: "L0",
  amount: 4192.71,
  apr: 12.6,
  term: 130,
  feeRate: 0.25,
  sortRate: 0,
  modeledCostScore: 0
};
const permutationLoanB = {
  type: "consolidation-loan",
  name: "L1",
  amount: 8247.63,
  apr: 13.79,
  term: 14,
  feeRate: 3.2,
  sortRate: 0,
  modeledCostScore: 0
};
const permutationScenarioBase = {
  type: "combined-new-credit",
  name: "Combined offers",
  amount: 10000,
  totalAvailable: 12440.34,
  extraAvailable: 2440.34
};
const l0FirstModel = live.buildPayoffScenarioModel(Object.assign({ entries: [Object.assign({}, permutationLoanA), Object.assign({}, permutationLoanB)] }, permutationScenarioBase), actualPaymentCards, [], actualPaymentPlan, "avalanche", [], 0);
const l1FirstModel = live.buildPayoffScenarioModel(Object.assign({ entries: [Object.assign({}, permutationLoanB), Object.assign({}, permutationLoanA)] }, permutationScenarioBase), actualPaymentCards, [], actualPaymentPlan, "avalanche", [], 0);
assert(l1FirstModel.totalCost < l0FirstModel.totalCost, "test fixture has a cheaper reversed combined offer order");
const optimizedPermutation = live.optimizePayoffScenarioOrder(Object.assign({
  entries: [Object.assign({}, permutationLoanA), Object.assign({}, permutationLoanB)]
}, permutationScenarioBase), actualPaymentCards, [], actualPaymentPlan, "avalanche", [], 0, currentActualPaymentResult);
assert.equal(optimizedPermutation.entries[0].name, "L1", "combined offer allocation chooses the lowest modeled-cost permutation");
assert.equal(optimizedPermutation.bestModel.totalCost, l1FirstModel.totalCost, "optimized combined offer model matches the cheapest tested order");
const appliedDebtNames = optimizedPermutation.bestModel.allocation[0].appliedDebts.map((debt) => debt.name);
assert(appliedDebtNames.includes("Card"), "optimized offer allocation records source debts per offer");

assert.equal(
  live.optionDifferenceText({
    currentCapped: true,
    result: { capped: false },
    currentCost: 1000,
    totalCost: 500
  }),
  "Not comparable: one plan does not pay off within 50 years.",
  "capped current plans do not show precise payoff-option cost differences"
);

assert.equal(
  live.decisionDeltaText(
    { method: "avalanche", capped: false, totalInterest: 1653.33 },
    { method: "minimum", capped: true, totalInterest: 16310000000 },
    16310000000
  ),
  "Not comparable: one plan does not pay off within 50 years.",
  "method comparison avoids precise savings against capped plans"
);

assert.equal(
  live.comparisonInterestText({ capped: true, totalInterest: 16310000000 }),
  "Still accruing after 50 years",
  "capped comparison rows do not show partial 50-year interest as payoff interest"
);

const cappedPrimaryResult = live.simulate([], { method: "minimum", extraPayment: 0 }, [
  { id: "bad-loan", name: "Bad Loan", balance: 10000, rate: 30, payment: 100 }
]);
assert.equal(cappedPrimaryResult.capped, true, "fixture reaches the 50-year model cap");
assert.equal(live.resultInterestLabel(cappedPrimaryResult), "Interest During 50-Year Model", "capped primary result relabels interest");
assert(live.resultInterestText(cappedPrimaryResult).includes("still accruing"), "capped primary result does not present interest as final payoff interest");
assert.equal(live.resultPaidLabel(cappedPrimaryResult), "Paid During 50-Year Model", "capped primary result relabels paid total");
assert(live.resultPaidText(cappedPrimaryResult).includes("paid before limit"), "capped primary result does not present paid amount as final payoff total");
const cappedSummary = live.buildResultsSummary(cappedPrimaryResult);
assert(cappedSummary.includes("Interest during 50-year model"), "copied summary labels capped interest as model-window interest");
assert(!cappedSummary.includes("Total interest:"), "copied summary does not call capped model-window interest total payoff interest");
const cappedOptionRow = {
  result: cappedPrimaryResult,
  totalCost: cappedPrimaryResult.totalInterest + 255
};
assert.equal(live.optionCostLabel(cappedOptionRow), "Interest + fees during 50-year model", "capped option cards relabel model-window cost");
assert(live.optionCostText(cappedOptionRow).includes("still accruing"), "capped option cards do not present model-window cost as final payoff cost");
const stillCappedWithExtra = live.simulate([], { method: "avalanche", extraPayment: 10 }, [
  { id: "bad-loan", name: "Bad Loan", balance: 10000, rate: 30, payment: 100 }
]);
assert.equal(stillCappedWithExtra.capped, true, "small extra payment fixture remains capped");
const cappedSavingsMessage = live.savingsMessage(stillCappedWithExtra, cappedPrimaryResult, 10);
assert(cappedSavingsMessage.includes("still does not fully pay off"), "savings message does not claim a capped selected plan creates a payoff path");
assert(!cappedSavingsMessage.includes("creates a payoff path"), "savings message avoids false payoff-path language when selected plan is capped");
const cappedMethodLoans = [
  { id: "high", name: "High APR Loan", balance: 10000, rate: 30, payment: 100 },
  { id: "low", name: "Low APR Loan", balance: 1000, rate: 5, payment: 25 }
];
const cappedAvalanche = live.simulate([], { method: "avalanche", extraPayment: 10 }, cappedMethodLoans);
const cappedSnowball = live.simulate([], { method: "snowball", extraPayment: 10 }, cappedMethodLoans);
assert.equal(cappedAvalanche.capped, true, "capped recommendation fixture avalanche remains capped");
assert.equal(cappedSnowball.capped, true, "capped recommendation fixture snowball remains capped");
assert(cappedSnowball.totalInterest - cappedAvalanche.totalInterest > 100, "capped recommendation fixture has materially different modeled interest");
const cappedRecommendation = live.methodRecommendationMessage(cappedAvalanche, cappedSnowball);
assert(cappedRecommendation.includes("Both plans remain unpaid after 50 years"), "capped recommendation acknowledges both plans remain unpaid");
assert(cappedRecommendation.includes("Avalanche has"), "capped recommendation identifies the lower-interest capped method");
assert(!cappedRecommendation.includes("nearly equal"), "capped recommendation does not call materially different capped methods nearly equal");

assert(
  live.loanTermWarning({ name: "Short loan", balance: 10000, rate: 10, payment: 100, term: 12 }).includes("Estimated payment needed"),
  "installment loan term validates the payment needed to satisfy the entered term"
);

const html = fs.readFileSync("index.html", "utf8");
const appSource = fs.readFileSync("src/app.js", "utf8");
const middlewareSource = fs.readFileSync("middleware.js", "utf8");
const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
assert.equal(live.maxPayoffOptions, 8, "payoff offers are capped at eight for exhaustive ordering");
assert.equal(live.optionCapacityValue("20000", 12900), 20000, "entered offer capacity can exceed eligible card debt");
assert.equal(live.optionCapacityValue("", 12900), 12900, "empty offer capacity still defaults to eligible card debt");
assert(!appSource.includes("slice(0, 30)"), "shared payoff options no longer allow thirty offer scenarios");
assert(appSource.includes("MAX_PAYOFF_OPTIONS"), "payoff option limits use one shared constant");
assert(!appSource.includes('optionNumberValue(getOptionField(scenario, "amount"), cardTotal, 0, cardTotal)'), "offer capacity is not clamped before unused capacity is calculated");
assert(html.includes("Installment loans use the fixed payment you entered"), "methodology distinguishes installment loan payments from card minimums");
assert(html.includes("unused capacity is reported but not modeled as new borrowing"), "methodology explains excess offer capacity correctly");
assert(!html.includes("does not include new charges, fees"), "methodology does not say all fees are excluded when offer fees are modeled");
assert(html.includes("Compare new payoff options"), "offer modeling uses user-centered section language");
assert(appSource.includes("Share links include debt names/nicknames, balances, APRs, payments, and settings."), "share link helper explains shared names and inputs are included");
assert(appSource.includes('url.hash = "q=" + encodeSharedState(state)'), "new share links keep calculator state out of crawlable query strings");
assert(appSource.includes("sharedStateFromUrl"), "shared-state loading supports hash links and legacy query links");
assert(middlewareSource.includes('url.hash = "q=" + sharedState'), "legacy q links are redirected to hash state at the edge");
assert(middlewareSource.includes("Response.redirect(url, 308)"), "legacy q cleanup uses a permanent edge redirect");
assert(!html.includes("share-privacy-note"), "share helper is not duplicated in a second static note");
assert(html.includes('<title>Credit Card Payoff Calculator - Debt Avalanche &amp; Snowball</title>'), "SEO title stays concise");
assert(html.includes('"@type": "WebApplication"'), "structured data describes the calculator app");
assert(html.includes('<meta property="og:image" content="https://cardpayoffcalculator.com/social-preview.png">'), "social previews include a branded PNG image");
assert(html.includes('<meta property="og:image:type" content="image/png">'), "social image metadata declares PNG type");
assert(html.includes('<meta name="twitter:card" content="summary_large_image">'), "Twitter card uses the large image format");
assert(!sitemap.includes("privacy.html"), "privacy page is not included in the SEO sitemap");
assert(!JSON.stringify(vercelConfig.redirects).includes('"type":"query"'), "vercel redirects do not intercept legacy q share URLs");
assert(
  vercelConfig.redirects.some((redirect) => redirect.permanent === true && redirect.has && redirect.has.some((condition) => condition.type === "host" && condition.value === "www.cardpayoffcalculator.com")),
  "www host canonicalization uses a permanent Vercel redirect"
);
assert(html.includes("comparison-section td::before"), "method comparison can collapse into labeled mobile rows");
assert(html.includes("repeat(auto-fit"), "single payoff offer cards fill available space without an empty grid column");
assert(html.includes("offer-allocation-table"), "offer allocation table has dedicated column sizing");
assert(html.includes("applied-debt-list"), "applied debts render as stacked lines instead of a cramped comma list");
assert.equal(
  live.sharedCard({ id: "card-nick", name: "  Travel   Rewards  ", balance: 1200, apr: 19.99, minimum: 35 }, 0).name,
  "Travel Rewards",
  "share links preserve sanitized card nicknames"
);
assert.equal(
  live.sharedLoan({ id: "loan-nick", name: "  Auto   Loan  ", balance: 12000, rate: 6.5, payment: 300, term: 48 }, 0).name,
  "Auto Loan",
  "share links preserve sanitized loan names"
);
assert.equal(
  live.cleanSharedName("x".repeat(75)).length,
  60,
  "shared card nicknames are capped to keep links compact"
);
assert(!appSource.includes("lastResult.timeline.slice(0, Math.min(lastResult.timeline.length, 240))"), "print schedule is not capped at 240 rows");
assert(appSource.includes("Math.max(result.startingBalance, timeline.reduce"), "chart scale considers balances above the starting balance");
assert(appSource.includes("ctx.moveTo(xPos(0), yPos(result.startingBalance))"), "chart total-balance line starts at starting balance");
assert(!appSource.includes("firstPayoff.payoffMonth)"), "chart takeaway does not use 1-based payoff month as a zero-based offset");
assert(!appSource.includes('simulate(cards, { method: "avalanche", extraPayment: extraPayment }'), "result explainer does not recompute total-budget plans with fixed extra");
assert.equal(live.chartAxisMonthLabel(0, "2026-05"), "May 2026", "chart point 0 labels the starting month");
assert.equal(live.chartAxisMonthLabel(1, "2026-05"), "May 2026", "chart point 1 matches month-one schedule date");
assert.equal(live.chartAxisMonthLabel(2, "2026-05"), "Jun 2026", "chart point 2 advances one month after month-one");

const firstMonthPayoff = live.simulate([
  { id: "tiny", name: "Tiny Card", balance: 100, apr: 0, minimum: 100 }
], { method: "avalanche", monthlyBudget: 100 });
assert(
  live.chartTakeawayText(firstMonthPayoff, "2026-05").includes("Tiny Card is first paid off around May 2026"),
  "chart takeaway reports first-month payoff in the start month"
);

console.log("live calculator tests passed");
