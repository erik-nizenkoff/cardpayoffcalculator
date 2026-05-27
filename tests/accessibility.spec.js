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
});
