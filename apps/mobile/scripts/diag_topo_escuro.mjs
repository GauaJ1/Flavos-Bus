// Onde comeca o fundo escuro? elemento/estilos do top-strip (0..20 CSS px).
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const contexto = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
const pagina = await contexto.newPage();
await pagina.goto(`${BASE}/galeria`, { waitUntil: "domcontentloaded", timeout: 120_000 });
await pagina.waitForTimeout(30_000);
const info = await pagina.evaluate(() => {
  const el = (sel) => {
    const n = document.querySelector(sel);
    if (!n) return `${sel}: ausente`;
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    return `${sel}: bg=${cs.backgroundColor} rect=top=${r.top} h=${r.height}`;
  };
  const p10 = document.elementFromPoint(195, 8);
  const p30 = document.elementFromPoint(195, 30);
  return [
    el("html"),
    el("body"),
    el("#root"),
    el("#root > div"),
    `elementFromPoint(195,8)=${p10?.tagName}.${p10?.className} bg=${p10 ? getComputedStyle(p10).backgroundColor : "-"}`,
    `elementFromPoint(195,30)=${p30?.tagName}.${p30?.className} bg=${p30 ? getComputedStyle(p30).backgroundColor : "-"}`,
  ].join("\n");
});
console.log(info);
await browser.close();
