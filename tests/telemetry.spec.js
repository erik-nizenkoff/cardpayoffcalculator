const { expect, test } = require("@playwright/test");

const SUPABASE_CALCULATIONS_URL = "https://ofhgwcbcljlmvuqvwoax.supabase.co/rest/v1/calculations";

function sharedStateUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/?q=" + encoded;
}

async function keepTelemetryAvailable(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "doNotTrack", {
      configurable: true,
      get() {
        return "0";
      }
    });
    Object.defineProperty(window, "doNotTrack", {
      configurable: true,
      get() {
        return "0";
      }
    });
  });
}

test("default sample load does not send calculation telemetry", async ({ page }) => {
  const requests = [];
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_CALCULATIONS_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto("/");
  await page.waitForTimeout(750);

  expect(requests).toEqual([]);
});

test("telemetry excludes debt nicknames and opt-out stops later sends", async ({ page }) => {
  const requests = [];
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_CALCULATIONS_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto(sharedStateUrl({
    v: 1,
    method: "avalanche",
    extraPayment: 0,
    paymentMode: "extra",
    paymentAmount: 0,
    startMonth: "2026-05",
    targetMonth: "",
    cards: [
      { id: "card-1", name: "Private Bank Card", balance: 8500, apr: 22.99, minimum: 170 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: []
  }));
  await page.waitForTimeout(250);
  requests.length = 0;

  await page.getByRole("button", { name: "Expand card details" }).click();
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("9100");

  await expect.poll(() => requests.length).toBeGreaterThan(0);
  const body = requests.at(-1);
  const serialized = JSON.stringify(body);

  expect(serialized).not.toContain("Private Bank Card");
  expect(body.input_state.cards[0]).toMatchObject({
    id: "card-1",
    index: 1,
    balance: 9100,
    apr: 22.99,
    minimum: 170
  });

  requests.length = 0;
  await page.getByText("Privacy and data").click();
  await page.getByLabel("Do not send calculation telemetry").check();
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("9200");
  await page.waitForTimeout(1000);

  expect(requests).toEqual([]);
});
