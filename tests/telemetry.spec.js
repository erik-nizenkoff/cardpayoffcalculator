const { expect, test } = require("@playwright/test");

const SUPABASE_CALCULATIONS_URL = "https://ofhgwcbcljlmvuqvwoax.supabase.co/rest/v1/calculations";
const SUPABASE_FEEDBACK_URL = "https://ofhgwcbcljlmvuqvwoax.supabase.co/rest/v1/feedback_reports";

function sharedStateUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/#q=" + encoded;
}

function legacySharedStateUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/?q=" + encoded;
}

function sharedMonthPlanUrl(state) {
  const encoded = Buffer.from(JSON.stringify(state), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return "/?q=" + encoded + "#monthPlan";
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

async function forceDoNotTrack(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "doNotTrack", {
      configurable: true,
      get() {
        return "1";
      }
    });
    Object.defineProperty(window, "doNotTrack", {
      configurable: true,
      get() {
        return "1";
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

test("do not track locks telemetry opt-out with an explanation", async ({ page }) => {
  await forceDoNotTrack(page);
  await page.goto("/");

  const optOut = page.getByLabel("Privacy option: Do not use my calculator inputs to improve this site");
  await expect(optOut).toBeChecked();
  await expect(optOut).toBeDisabled();
  await expect(page.getByText("Your browser's Do Not Track setting is already opting you out of calculation telemetry.")).toBeVisible();
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
  await page.getByLabel("Privacy option: Do not use my calculator inputs to improve this site").check();
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("9200");
  await page.waitForTimeout(1000);

  expect(requests).toEqual([]);
});

test("shared month plan opt-out stops quick action telemetry", async ({ page }) => {
  const requests = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_CALCULATIONS_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto(sharedMonthPlanUrl({
    v: 1,
    method: "avalanche",
    extraPayment: 200,
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    targetMonth: "",
    cards: [
      { id: "card-1", name: "Private Bank Card", balance: 8500, apr: 22.99, minimum: 170 },
      { id: "card-2", name: "Store Card", balance: 1200, apr: 28.99, minimum: 45 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1", "card-2"]
  }));
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Do not save calculation data from this plan");
  await expect(page.locator("#sharedPlanMonthNotice")).toContainText("Applies to edits and what-if buttons.");
  requests.length = 0;

  await page.locator("#sharedMonthTelemetryOptOut").check();
  await page.getByRole("button", { name: "Try +$50/mo" }).click();
  await page.waitForTimeout(1000);

  expect(requests).toEqual([]);
});

test("shared plan quick actions wait for manual edits before telemetry", async ({ page }) => {
  const requests = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_CALCULATIONS_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto(sharedMonthPlanUrl({
    v: 1,
    method: "avalanche",
    extraPayment: 200,
    paymentMode: "extra",
    paymentAmount: 200,
    startMonth: "2026-05",
    targetMonth: "",
    cards: [
      { id: "card-1", name: "Private Bank Card", balance: 8500, apr: 22.99, minimum: 170 },
      { id: "card-2", name: "Store Card", balance: 1200, apr: 28.99, minimum: 45 }
    ],
    loans: [],
    optionScenarios: [],
    customOrder: ["card-1", "card-2"]
  }));
  requests.length = 0;

  await page.getByRole("button", { name: "Try +$50/mo" }).click();
  await page.waitForTimeout(1000);
  expect(requests).toEqual([]);

  await page.locator("#cardInputs").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Expand card details" }).first().click();
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("8600");

  await expect.poll(() => requests.length).toBeGreaterThan(0);
});

test("shared links preserve loan names when reopened", async ({ page }) => {
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
    loans: [
      { id: "loan-1", name: "Auto Loan", balance: 12000, rate: 6.5, payment: 300, term: 48 }
    ],
    optionScenarios: [],
    customOrder: []
  }));

  await page.locator("#loanSection summary").click();
  await expect(page.getByRole("textbox", { name: "Auto Loan loan name" })).toHaveValue("Auto Loan");
});

test("legacy query shared links load and are removed from the visible URL", async ({ page }) => {
  await page.goto(legacySharedStateUrl({
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

  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();
  const url = new URL(page.url());
  expect(url.searchParams.get("q")).toBeNull();
  expect(url.hash).toBe("");
});

test("valid calculator edits do not auto-write share state into the page URL", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Card name" }).fill("Private Bank Card");
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("8500");
  await page.getByRole("spinbutton", { name: "Private Bank Card APR" }).fill("22.99");
  await page.getByRole("spinbutton", { name: "Private Bank Card minimum payment" }).fill("170");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();

  expect(new URL(page.url()).searchParams.get("q")).toBeNull();
});

test("feedback report defaults to no diagnostic input snapshot", async ({ page }) => {
  const requests = [];
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_FEEDBACK_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto("/");
  await page.getByRole("textbox", { name: "Card name" }).fill("Private Bank Card");
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("8500");
  await page.getByRole("spinbutton", { name: "Private Bank Card APR" }).fill("22.99");
  await page.getByRole("spinbutton", { name: "Private Bank Card minimum payment" }).fill("170");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();

  await page.getByRole("button", { name: "Report an issue" }).first().click();
  await expect(page.getByRole("dialog", { name: "Report an Issue" })).toBeVisible();
  await expect(page.getByText("Always sent:")).toBeVisible();
  await expect(page.getByText("Only if checked:")).toBeVisible();
  await expect(page.getByText("calculation telemetry opt-out does not block feedback submission")).toBeVisible();
  await expect(page.getByLabel("Attach current calculator inputs and result summary")).not.toBeChecked();
  await page.getByLabel("Issue or comment").fill("This is a general comment.");
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].input_state).toEqual({});
  expect(requests[0].result_summary).toEqual({});
  expect(requests[0].page_url).toBe("http://127.0.0.1:4173/");
  expect(JSON.stringify(requests[0])).not.toContain("Private Bank Card");
  await expect(page.getByText("Thanks, your report was sent.")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Report an Issue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close", exact: true })).toBeVisible();
});

test("feedback report can attach current diagnostic input snapshot", async ({ page }) => {
  const requests = [];
  await keepTelemetryAvailable(page);
  await page.route(SUPABASE_FEEDBACK_URL, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 201, body: "" });
  });

  await page.goto("/");
  await page.getByRole("textbox", { name: "Card name" }).fill("Private Bank Card");
  await page.getByRole("spinbutton", { name: "Private Bank Card balance" }).fill("8500");
  await page.getByRole("spinbutton", { name: "Private Bank Card APR" }).fill("22.99");
  await page.getByRole("spinbutton", { name: "Private Bank Card minimum payment" }).fill("170");
  await expect(page.locator(".hero-label", { hasText: "Debt-Free Date" })).toBeVisible();

  await page.getByRole("button", { name: "Report an issue" }).first().click();
  await expect(page.getByRole("dialog", { name: "Report an Issue" })).toBeVisible();
  await page.getByLabel("Type").selectOption("suggestion");
  await page.getByLabel("Issue or comment").fill("The payoff date looks worth double-checking.");
  await page.getByLabel(/Email address/).fill("tester@example.com");
  await expect(page.getByLabel("Attach current calculator inputs and result summary")).not.toBeChecked();
  await page.getByLabel("Attach current calculator inputs and result summary").check();
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toMatchObject({
    report_type: "suggestion",
    message: "The payoff date looks worth double-checking.",
    email: "tester@example.com",
    page_url: "http://127.0.0.1:4173/"
  });
  expect(JSON.stringify(requests[0].input_state)).not.toContain("Private Bank Card");
  expect(requests[0].input_state.cards[0]).toMatchObject({
    id: "card-1",
    index: 1,
    balance: 8500,
    apr: 22.99,
    minimum: 170
  });
  expect(requests[0].result_summary).toMatchObject({
    capped: false,
    startingBalance: 8500
  });
});

test("mobile feedback validation keeps the dialog header visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Report an issue" }).first().click();
  await expect(page.getByRole("dialog", { name: "Report an Issue" })).toBeVisible();
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect(page.locator("#feedbackMessage-error")).toContainText("Enter at least 5 characters.");
  await expect(page.locator("#feedbackDialog .feedback-head")).toBeVisible();
  await expect(page.locator("#feedbackDialog .feedback-actions")).toBeVisible();
  const headerStaysInsideDialog = await page.evaluate(() => {
    const dialog = document.querySelector("#feedbackDialog");
    const head = document.querySelector("#feedbackDialog .feedback-head");
    if (!dialog || !head) return false;
    const dialogRect = dialog.getBoundingClientRect();
    const headRect = head.getBoundingClientRect();
    return headRect.top >= dialogRect.top - 1 && headRect.bottom <= dialogRect.bottom + 1;
  });
  expect(headerStaysInsideDialog).toBe(true);
  const actionsStayInsideViewport = await page.evaluate(() => {
    const actions = document.querySelector("#feedbackDialog .feedback-actions");
    if (!actions) return false;
    const rect = actions.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight + 1;
  });
  expect(actionsStayInsideViewport).toBe(true);
});
