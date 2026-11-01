// Diagnostic: what happens when opening /galeria (or /) on the dev server.
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const rota = process.argv[3] ?? "/galeria";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await contexto.newPage();
await pagina.addInitScript(() => {
  window.__erros = [];
  const orig = console.error;
  console.error = (...a) => {
    if (String(a[0]).includes("text node")) {
      window.__erros.push(new Error().stack?.slice(0, 1200) ?? "sem pilha");
    }
    orig.apply(console, a);
  };
});
pagina.on("console", (m) => {
  const extras = m.args().slice(1).map((a) => {
    try { return a.jsonValue ? a.jsonValue() : String(a); } catch { return "?"; }
  });
  const pilha = extras.length > 0 ? ` | pilha: ${String(extras.join(" ")).slice(0, 600)}` : "";
  console.log(`[console:${m.type()}] ${m.text().slice(0, 300)}${pilha}`);
});
pagina.on("pageerror", (e) => console.log(`[pageerror] ${String(e).slice(0, 500)}`));
pagina.on("response", (r) => {
  if (r.status() >= 400) console.log(`[http ${r.status()}] ${r.url().slice(0, 200)}`);
});
try {
  const resp = await pagina.goto(`${BASE}${rota}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log(`[goto] status=${resp?.status()}`);
  let texto = "";
  for (let i = 0; i < 4 && texto.length < 200; i += 1) {
    await pagina.waitForTimeout(30_000);
    texto = await pagina.evaluate(() => document.body?.innerText ?? "");
  }
  const htmlHead = await pagina.evaluate(() => document.documentElement.innerHTML.slice(0, 400));
  console.log(`[body] chars=${texto.length}\n${texto.slice(0, 400)}`);
  console.log(`[html-head]\n${htmlHead}`);
} catch (e) {
  console.log(`[erro] ${e.message}`);
}
await browser.close();
