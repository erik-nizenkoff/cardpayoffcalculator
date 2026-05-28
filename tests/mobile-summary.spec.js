const { expect, test } = require("@playwright/test");

function sharedStateUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/#q=" + encoded;
}

test("mobile sticky summary hides while editing and restores after focus leaves", async ({ page }) => {
  await page.goto(sharedStateUrl({
    v: 1,
    method: "avalanche",
    extraPayment: 0,
    paymentMode: "extra",
    paymentAmount: 0,
    startMonth: "2026-05",
    targetMonth: "",
    cards: [
      { id: "card-1", name: "Visa", balance: 8500, apr: 22.99, minimum: 170 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: []
  }));

  const mobileSummary = page.locator("#mobileSummaryBar");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();
  await expect(mobileSummary).toBeVisible();

  await page.getByRole("button", { name: "Expand card details" }).click();
  await page.getByRole("spinbutton", { name: "Visa balance" }).click();

  await expect(page.locator("body")).toHaveClass(/input-focused/);
  await expect(mobileSummary).toBeHidden();

  await page.getByRole("button", { name: "Collapse card details" }).click();

  await expect(page.locator("body")).not.toHaveClass(/input-focused/);
  await expect(mobileSummary).toBeVisible();
  await expect(mobileSummary).toContainText("Feb 2034");

  const pageWidths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(pageWidths.scrollWidth).toBe(pageWidths.clientWidth);
});
