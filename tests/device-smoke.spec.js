const { expect, test } = require("@playwright/test");

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
];

function sharedUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/?q=" + encoded + "#monthPlan";
}

function hashSharedUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/#q=" + encoded + "#monthPlan";
}

function hashSharedStateOnlyUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/#q=" + encoded;
}

for (const viewport of viewports) {
  test(`core calculator layout works on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Credit Card and Debt Payoff Calculator" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear form" })).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Card balance" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Payoff Strategy" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Payoff results" })).toBeVisible();

    const pageWidths = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
  });
}

test("keyboard users can reach primary calculator actions", async ({ page }) => {
  await page.goto("/");

  const focusedLabels = [];
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    focusedLabels.push(await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.getAttribute("aria-label") || active.textContent || active.id || active.tagName : "";
    }));
  }

  expect(focusedLabels.join(" ")).toContain("Clear form");
  expect(focusedLabels.join(" ")).toContain("Card balance");
  expect(focusedLabels.join(" ")).toContain("Payoff Strategy");
});

test("tabbing from credit card APR moves to minimum payment", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("spinbutton", { name: "Card APR" }).focus();
  await page.keyboard.press("Tab");

  await expect(page.getByRole("spinbutton", { name: "Card minimum payment" })).toBeFocused();
});

test("payment mode switch converts between extra and total budget amounts", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Card name" }).fill("Visa");
  await page.getByRole("spinbutton", { name: "Visa balance" }).fill("1000");
  await page.getByRole("spinbutton", { name: "Visa APR" }).fill("12");
  await page.getByRole("spinbutton", { name: "Visa minimum payment" }).fill("50");
  await page.getByRole("spinbutton", { name: "Extra monthly payment" }).fill("200");
  await page.locator("#resultsPanel").click();

  await expect(page.locator(".supporting-metrics .metric", { hasText: "Starting Monthly Payment" })).toContainText("$250");
  await expect(page.locator(".result-hero")).toContainText("Starting Monthly Payment");
  await expect(page.locator("#heroMonthlyPayment")).toHaveText("$250");
  await expect(page.locator("#comparisonSection th").nth(4)).toHaveText("Starting Payment");
  await expect(page.locator("#comparisonRows tr").first().locator("td").nth(4)).toHaveAttribute("data-label", "Starting payment");
  await expect(page.locator("#scheduleModeNote")).toContainText("total monthly payment can decline");
  await expect(page.locator("#mobileMonthlyPayment")).toContainText("Starts $250/mo; may drop");
  await expect(page.locator("#monthPlanRows tr").first().locator("td").nth(4)).toHaveAttribute("data-label", "Balance after payment");
  await expect(page.locator(".share-privacy-note")).toHaveCount(0);

  await page.locator("#paymentMode").selectOption("total");
  await expect.poll(() => page.locator("#extraPayment").inputValue()).toBe("250");
  await expect(page.getByRole("spinbutton", { name: "Total monthly debt payoff budget" })).toHaveValue("250");
  await expect(page.locator("#currentPlanSummary")).toContainText("Using a fixed $250/mo budget");
  await expect(page.locator("#savingsResult")).toContainText("Keeping a $250/mo budget");
  await expect(page.locator("#scheduleModeNote")).toContainText("keeps your payoff budget fixed");
  await page.locator("#resultsPanel").click();
  await expect(page.locator("#mobileMonthlyPayment")).toContainText("Budget $250/mo");

  await page.locator("#paymentMode").selectOption("extra");
  await expect.poll(() => page.locator("#extraPayment").inputValue()).toBe("200");
  await expect(page.getByRole("spinbutton", { name: "Extra monthly payment" })).toHaveValue("200");
  await expect(page.locator("#currentPlanSummary")).toContainText("With $200 extra");
  await expect(page.locator("#scheduleRows tr").first()).toContainText("Visa $250.00 total ($50.00 minimum + $200 extra)");
});

test("shared result links collapse optional panels for a cleaner deep link", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(sharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "Visa", balance: 1000, apr: 12, minimum: 50 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1"]
  }));

  await expect(page.locator("#monthPlan")).toBeVisible();
  await expect(page.locator("#monthPlan")).toHaveClass(/month-plan-panel/);
  await expect(page.locator("#sampleButton")).toBeHidden();
  await expect(page.locator("#planModeStatus")).toContainText("For privacy, the address bar no longer contains this plan");
  await expect.poll(() => page.locator("#targetDateOptions").evaluate((details) => details.open)).toBe(false);
  await expect.poll(() => page.locator("#payoffOptions").evaluate((details) => details.open)).toBe(false);
});

test("hash share links preserve section anchors after the encoded state", async ({ page }) => {
  await page.goto(hashSharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "Visa", balance: 1000, apr: 12, minimum: 50 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1"]
  }));

  await expect(page.locator("#monthPlan")).toBeVisible();
  await expect(page.locator("#planModeStatus")).toContainText("Shared plan loaded: 1 debt.");
  await expect(page.locator("#monthPlanRows tr")).toHaveCount(1);
});

test("legacy query share links keep the section anchor after loading", async ({ page }) => {
  await page.goto(sharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "Visa 1", balance: 1000, apr: 12, minimum: 50 },
      { id: "card-2", name: "Visa 2", balance: 1200, apr: 18, minimum: 55 },
      { id: "card-3", name: "Visa 3", balance: 1400, apr: 20, minimum: 60 },
      { id: "card-4", name: "Visa 4", balance: 1600, apr: 22, minimum: 65 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1", "card-2", "card-3", "card-4"]
  }));

  await expect(page.locator("#monthPlan")).toBeVisible();
  await expect(page.locator("#monthPlan")).not.toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#monthPlanRows tr")).toHaveCount(4);
  const url = new URL(page.url());
  expect(url.searchParams.get("q")).toBeNull();
  expect(url.hash).toBe("#monthPlan");
});

test("invalid hash share links show a visible recovery message", async ({ page }) => {
  await page.goto("/#q=not-a-real-plan#monthPlan");

  await expect(page.locator("#planModeStatus")).toContainText("Could not load shared plan");
  await expect(page.locator("#emptyResults")).toBeVisible();
});

test("month one plan collapses long mobile debt lists", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(hashSharedStateOnlyUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "Visa 1", balance: 1000, apr: 12, minimum: 50 },
      { id: "card-2", name: "Visa 2", balance: 1200, apr: 18, minimum: 55 },
      { id: "card-3", name: "Visa 3", balance: 1400, apr: 20, minimum: 60 },
      { id: "card-4", name: "Visa 4", balance: 1600, apr: 22, minimum: 65 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1", "card-2", "card-3", "card-4"]
  }));

  await page.locator("#monthPlan").scrollIntoViewIfNeeded();
  await expect(page.locator("#monthPlan")).toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#toggleMonthPlanRows")).toContainText("Show all 4 debts");
  await expect(page.locator("#monthPlan .scroll-hint")).toContainText("Showing 2 of 4 debts.");
  const toggleGap = await page.evaluate(() => {
    const visibleRows = Array.from(document.querySelectorAll("#monthPlanRows tr"))
      .filter((row) => getComputedStyle(row).display !== "none");
    const lastVisibleRow = visibleRows[visibleRows.length - 1];
    const toggle = document.querySelector("#toggleMonthPlanRows");
    if (!lastVisibleRow || !toggle) return -1;
    return Math.round(toggle.getBoundingClientRect().top - lastVisibleRow.getBoundingClientRect().bottom);
  });
  expect(toggleGap).toBeGreaterThanOrEqual(0);
  await page.locator("#toggleMonthPlanRows").click();
  await expect(page.locator("#monthPlan")).not.toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#toggleMonthPlanRows")).toContainText("Collapse to first 2 debts");
  await expect(page.locator("#monthPlanIntro")).toContainText("All 4 first-month payments are shown.");
  await expect(page.locator("#monthPlan .scroll-hint")).toContainText("All 4 first-month payments are shown.");
  await expect(page.locator("#monthPlan")).toContainText("$200 extra");
  await expect(page.locator(".month-plan-extra-badge")).toHaveCSS("display", "block");
  await expect(page.locator("#scheduleRows tr").first().locator("td").nth(6)).toHaveAttribute("data-label", "Extra Payment Target");
  await expect(page.locator(".schedule-panel .scroll-hint")).toBeHidden();
  await expect(page.locator("#scheduleRows tr").first()).toHaveCSS("display", "grid");
});

test("tabbing from final credit card minimum adds a card row", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Card name" }).fill("Visa");
  await page.getByRole("spinbutton", { name: "Visa balance" }).fill("8500");
  await page.getByRole("spinbutton", { name: "Visa APR" }).fill("22.99");
  await page.getByRole("spinbutton", { name: "Visa minimum payment" }).fill("170");
  await page.getByRole("spinbutton", { name: "Visa minimum payment" }).focus();
  await page.keyboard.press("Tab");

  await expect(page.locator("#cardRows tr")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => ({
    field: document.activeElement && document.activeElement.dataset.field,
    rowIndex: Array.from(document.querySelectorAll("#cardRows tr")).indexOf(document.activeElement.closest("tr"))
  }))).toEqual({ field: "name", rowIndex: 1 });
});

test("tabbing from final installment loan field adds a loan row", async ({ page }) => {
  await page.goto("/");

  await page.locator("#loanSection summary").click();
  await page.getByRole("button", { name: "Add Loan" }).click();
  await page.getByRole("textbox", { name: "Loan name" }).fill("Auto Loan");
  await page.getByRole("spinbutton", { name: "Auto Loan balance" }).fill("12000");
  await page.getByRole("spinbutton", { name: "Auto Loan interest rate" }).fill("6.5");
  await page.getByRole("spinbutton", { name: "Auto Loan fixed monthly payment" }).fill("300");
  await page.getByRole("spinbutton", { name: "Auto Loan remaining term in months" }).fill("48");
  await page.getByRole("spinbutton", { name: "Auto Loan remaining term in months" }).focus();
  await page.keyboard.press("Tab");

  await expect(page.locator("#loanRows tr")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => ({
    field: document.activeElement && document.activeElement.dataset.field,
    rowIndex: Array.from(document.querySelectorAll("#loanRows tr")).indexOf(document.activeElement.closest("tr"))
  }))).toEqual({ field: "name", rowIndex: 1 });
});

test("tabbing from final payoff option fields adds another option", async ({ page }) => {
  await page.goto("/");

  await page.locator("#payoffOptions summary").click();
  await page.getByRole("button", { name: "Add Balance Transfer" }).click();
  await page.locator('[data-option-field="postApr"]').focus();
  await page.keyboard.press("Tab");

  await expect(page.locator('#optionScenarioList .option-fieldset[data-option-type="balance-transfer"]')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => ({
    field: document.activeElement && document.activeElement.dataset.optionField,
    type: document.activeElement.closest(".option-fieldset") && document.activeElement.closest(".option-fieldset").dataset.optionType
  }))).toEqual({ field: "amount", type: "balance-transfer" });

  await page.getByRole("button", { name: "Add Consolidation Loan" }).click();
  await page.locator('#optionScenarioList .option-fieldset[data-option-type="consolidation-loan"] [data-option-field="fee"]').focus();
  await page.keyboard.press("Tab");

  await expect(page.locator('#optionScenarioList .option-fieldset[data-option-type="consolidation-loan"]')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => ({
    field: document.activeElement && document.activeElement.dataset.optionField,
    type: document.activeElement.closest(".option-fieldset") && document.activeElement.closest(".option-fieldset").dataset.optionType
  }))).toEqual({ field: "amount", type: "consolidation-loan" });
});

test("deferred educational content mounts and remains interactive", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Methodology" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Worked Example: Paying Off $12,900 in Credit Card Debt" })).toBeVisible();

  await page.getByRole("button", { name: "Load this example" }).click();

  await expect(page.locator(".card-summary-line").first()).toContainText("Sample Visa");
  await expect(page.locator(".card-summary-line").first()).toContainText("$8,500");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();
});
