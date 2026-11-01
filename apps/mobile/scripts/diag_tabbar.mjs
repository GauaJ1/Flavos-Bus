// Diag: qual é o role/tag dos itens da tab bar?
import { chromium } from "playwright";

const nAp = await chromium.launch({ channel: "msedge" });
const ctx = await nAp.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:8081/", { timeout: 120000 });
await page.waitForTimeout(6000);
const info = await page.evaluate(() => {
  const alvo = [...document.querySelectorAll("div")].find((d) => d.textContent === "Sobre" && d.children.length === 0);
  if (!alvo) return "texto Sobre não achado";
  let el = alvo;
  const trilha = [];
  for (let i = 0; i < 6 && el; i++) {
    trilha.push(`${el.tagName}[role=${el.getAttribute("role")}] aria=${el.getAttribute("aria-label") ?? ""} classe=${(el.className ?? "").slice(0, 20)}`);
    el = el.parentElement;
  }
  const roles = [...document.querySelectorAll("[role]")].map((e) => e.getAttribute("role"));
  return { trilha, contagem: roles.reduce((a, r) => ({ ...a, [r]: (a[r] ?? 0) + 1 }), {}) };
});
console.log(JSON.stringify(info, null, 1));
await nAp.close();
