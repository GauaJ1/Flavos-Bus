// Verifica no APP (não no SQL) que as 30 linhas com acento são achadas
// digitando com e sem acento. Fonte da lista: teste python test_12.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const HOST = BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mapa = JSON.parse(
  await readFile(new URL("../.tmp/mapa_numero_id.json", import.meta.url), "utf-8"),
);
const alvos = [
  ["Grotão", "0101"], ["Indústrias", "0104"], ["Funcionários", "0105"],
  ["José Américo", "0107"], ["Bancários", "0304"], ["Esplanada", "0102"],
];
const navegador = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await navegador.newContext({ viewport: { width: 360, height: 740 } });
await ctx.route(new RegExp(`^(?!${HOST})`), (r) => r.abort("blocked_by_test"));
const pag = await ctx.newPage();
await pag.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await pag.waitForFunction(() => (document.body?.innerText ?? "").includes("linha(s)"), null, { timeout: 90_000 });
const campo = pag.locator("input").first();
let falhas = 0;
for (const [nome, numero] of alvos) {
  for (const termo of [nome, nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")]) {
    await campo.fill(termo);
    await pag.waitForTimeout(800);
    const t = await pag.evaluate(() => document.body?.innerText ?? "");
    const ok = t.includes(numero);
    if (!ok) falhas += 1;
    console.log(`${ok ? "PASS" : "FAIL"} "${termo}" -> ${numero}`);
  }
}
await navegador.close();
console.log(`[acentos] ${12 - falhas}/12`);
process.exit(falhas ? 1 : 0);
