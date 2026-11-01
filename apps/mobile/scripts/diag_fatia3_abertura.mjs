// Diagnóstico: por que a lista de linhas não aparece?
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8081/";
const nApr = await chromium.launch({ channel: "msedge" });
const ctx = await nApr.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on("console", (m) => console.log(`[console.${m.type()}] ${m.text().slice(0, 400)}`));
page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.stack ?? e.message).slice(0, 900)}`));
await page.goto(BASE, { timeout: 120000 });
await page.waitForTimeout(9000);
console.log("URL:", page.url());
console.log("bodySlice:", (await page.evaluate(() => document.body.innerText.slice(0, 800))));
await page.screenshot({ path: "C:/Users/Usuario/Pictures/Flavos-Bus/.claude/diag_fatia3_abertura.png", fullPage: true });
await nApr.close();
