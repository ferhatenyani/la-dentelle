// Dev helper: node scripts/shot.mjs <path> <out.png> [desktop|mobile] [fullPage=1] [setupJs]
import { chromium, devices } from "@playwright/test";
const [, , path = "/", out = "shot.png", mode = "desktop", full = "1", setup] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext(
  mode === "mobile" ? { ...devices["Pixel 7"] } : mode === "tablet" ? { viewport: { width: 768, height: 1024 } } : { viewport: { width: 1440, height: 900 } },
);
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const base = process.env.BASE ?? "http://localhost:3100";
if (setup) {
  await page.goto(base + "/menu");
  await page.evaluate(setup);
}
await page.goto(base + path, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.screenshot({ path: out, fullPage: full === "1" });
const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
console.log(`saved ${out}; horizontal overflow: ${overflow}px`);
if (errors.length) console.log("ERRORS:\n" + errors.slice(0, 8).join("\n"));
await browser.close();
