const CENTS = 100;
const EPSILON = 0.005;
const MAX_MONTHS = 600;

function roundCents(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * CENTS) / CENTS;
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeDebt(debt, index) {
  return {
    id: String(debt.id ?? index + 1),
    name: String(debt.name || `Card ${index + 1}`).trim(),
    balance: roundCents(positiveNumber(debt.balance)),
    startingBalance: roundCents(positiveNumber(debt.balance)),
    apr: Math.max(0, Number(debt.apr || 0)),
    minimum: roundCents(positiveNumber(debt.minimum))
  };
}

function normalizeDebts(debts) {
  return debts.map(normalizeDebt).filter((debt) => debt.balance > EPSILON);
}

function sumMinimums(debts) {
  return roundCents(normalizeDebts(debts).reduce((sum, debt) => sum + debt.minimum, 0));
}

function compareTargets(a, b, method, order) {
  if (method === "snowball") {
    return a.balance - b.balance || b.apr - a.apr || a.name.localeCompare(b.name);
  }

  if (method === "custom") {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);
    const aRank = aIndex === -1 ? 9999 : aIndex;
    const bRank = bIndex === -1 ? 9999 : bIndex;
    return aRank - bRank || b.apr - a.apr || a.balance - b.balance;
  }

  return b.apr - a.apr || b.balance - a.balance || a.name.localeCompare(b.name);
}

function activeDebts(cards) {
  return cards.filter((card) => card.balance > EPSILON);
}

function firstTargetName(cards, method, order) {
  const targets = activeDebts(cards).sort((a, b) => compareTargets(a, b, method, order));
  return targets[0] ? targets[0].name : "";
}

function addMonthlyInterest(cards, totals) {
  return cards.map((card, index) => {
    if (card.balance <= EPSILON) return 0;
    const interest = roundCents(card.balance * (card.apr / 100 / 12));
    card.balance = roundCents(card.balance + interest);
    totals.interest += interest;
    totals.byCard[index].interestPaid = roundCents(totals.byCard[index].interestPaid + interest);
    return interest;
  });
}

function payCard(card, amount) {
  if (card.balance <= EPSILON || amount <= EPSILON) return 0;
  const payment = roundCents(Math.min(card.balance, amount));
  card.balance = roundCents(card.balance - payment);
  return payment;
}

function applyMinimums(cards, monthlyBudget, totals) {
  let remainingBudget = monthlyBudget;
  const payments = cards.map(() => 0);

  cards.forEach((card, index) => {
    if (card.balance <= EPSILON || remainingBudget <= EPSILON) return;
    const payment = payCard(card, Math.min(card.minimum, remainingBudget));
    payments[index] = roundCents(payments[index] + payment);
    remainingBudget = roundCents(remainingBudget - payment);
  });

  totals.paid = roundCents(totals.paid + payments.reduce((sum, payment) => sum + payment, 0));
  return { remainingBudget, payments };
}

function applyTargetedExtra(cards, remainingBudget, payments, method, order) {
  const targets = [];

  while (remainingBudget > EPSILON && activeDebts(cards).length) {
    const target = activeDebts(cards).sort((a, b) => compareTargets(a, b, method, order))[0];
    const payment = payCard(target, remainingBudget);
    const index = cards.indexOf(target);
    payments[index] = roundCents(payments[index] + payment);
    remainingBudget = roundCents(remainingBudget - payment);
    if (payment > EPSILON && targets[targets.length - 1] !== target.name) targets.push(target.name);
  }

  return targets;
}

function applyFixedExtra(cards, remainingBudget, payments) {
  const targets = [];

  while (remainingBudget > EPSILON && activeDebts(cards).length) {
    const openCards = activeDebts(cards);
    const share = Math.max(EPSILON, remainingBudget / openCards.length);
    let paidThisRound = 0;

    openCards.forEach((card) => {
      if (remainingBudget <= EPSILON) return;
      const payment = payCard(card, Math.min(share, remainingBudget));
      const index = cards.indexOf(card);
      payments[index] = roundCents(payments[index] + payment);
      remainingBudget = roundCents(remainingBudget - payment);
      paidThisRound = roundCents(paidThisRound + payment);
      if (payment > EPSILON && !targets.includes(card.name)) targets.push(card.name);
    });

    if (paidThisRound <= EPSILON) break;
  }

  return targets;
}

function markPayoffs(cards, summaries, monthIndex, payoffCounter) {
  let order = payoffCounter;

  cards.forEach((card, index) => {
    if (card.balance <= EPSILON && summaries[index].payoffMonth === null) {
      order += 1;
      summaries[index].payoffMonth = monthIndex;
      summaries[index].orderPaidOff = order;
    }
  });

  return order;
}

function simulatePayoff(inputDebts, options = {}) {
  const method = ["avalanche", "snowball", "fixed", "custom"].includes(options.method) ? options.method : "avalanche";
  const customOrder = Array.isArray(options.customOrder) ? options.customOrder.map(String) : [];
  const cards = normalizeDebts(inputDebts);
  const minimumTotal = sumMinimums(cards);
  const extraPayment = roundCents(Math.max(0, Number(options.extraPayment || 0)));
  const monthlyBudget = roundCents(Math.max(minimumTotal, Number(options.monthlyPayment || 0) || minimumTotal + extraPayment));

  const totals = {
    interest: 0,
    paid: 0,
    byCard: cards.map((card) => ({
      id: card.id,
      name: card.name,
      startingBalance: card.startingBalance,
      payoffMonth: null,
      orderPaidOff: null,
      interestPaid: 0
    }))
  };

  const timeline = [];
  let payoffCounter = 0;

  for (let monthIndex = 0; monthIndex < MAX_MONTHS; monthIndex += 1) {
    if (!activeDebts(cards).length) break;

    const interestByCard = addMonthlyInterest(cards, totals);
    const { remainingBudget, payments } = applyMinimums(cards, monthlyBudget, totals);
    const targets = method === "fixed"
      ? applyFixedExtra(cards, remainingBudget, payments)
      : applyTargetedExtra(cards, remainingBudget, payments, method, customOrder);

    const monthPaid = roundCents(payments.reduce((sum, payment) => sum + payment, 0));
    totals.paid = roundCents(totals.paid + monthPaid - payments.reduce((sum, payment) => sum + Math.min(payment, 0), 0));
    payoffCounter = markPayoffs(cards, totals.byCard, monthIndex, payoffCounter);

    timeline.push({
      monthIndex,
      target: targets[0] || firstTargetName(cards, method, customOrder),
      totalBalance: roundCents(cards.reduce((sum, card) => sum + Math.max(0, card.balance), 0)),
      payment: monthPaid,
      interest: roundCents(interestByCard.reduce((sum, interest) => sum + interest, 0)),
      balances: cards.map((card) => roundCents(Math.max(0, card.balance))),
      payments
    });
  }

  const capped = activeDebts(cards).length > 0;
  const totalInterest = roundCents(totals.interest);
  const totalPaid = roundCents(cards.reduce((sum, card) => sum + card.startingBalance, 0) + totalInterest);

  return {
    method,
    months: timeline.length,
    capped,
    totalInterest,
    totalPaid,
    monthlyBudget,
    minimumTotal,
    extraPayment: roundCents(monthlyBudget - minimumTotal),
    timeline,
    summaries: totals.byCard.map((summary) => ({ ...summary, interestPaid: roundCents(summary.interestPaid) }))
  };
}

function monthsUntilTarget(startMonth, targetMonth) {
  if (!startMonth || !targetMonth) return null;
  const [startYear, start] = String(startMonth).split("-").map(Number);
  const [targetYear, target] = String(targetMonth).split("-").map(Number);
  if (!startYear || !start || !targetYear || !target) return null;
  return Math.max(1, (targetYear - startYear) * 12 + (target - start) + 1);
}

function requiredPaymentForTarget(inputDebts, options = {}) {
  const targetMonths = Number(options.targetMonths || 0);
  if (!targetMonths || targetMonths <= 0) return null;

  const debts = normalizeDebts(inputDebts);
  const minimumTotal = sumMinimums(debts);
  let low = minimumTotal;
  let high = Math.max(minimumTotal + 100, debts.reduce((sum, debt) => sum + debt.balance, 0) + 100);

  for (let i = 0; i < 24; i += 1) {
    const result = simulatePayoff(debts, { ...options, monthlyPayment: high });
    if (!result.capped && result.months <= targetMonths) break;
    high *= 1.7;
  }

  let feasible = simulatePayoff(debts, { ...options, monthlyPayment: high });
  if (feasible.capped || feasible.months > targetMonths) return null;

  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const result = simulatePayoff(debts, { ...options, monthlyPayment: mid });
    if (!result.capped && result.months <= targetMonths) high = mid;
    else low = mid;
  }

  const monthlyPayment = roundCents(high);
  const result = simulatePayoff(debts, { ...options, monthlyPayment });
  return {
    monthlyPayment,
    extraPayment: roundCents(monthlyPayment - minimumTotal),
    months: result.months,
    totalInterest: result.totalInterest
  };
}

function analyzeWarnings(inputDebts, result) {
  const debts = normalizeDebts(inputDebts);
  const warnings = [];

  debts.forEach((debt) => {
    const monthlyInterest = roundCents(debt.balance * (debt.apr / 100 / 12));
    if (debt.minimum <= monthlyInterest + EPSILON) {
      warnings.push(`${debt.name}'s minimum payment barely covers monthly interest.`);
    }
  });

  if (result.capped) {
    warnings.push("This plan does not pay off all balances within 50 years.");
  }

  if (result.extraPayment < 25 && debts.length > 1) {
    warnings.push("The extra payment is small relative to the number of cards, so payoff progress may feel slow.");
  }

  return warnings;
}

const CardPayoffMath = {
  analyzeWarnings,
  monthsUntilTarget,
  normalizeDebts,
  requiredPaymentForTarget,
  roundCents,
  simulatePayoff,
  sumMinimums
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CardPayoffMath;
}

if (typeof window !== "undefined") {
  window.CardPayoffMath = CardPayoffMath;
}
