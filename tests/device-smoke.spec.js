const { expect, test } = require("@playwright/test");

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
];

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
