// Dev helper: lists elements wider than the viewport. node scripts/find-overflow.mjs /path 1024
import { chromium } from "@playwright/test";
const [, , path = "/", width = "1024"] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: 900 } });
const base = process.env.BASE ?? "http://localhost:3100";
if (process.env.CART) {
  await p.goto(base + "/menu");
  await p.evaluate((cart) => localStorage.setItem("ladentelle:v1", JSON.stringify({ version: 1, cart: JSON.parse(cart), favorites: [], users: [], sessionUserId: null, orders: [] })), process.env.CART);
}
await p.goto(base + path, { waitUntil: "networkidle" });
const res = await p.evaluate(() => {
  const vw = window.innerWidth;
  return [...document.querySelectorAll("body *")]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.right > vw + 1 && r.width > 0)
    .slice(0, 8)
    .map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 80)} right=${Math.round(r.right)}`);
});
console.log(res.join("\n") || "no overflow");
await b.close();
