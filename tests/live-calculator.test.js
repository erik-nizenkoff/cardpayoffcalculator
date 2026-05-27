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
assert(
  live.maxTimelinePayment(overBudgetOffer) > overBudgetOffer.monthlyPayment,
  "offer simulations expose actual required payments above the entered budget"
);

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

const html = fs.readFileSync("index.html", "utf8");
assert(!html.includes("lastResult.timeline.slice(0, Math.min(lastResult.timeline.length, 240))"), "print schedule is not capped at 240 rows");
assert(html.includes("Math.max(result.startingBalance, timeline.reduce"), "chart scale considers balances above the starting balance");
assert(!html.includes('simulate(cards, { method: "avalanche", extraPayment: extraPayment }'), "result explainer does not recompute total-budget plans with fixed extra");

console.log("live calculator tests passed");
