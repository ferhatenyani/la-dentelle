// Dev helper: prints console errors (e.g. hydration diffs) for a route.
// MSYS_NO_PATHCONV=1 node scripts/hydration-check.mjs /menu [desktop|mobile]
import { chromium, devices } from "@playwright/test";

const [, , path = "/", mode = "desktop"] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(mode === "mobile" ? devices["Pixel 7"] : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const lines = m.text().split("\n");
  const diff = lines.filter((l) => /^\s*[+-]\s/.test(l));
  console.log(lines[0].slice(0, 200));
  if (diff.length) console.log(diff.slice(0, 20).join("\n"));
});
page.on("pageerror", (e) => {
  const lines = String(e.stack ?? e.message).split("\n");
  const diff = lines.filter((l) => /^\s*[+-]\s/.test(l));
  console.log(diff.length ? diff.slice(0, 25).join("\n") : lines.slice(0, 40).join("\n"));
});
await page.goto((process.env.BASE ?? "http://localhost:3100") + path, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await browser.close();
