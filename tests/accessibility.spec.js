const { AxeBuilder } = require("@axe-core/playwright");
const { expect, test } = require("@playwright/test");

function seriousViolations(results) {
  return results.violations
    .filter((violation) => ["critical", "serious"].includes(violation.impact))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(" "))
    }));
}

function sharedUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/?q=" + encoded + "#monthPlan";
}

test.describe("accessibility smoke", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("homepage has no serious automated accessibility violations", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(seriousViolations(results)).toEqual([]);
  });

  test("privacy page has no serious automated accessibility violations", async ({ page }) => {
    await page.goto("/privacy.html");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(seriousViolations(results)).toEqual([]);
  });

  test("shared month plan has no serious automated accessibility violations", async ({ page }) => {
    await page.goto(sharedUrl({
      v: 1,
      method: "avalanche",
      paymentMode: "extra",
      paymentAmount: 200,
      startMonth: "2026-05",
      cards: [
        { id: "card-1", name: "Visa", balance: 1000, apr: 12, minimum: 50 },
        { id: "card-2", name: "Store Card", balance: 1200, apr: 24, minimum: 60 }
      ],
      loans: [],
      optionScenarios: [],
      customOrder: ["card-1", "card-2"]
    }));
    await expect(page.locator("#monthPlan")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Month 1 Payment Breakdown" })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(seriousViolations(results)).toEqual([]);
    expect(results.violations.some((violation) => violation.id === "landmark-unique")).toBe(false);
  });
});
