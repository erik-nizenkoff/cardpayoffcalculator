const assert = require("node:assert/strict");
const {
  analyzeWarnings,
  monthsUntilTarget,
  requiredPaymentForTarget,
  simulatePayoff,
  sumMinimums
} = require("../src/payoff.js");

function assertApprox(actual, expected, tolerance, message) {
  assert(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

const sampleDebts = [
  { id: "visa", name: "Visa", balance: 8500, apr: 22.99, minimum: 170 },
  { id: "mc", name: "Mastercard", balance: 3200, apr: 19.99, minimum: 64 },
  { id: "store", name: "Store card", balance: 1200, apr: 28.99, minimum: 45 }
];

const minimums = sumMinimums(sampleDebts);
assertApprox(minimums, 279, 0.01, "minimums are summed");

const avalanche = simulatePayoff(sampleDebts, { method: "avalanche", extraPayment: 250 });
const snowball = simulatePayoff(sampleDebts, { method: "snowball", extraPayment: 250 });
const fixed = simulatePayoff(sampleDebts, { method: "fixed", extraPayment: 250 });

assert.equal(avalanche.capped, false, "avalanche pays off within cap");
assert.equal(snowball.capped, false, "snowball pays off within cap");
assert(avalanche.months > 0, "avalanche has a payoff duration");
assert(avalanche.totalInterest <= snowball.totalInterest, "avalanche does not cost more interest than snowball for sample");
assert(fixed.totalInterest > 0, "fixed payment strategy returns interest");
assert.equal(avalanche.timeline[0].target, "Store card", "avalanche targets highest APR first");
assert.equal(snowball.timeline[0].target, "Store card", "snowball targets smallest balance first");

const custom = simulatePayoff(sampleDebts, {
  method: "custom",
  extraPayment: 250,
  customOrder: ["mc", "visa", "store"]
});
assert.equal(custom.timeline[0].target, "Mastercard", "custom order controls first target");

const targetMonths = monthsUntilTarget("2026-05", "2028-05");
assert.equal(targetMonths, 25, "target month includes the current month");

const required = requiredPaymentForTarget(sampleDebts, {
  method: "avalanche",
  targetMonths: 30
});
assert(required, "target payment is returned");
assert(required.monthlyPayment > minimums, "target payment exceeds minimums");
assert(required.months <= 30, "target payment finishes by requested month");

const trapWarnings = analyzeWarnings([
  { name: "High APR", balance: 5000, apr: 29.99, minimum: 75 }
], simulatePayoff([{ name: "High APR", balance: 5000, apr: 29.99, minimum: 75 }]));
assert(trapWarnings.some((warning) => warning.includes("barely covers")), "minimum trap warning is generated");

console.log("payoff math tests passed");
