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
  const html = fs.readFileSync("index.html", "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  const mainScript = scripts[scripts.length - 1];
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

const negativeLoan = live.simulate([], { method: "avalanche", extraPayment: 0 }, [
  { id: "loan-a", name: "Underpaid loan", balance: 10000, rate: 30, payment: 100 }
]);
assert(
  negativeLoan.warnings.some((warning) => warning.includes("fixed payment is less than or equal to the first month's interest")),
  "negative-amortizing loans receive a specific warning"
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

assert(
  live.loanTermWarning({ name: "Short loan", balance: 10000, rate: 10, payment: 100, term: 12 }).includes("Estimated payment needed"),
  "installment loan term validates the payment needed to satisfy the entered term"
);

const html = fs.readFileSync("index.html", "utf8");
assert(!html.includes("lastResult.timeline.slice(0, Math.min(lastResult.timeline.length, 240))"), "print schedule is not capped at 240 rows");
assert(html.includes("Math.max(result.startingBalance, timeline.reduce"), "chart scale considers balances above the starting balance");
assert(html.includes("ctx.moveTo(xPos(0), yPos(result.startingBalance))"), "chart total-balance line starts at starting balance");
assert(!html.includes("firstPayoff.payoffMonth)"), "chart takeaway does not use 1-based payoff month as a zero-based offset");
assert(!html.includes('simulate(cards, { method: "avalanche", extraPayment: extraPayment }'), "result explainer does not recompute total-budget plans with fixed extra");
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
