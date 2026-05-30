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
    await expect(page.locator("#clearAllButton")).toBeHidden();
    await expect(page.getByRole("button", { name: "Load example" })).toBeVisible();
    if (viewport.name === "phone") {
      await expect(page.getByRole("link", { name: "Review privacy and enter debts" })).toBeVisible();
      await expect(page.locator("#startEntryButton")).toHaveAttribute("href", "#privacyOptions");
    }
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

  expect(focusedLabels.join(" ")).toContain("Load example");
  expect(focusedLabels.join(" ")).toContain("Card balance");
  expect(focusedLabels.join(" ")).toContain("Payoff Strategy");
});

test("optional section toggles expose clear accessible labels", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Privacy option: Do not use my calculator inputs to improve this site")).toBeVisible();
  const privacyBeforeDebtInputs = await page.evaluate(() => {
    const privacy = document.querySelector(".privacy-disclosure");
    const cardInputs = document.querySelector("#cardInputs");
    return Boolean(privacy && cardInputs && (privacy.compareDocumentPosition(cardInputs) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(privacyBeforeDebtInputs).toBe(true);
  await expect(page.locator('summary[aria-label="Show or hide installment loan inputs"]')).toBeVisible();
  await expect(page.locator('summary[aria-label="Show or hide target payoff month options"]')).toBeVisible();
  await expect(page.locator('summary[aria-label="Show or hide payoff option comparison inputs"]')).toBeVisible();
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
  await expect(page.getByRole("button", { name: "Clear form" })).toBeVisible();
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
  await expect(page.locator("#scheduleRows tr").first()).toContainText("Visa $250.00 total (+$200 extra)");
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
  await expect(page.locator("#monthPlanSummary")).toContainText("Debt-free date");
  await expect(page.locator("#monthPlanSummary")).toContainText("Month 1 total");
  await expect(page.locator("#monthPlanSummary")).toContainText("Minimums");
  await expect(page.locator("#monthPlanFocus")).toContainText("This month's focus");
  await expect(page.locator("#monthPlanFocus")).toContainText("Pay Visa");
  await expect(page.locator(".month-plan-target-row")).toHaveCount(1);
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Shared plan: 1 debt loaded from a link");
  await expect(page.locator("#sharedPlanMonthNotice")).not.toContainText("Review inputs/privacy");
  await expect(page.locator(".month-plan-back-link")).toBeVisible();
  await expect(page.locator(".month-plan-summary-link")).toHaveCount(0);
  await expect(page.locator("#entryGuide")).toContainText("Loaded shared plan");
  await expect(page.locator("#startEntryButton")).toHaveText("Review loaded debts");
  await expect(page.locator("#startEntryButton")).toHaveAttribute("href", "#privacyOptions");
  await expect(page.locator(".month-plan-schedule-link")).toHaveText("Jump to full schedule");
  await expect(page.locator(".month-plan-schedule-link")).toHaveAttribute("href", "#schedulePanel");
  await expect(page.locator("#sampleButton")).toBeHidden();
  await expect(page.locator("#planModeStatus")).toContainText("For privacy, the address bar no longer contains this plan");
  await expect.poll(() => page.evaluate(() => document.activeElement && document.activeElement.id)).toBe("monthPlan");
  await expect.poll(() => page.locator("#targetDateOptions").evaluate((details) => details.open)).toBe(false);
  await expect.poll(() => page.locator("#payoffOptions").evaluate((details) => details.open)).toBe(false);

  await page.reload();
  await expect(page.locator("#monthPlan")).toBeVisible();
  await expect(page.locator("#planModeStatus")).toContainText("Shared plan loaded: 1 debt.");
  await expect(page.locator("#monthPlanRows tr")).toHaveCount(1);
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
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  await page.locator("#toggleMonthPlanRowsTop").click();
  await expect(page.locator("#monthPlan")).toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#toggleMonthPlanRowsTop")).toContainText("Show all 4 payments before paying");
  await expect(page.locator("#monthPlan .scroll-hint")).toContainText("2 payments hidden before paying");
  const visibleRows = await page.locator("#monthPlanRows tr").evaluateAll((rows) =>
    rows.filter((row) => getComputedStyle(row).display !== "none").length
  );
  expect(visibleRows).toBe(2);
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

  await page.locator("#monthPlan").scrollIntoViewIfNeeded();
  await expect(page.locator("#sharedPlanResultNotice")).toContainText("4 debts loaded from a link");
  await expect(page.locator("#sharedPlanResultNotice")).toContainText("Review privacy & inputs");
  await expect(page.locator("#sharedPlanResultNotice")).toContainText("Do not save calculation data from this plan");
  await expect(page.locator("#sharedPlanResultNotice")).toContainText("Applies to edits and what-if buttons.");
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Shared plan: 4 debts loaded from a link");
  await expect(page.locator("#sharedPlanMonthNotice")).not.toContainText("Review inputs/privacy");
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Do not save calculation data from this plan");
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Applies to edits and what-if buttons.");
  await expect(page.locator("#sharedPlanMonthNotice")).not.toContainText("Back to summary");
  await page.locator("#sharedMonthTelemetryOptOut").check();
  await expect(page.locator("#telemetryOptOut")).toBeChecked();
  await expect(page.locator("#sharedTelemetryOptOut")).toBeChecked();
  await expect(page.locator("#sharedMonthTelemetryOptOut")).toBeChecked();
  await expect(page.locator("#paymentDropContext")).toContainText("This is month 1");
  await expect(page.locator("#paymentDropContext")).toContainText("can drop");
  await expect(page.locator("#monthPlan")).not.toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#toggleMonthPlanRowsTop")).toContainText("Collapse to first 2 payments");
  await expect(page.locator("#toggleMonthPlanRows")).toContainText("Collapse to first 2 payments");
  await expect(page.locator("#monthPlanIntro")).toContainText("All 4 first-month payments are shown.");
  await expect(page.locator("#monthPlan .scroll-hint")).toContainText("All 4 first-month payments are shown.");
  await expect(page.locator(".month-plan-back-link")).toHaveText("Back to summary");
  await expect(page.locator(".month-plan-schedule-link")).toHaveText("Jump to full schedule");
  await expect(page.locator(".month-plan-schedule-link")).toBeVisible();
  await expect(page.locator(".month-plan-chart-link")).toHaveText("Jump to chart");
  await expect(page.locator(".month-plan-chart-link")).toBeVisible();
  await expect(page.locator("#monthPlanSummary")).toContainText("Avalanche");
  await expect(page.locator("#monthPlanSummary")).toContainText("Month 1 total");
  await expect(page.locator("#monthPlanSummary")).toContainText("Later monthly totals");
  await expect(page.locator("#monthPlanSummary")).toContainText("Can decrease");
  await expect(page.locator("#monthPlanFocus")).toContainText("This month's focus");
  await expect(page.locator("#monthPlanFocus")).toContainText("Pay Visa 4");
  await expect(page.locator(".month-plan-primary-schedule-link")).toHaveText("View month-by-month schedule");
  await expect(page.locator(".month-plan-primary-schedule-link")).toHaveAttribute("href", "#schedulePanel");
  const focusBeforeActions = await page.evaluate(() => {
    const focus = document.querySelector("#monthPlanFocus");
    const primarySchedule = document.querySelector(".month-plan-primary-schedule-link");
    const summary = document.querySelector("#monthPlanSummary");
    const actions = document.querySelector("#monthPlan .month-plan-actions");
    const notice = document.querySelector("#sharedPlanMonthNotice");
    return Boolean(
      focus &&
      primarySchedule &&
      summary &&
      actions &&
      notice &&
      (focus.compareDocumentPosition(primarySchedule) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      (primarySchedule.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      (focus.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      (focus.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  });
  expect(focusBeforeActions).toBe(true);
  await expect(page.locator(".month-plan-target-row")).toHaveCount(1);
  await expect(page.locator(".month-plan-target-row td").first()).toHaveAttribute("aria-label", /Extra payment target/);
  await expect(page.locator(".month-plan-target-badge")).toContainText("Extra target");
  await expect(page.locator(".month-plan-summary-link")).toHaveCount(0);
  await expect(page.locator("#monthPlan")).toContainText("$200 extra");
  await expect(page.locator(".month-plan-extra-badge")).toHaveCSS("display", "block");
  const touchTargetSizes = await page.evaluate(() => ({
    topToggle: Math.round(document.querySelector("#toggleMonthPlanRowsTop").getBoundingClientRect().height),
    monthOptOut: Math.round(document.querySelector("#sharedMonthTelemetryOptOut").closest("label").getBoundingClientRect().height)
  }));
  expect(touchTargetSizes.topToggle).toBeGreaterThanOrEqual(44);
  expect(touchTargetSizes.monthOptOut).toBeGreaterThanOrEqual(44);
  const monthPlanRowHeights = await page.locator("#monthPlanRows tr").evaluateAll((rows) =>
    rows.map((row) => Math.round(row.getBoundingClientRect().height))
  );
  expect(Math.max(...monthPlanRowHeights)).toBeLessThan(170);
  const staticTabStops = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[tabindex]"))
      .filter((element) => element.tabIndex >= 0)
      .filter((element) => !element.matches("a[href], button, input, select, textarea, summary, [role='button'], [role='link']"))
      .map((element) => element.id || element.className || element.tagName)
  );
  expect(staticTabStops).toEqual([]);
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
  await expect(page.locator("#monthPlan")).toHaveClass(/month-plan-collapsed/);
  await expect(page.locator("#toggleMonthPlanRowsTop")).toContainText("Show all 4 payments before paying");
  await expect(page.locator("#toggleMonthPlanRows")).toContainText("Show all 4 payments before paying");
  await expect(page.locator("#monthPlanIntro")).toContainText("Show all 4 payments before paying");
  await expect(page.locator("#monthPlan .scroll-hint")).toContainText("2 payments hidden before paying");
  await expect(page.locator("#scheduleRows tr").first().locator("td").nth(6)).toHaveAttribute("data-label", "Extra Payment Target");
  await expect(page.locator("#scheduleRows tr").first().locator("td").nth(6)).toHaveCSS("white-space", "normal");
  await expect(page.locator("#scheduleRows tr").first().locator(".schedule-target-copy")).toBeVisible();
  await expect(page.locator(".schedule-panel .scroll-hint")).toBeHidden();
  await expect(page.locator("#scheduleRows tr").first()).toHaveCSS("display", "grid");
});

test("collapsed schedule includes and highlights target payoff month", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(sharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 50,
    startMonth: "2026-05",
    targetMonth: "2027-12",
    cards: [
      { id: "card-1", name: "Visa", balance: 10000, apr: 20, minimum: 200 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1"]
  }));

  await expect(page.locator("#scheduleRows tr")).toHaveCount(13);
  await expect(page.locator("#scheduleNote")).toContainText("plus target month Dec 2027");
  await expect(page.locator("#targetMonthJump")).toBeVisible();
  await expect(page.locator("#targetMonthJump")).toContainText("Dec 2027");
  await expect(page.locator("#scheduleTargetMonth")).toContainText("20");
  await expect(page.locator("#scheduleTargetMonth")).toContainText("Dec 2027");
  await expect(page.locator("#scheduleTargetMonth")).toContainText("Target month");

  await page.locator("#toggleSchedule").click();
  await expect(page.locator("#scheduleLoading")).toBeHidden();
  await expect(page.locator("#toggleSchedule")).toContainText("Show first 12 months");
  await expect(page.locator("#scheduleTargetMonth")).toHaveCount(1);
});

test("schedule marks and compresses target changes on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(sharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 300,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "High APR Card", balance: 700, apr: 29.99, minimum: 35 },
      { id: "card-2", name: "Large Visa", balance: 10000, apr: 15.99, minimum: 200 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1", "card-2"]
  }));

  await page.locator("#schedulePanel").scrollIntoViewIfNeeded();
  await expect(page.locator("#scheduleNote")).toContainText("Showing milestone months");
  const milestoneRowCount = await page.locator("#scheduleRows tr").count();
  expect(milestoneRowCount).toBeGreaterThanOrEqual(3);
  expect(milestoneRowCount).toBeLessThan(12);
  await expect(page.locator("#toggleSchedule")).toContainText("Show all");
  await page.locator("#toggleSchedule").click();
  await expect(page.locator("#toggleSchedule")).toContainText("Show milestone months");

  await expect(page.locator(".schedule-target-change-row").first()).toBeVisible();
  await expect(page.locator(".schedule-target-change-row").first()).toContainText("New target:");
  await expect(page.locator(".schedule-target-change-row").first()).not.toContainText("New target Target");
  await expect(page.locator(".schedule-target-change-row").first().locator(".schedule-target-name")).toContainText("New target:");
  await expect(page.locator(".schedule-target-detail").first()).toContainText("total");
  await expect(page.locator(".schedule-target-change-row").first().locator("td").nth(6)).toHaveAttribute("aria-label", /New target/);
  await expect(page.locator("#scheduleJumpLinks")).toContainText("Target changes");
  await expect(page.locator("#scheduleJumpLinks")).toContainText("First payoff");
  await expect(page.locator("#scheduleJumpLinks")).toContainText("Final month");
  await expect(page.locator("#scheduleRows tr").first().locator("[data-schedule-detail='true']").first()).toBeHidden();
  await expect(page.locator("#scheduleRows tr").first().getByRole("button", { name: /Show interest, principal, and balance/ })).toBeVisible();
  const firstRowHeight = await page.locator("#scheduleRows tr").first().evaluate((row) =>
    Math.round(row.getBoundingClientRect().height)
  );
  expect(firstRowHeight).toBeLessThan(210);
  await page.locator("#scheduleRows tr").first().getByRole("button", { name: /Show interest, principal, and balance/ }).click();
  await expect(page.locator("#scheduleRows tr").first().locator("[data-schedule-detail='true']").first()).toBeVisible();
  await expect(page.locator("#scheduleRows tr").first().getByRole("button", { name: /Hide interest, principal, and balance/ })).toHaveAttribute("aria-expanded", "true");
  await page.locator("#scheduleRows tr").first().getByRole("button", { name: /Hide interest, principal, and balance/ }).click();
  await expect(page.locator("#scheduleRows tr").first().locator("[data-schedule-detail='true']").first()).toBeHidden();
  await page.locator("#scheduleJumpLinks").getByText("Target changes").click();
  await expect.poll(() => page.evaluate(() => document.activeElement && document.activeElement.id)).toBe("scheduleFirstTargetChange");
  await expect(page.locator("#scheduleFirstTargetChange")).toHaveAttribute("aria-label", /Month/);
  await expect.poll(() => page.locator("#scheduleFirstTargetChange").evaluate((row) => {
    const rect = row.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  })).toBe(true);
});

test("mobile sample mode prioritizes the sample payoff plan action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Load example" }).click();

  await expect(page.locator("#mobilePayoffJump")).toBeVisible();
  await expect(page.locator("#mobilePayoffJump")).toHaveText("View sample payoff plan");
  await expect(page.locator("#startEntryButton")).toBeHidden();
  await expect(page.locator("#sampleEnterCardsButton")).toBeVisible();
  await expect(page.locator("#sampleEnterCardsButton")).toHaveClass(/secondary/);
  await expect(page.locator("#keepSampleButton")).toBeHidden();
});

test("desktop sample mode removes redundant example and share CTAs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await page.getByRole("button", { name: "Load example" }).click();

  await expect(page.locator("#sampleButton")).toBeHidden();
  await expect(page.locator("#sampleShareNote")).toBeHidden();
  await expect(page.locator("#copyActionsHelp")).toContainText("Sample plan only");
  await expect(page.locator("#resultEnterCardsButton")).toBeVisible();
});

test("try plus 50 action confirms the change and supports undo", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Card name" }).fill("Visa");
  await page.getByRole("spinbutton", { name: "Visa balance" }).fill("1000");
  await page.getByRole("spinbutton", { name: "Visa APR" }).fill("12");
  await page.getByRole("spinbutton", { name: "Visa minimum payment" }).fill("50");
  await page.getByRole("spinbutton", { name: "Extra monthly payment" }).fill("200");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();

  await page.getByRole("button", { name: "Try +$50/mo" }).click();
  await expect(page.getByRole("spinbutton", { name: "Extra monthly payment" })).toHaveValue("250");
  await expect(page.locator("#boostExtraStatus")).toContainText("Extra payment is now $250/mo");
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  await expect(page.locator("#boostExtraButton")).toBeFocused();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("spinbutton", { name: "Extra monthly payment" })).toHaveValue("200");
  await expect(page.locator("#boostExtraStatus")).toContainText("reverted to $200/mo");
});

test("card row action labels include the debt name", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(sharedUrl({
    v: 1,
    method: "avalanche",
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    cards: [
      { id: "card-1", name: "Citi Costco", balance: 22096, apr: 24.74, minimum: 677 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1"]
  }));

  await expect(page.getByRole("button", { name: "Add promo APR for Citi Costco" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Citi Costco" })).toBeVisible();
  await page.getByRole("button", { name: "Add promo APR for Citi Costco" }).click();
  await expect(page.getByRole("button", { name: "Hide promo APR for Citi Costco" })).toBeVisible();
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
