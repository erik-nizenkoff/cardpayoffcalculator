const {
  analyzeWarnings,
  monthsUntilTarget,
  requiredPaymentForTarget,
  simulatePayoff,
  sumMinimums
} = window.CardPayoffMath;

const debtRows = document.getElementById("debtRows");
const formError = document.getElementById("formError");
const extraPaymentInput = document.getElementById("extraPayment");
const startMonthInput = document.getElementById("startMonth");
const targetMonthInput = document.getElementById("targetMonth");
const resultDuration = document.getElementById("resultDuration");
const resultInterest = document.getElementById("resultInterest");
const resultPayment = document.getElementById("resultPayment");
const resultDate = document.getElementById("resultDate");
const targetResult = document.getElementById("targetResult");
const warningsBox = document.getElementById("warnings");
const balanceChart = document.getElementById("balanceChart");
const chartCaption = document.getElementById("chartCaption");
const comparisonRows = document.getElementById("comparisonRows");
const methodDescription = document.getElementById("methodDescription");
const copyStatus = document.getElementById("copyStatus");

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const dollarsCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

let nextDebtId = 1;
let lastState = null;

function money(value) {
  return dollars.format(Math.round(value || 0));
}

function moneyCents(value) {
  return dollarsCents.format(value || 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function duration(months, capped = false) {
  if (capped) return "50+ years";
  if (!months) return "0 months";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${months} month${months === 1 ? "" : "s"}`;
  if (!rest) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} yr ${rest} mo`;
}

function defaultMonth(offset = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return monthFormatter.format(date);
}

function selectedMethod() {
  return document.querySelector("input[name='method']:checked")?.value || "avalanche";
}

function methodText(method) {
  return {
    avalanche: "Avalanche targets the highest APR card after minimums.",
    snowball: "Snowball targets the smallest balance after minimums.",
    fixed: "Fixed payment splits extra money across active cards.",
    custom: "Custom follows the order shown in the card table."
  }[method] || "Avalanche targets the highest APR card after minimums.";
}

function addDebtRow(debt = {}) {
  const id = String(debt.id || `card-${nextDebtId++}`);
  const row = document.createElement("tr");
  row.dataset.id = id;
  row.innerHTML = `
    <td class="name-cell"><input data-field="name" aria-label="Card name" value="${escapeHtml(debt.name || "")}" placeholder="Card name"></td>
    <td class="amount-cell"><input data-field="balance" aria-label="Balance" type="number" min="0" step="0.01" value="${debt.balance ?? ""}" placeholder="0"></td>
    <td class="amount-cell"><input data-field="apr" aria-label="APR" type="number" min="0" max="49.99" step="0.01" value="${debt.apr ?? ""}" placeholder="0"></td>
    <td class="amount-cell"><input data-field="minimum" aria-label="Minimum payment" type="number" min="0" step="0.01" value="${debt.minimum ?? ""}" placeholder="0"></td>
    <td class="order-cell">
      <div class="row-actions">
        <button type="button" class="icon-button" data-action="up" title="Move up" aria-label="Move card up">Up</button>
        <button type="button" class="icon-button" data-action="down" title="Move down" aria-label="Move card down">Dn</button>
        <button type="button" class="icon-button remove-button" data-action="remove" title="Remove" aria-label="Remove card">X</button>
      </div>
    </td>
  `;
  debtRows.appendChild(row);
}

function rowValue(row, field) {
  return row.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
}

function readDebts() {
  return [...debtRows.querySelectorAll("tr")].map((row, index) => ({
    id: row.dataset.id,
    name: rowValue(row, "name") || `Card ${index + 1}`,
    balance: Number(rowValue(row, "balance")),
    apr: Number(rowValue(row, "apr")),
    minimum: Number(rowValue(row, "minimum"))
  })).filter((debt) => debt.name || debt.balance || debt.apr || debt.minimum);
}

function validateDebts(debts) {
  if (!debts.length) return "Enter at least one credit card.";
  for (const debt of debts) {
    if (!Number.isFinite(debt.balance) || debt.balance <= 0) return `${debt.name}: enter a balance above $0.`;
    if (!Number.isFinite(debt.apr) || debt.apr < 0 || debt.apr > 49.99) return `${debt.name}: enter an APR from 0% to 49.99%.`;
    if (!Number.isFinite(debt.minimum) || debt.minimum <= 0) return `${debt.name}: enter a minimum payment above $0.`;
  }
  return "";
}

function renderChart(result) {
  const points = result.timeline;
  if (!points.length) {
    balanceChart.innerHTML = "";
    chartCaption.textContent = "";
    return;
  }

  const width = 640;
  const height = 190;
  const pad = 28;
  const maxBalance = Math.max(...points.map((point) => point.totalBalance), 1);
  const sampleEvery = Math.max(1, Math.ceil(points.length / 80));
  const sampled = points.filter((_, index) => index % sampleEvery === 0 || index === points.length - 1);
  const coords = sampled.map((point) => {
    const x = pad + (point.monthIndex / Math.max(1, points.length - 1)) * (width - pad * 2);
    const y = height - pad - (point.totalBalance / maxBalance) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  balanceChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#a9b4c3" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#a9b4c3" />
      <text x="${pad}" y="18" fill="#687386" font-size="12">${money(maxBalance)}</text>
      <text x="${width - pad}" y="${height - 6}" fill="#687386" font-size="12" text-anchor="end">${duration(result.months, result.capped)}</text>
      <polyline fill="none" stroke="#0f6b67" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${coords}" />
    </svg>
  `;
  chartCaption.textContent = result.capped ? "Capped at 50 years" : `${result.months} months`;
}

function renderComparison(debts, extraPayment, customOrder) {
  const methods = ["avalanche", "snowball", "fixed"];
  const rows = methods.map((method) => simulatePayoff(debts, { method, extraPayment, customOrder }));
  const bestInterest = Math.min(...rows.map((row) => row.totalInterest));

  comparisonRows.innerHTML = rows.map((result) => {
    const firstPayoff = result.summaries
      .filter((summary) => summary.payoffMonth !== null)
      .sort((a, b) => a.payoffMonth - b.payoffMonth)[0];
    return `
      <tr class="${result.totalInterest === bestInterest ? "best-row" : ""}">
        <td>${escapeHtml(methodLabel(result.method))}</td>
        <td>${duration(result.months, result.capped)}</td>
        <td>${money(result.totalInterest)}</td>
        <td>${firstPayoff ? `${escapeHtml(firstPayoff.name)} in ${duration(firstPayoff.payoffMonth + 1)}` : "-"}</td>
      </tr>
    `;
  }).join("");
}

function methodLabel(method) {
  return {
    avalanche: "Avalanche",
    snowball: "Snowball",
    fixed: "Fixed payment",
    custom: "Custom order"
  }[method] || "Avalanche";
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    warningsBox.hidden = true;
    warningsBox.innerHTML = "";
    return;
  }
  warningsBox.hidden = false;
  warningsBox.innerHTML = warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join("");
}

function renderTargetPayment(debts, method, customOrder) {
  const targetMonths = monthsUntilTarget(startMonthInput.value, targetMonthInput.value);
  if (!targetMonths) {
    targetResult.hidden = true;
    targetResult.innerHTML = "";
    return;
  }

  const required = requiredPaymentForTarget(debts, { method, customOrder, targetMonths });
  if (!required) {
    targetResult.hidden = false;
    targetResult.textContent = "No feasible target payment found within the calculator limit.";
    return;
  }

  targetResult.hidden = false;
  targetResult.innerHTML = `To be debt-free by ${escapeHtml(addMonths(startMonthInput.value, targetMonths - 1))}, estimated payment needed: <strong>${money(required.monthlyPayment)}/mo</strong> (${money(required.extraPayment)} above minimums).`;
}

function buildSummary(state) {
  const { result, method } = state;
  return [
    "Card Payoff Calculator summary",
    `Method: ${methodLabel(method)}`,
    `Debt-free in: ${duration(result.months, result.capped)}`,
    `Monthly payment: ${money(result.monthlyBudget)}`,
    `Total interest: ${money(result.totalInterest)}`,
    `Payoff month: ${result.capped ? "50+ years" : addMonths(startMonthInput.value, result.months - 1)}`
  ].join("\n");
}

function downloadCsv() {
  if (!lastState) return;
  const rows = [
    ["Month", "Target", "Total balance", "Payment", "Interest"],
    ...lastState.result.timeline.map((point) => [
      point.monthIndex + 1,
      point.target || "",
      moneyCents(point.totalBalance),
      moneyCents(point.payment),
      moneyCents(point.interest)
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "card-payoff-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function calculate() {
  const debts = readDebts();
  const error = validateDebts(debts);
  if (error) {
    formError.hidden = false;
    formError.textContent = error;
    return;
  }

  formError.hidden = true;
  const method = selectedMethod();
  const extraPayment = Number(extraPaymentInput.value || 0);
  const customOrder = [...debtRows.querySelectorAll("tr")].map((row) => row.dataset.id);
  const result = simulatePayoff(debts, { method, extraPayment, customOrder });
  const payoffMonth = result.capped ? "50+ years" : addMonths(startMonthInput.value, result.months - 1);

  resultDuration.textContent = duration(result.months, result.capped);
  resultInterest.textContent = money(result.totalInterest);
  resultPayment.textContent = money(result.monthlyBudget);
  resultDate.textContent = payoffMonth;
  methodDescription.textContent = methodText(method);

  renderTargetPayment(debts, method, customOrder);
  renderWarnings(analyzeWarnings(debts, result));
  renderChart(result);
  renderComparison(debts, Number(extraPaymentInput.value || 0), customOrder);

  lastState = { debts, method, customOrder, result };
  copyStatus.textContent = "";
}

function loadSample() {
  debtRows.innerHTML = "";
  nextDebtId = 1;
  [
    { id: "visa", name: "Visa", balance: 8500, apr: 22.99, minimum: 170 },
    { id: "mc", name: "Mastercard", balance: 3200, apr: 19.99, minimum: 64 },
    { id: "store", name: "Store card", balance: 1200, apr: 28.99, minimum: 45 }
  ].forEach(addDebtRow);
  extraPaymentInput.value = "250";
  calculate();
}

debtRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const row = button.closest("tr");
  const action = button.dataset.action;

  if (action === "remove" && debtRows.children.length > 1) row.remove();
  if (action === "up" && row.previousElementSibling) debtRows.insertBefore(row, row.previousElementSibling);
  if (action === "down" && row.nextElementSibling) debtRows.insertBefore(row.nextElementSibling, row);
  calculate();
});

document.getElementById("addDebtButton").addEventListener("click", () => {
  addDebtRow();
  calculate();
});

document.getElementById("sampleButton").addEventListener("click", loadSample);
document.getElementById("csvButton").addEventListener("click", downloadCsv);
document.getElementById("copyButton").addEventListener("click", async () => {
  if (!lastState) return;
  await navigator.clipboard.writeText(buildSummary(lastState));
  copyStatus.textContent = "Summary copied.";
});

document.getElementById("calculatorForm").addEventListener("input", calculate);
document.getElementById("calculatorForm").addEventListener("change", calculate);

startMonthInput.value = defaultMonth();
targetMonthInput.value = defaultMonth(24);
loadSample();
