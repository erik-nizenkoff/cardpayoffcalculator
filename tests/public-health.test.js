const assert = require("node:assert/strict");

const bases = (process.env.PUBLIC_BASE_URLS || process.env.PUBLIC_BASE_URL || "https://cardpayoffcalculator.com,https://cardpayoffcalculator.vercel.app")
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const checks = [
  {
    path: "/",
    type: "text",
    includes: "<title>Credit Card and Debt Payoff Calculator"
  },
  {
    path: "/privacy.html",
    type: "text",
    includes: "<h1>Privacy</h1>"
  },
  {
    path: "/robots.txt",
    type: "text",
    includes: "Sitemap:"
  },
  {
    path: "/sitemap.xml",
    type: "text",
    includes: "<urlset"
  },
  {
    path: "/favicon.ico",
    type: "binary"
  }
];

async function checkUrl(base, check) {
  const url = base + check.path;
  const response = await fetch(url, { redirect: "follow" });
  assert.equal(response.status, 200, `${url} returned ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length > 0, `${url} returned an empty response`);

  if (check.type === "text") {
    const body = bytes.toString("utf8");
    assert(body.includes(check.includes), `${url} did not include ${check.includes}`);
  }

  console.log(`ok ${response.status} ${url} (${bytes.length} bytes)`);
}

(async () => {
  for (const base of bases) {
    for (const check of checks) {
      await checkUrl(base, check);
    }
  }
  console.log("public health checks passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
