// Varredura das 84 linhas SEM recarregar página: abre o app uma vez (banco
// importado para o OPFS uma única vez) e navega por deep link com history
// pushState + clique de SPA. Assim cada linha custa ~1s, não ~15s.
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8282";
const mapa = JSON.parse(
  await readFile(new URL("../.tmp/mapa_numero_id.json", import.meta.url), "utf-8"),
);
const numeros = Object.keys(mapa);

const navegador = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await navegador.newContext({ viewport: { width: 360, height: 740 } });
await ctx.route(/^(?!http:\/\/127\.0\.0\.1:(8081|8282))/, (r) => r.abort("blocked_by_test"));
const pag = await ctx.newPage();
const erros = [];
pag.on("pageerror", (e) => erros.push(String(e)));

// 1) abre uma vez
await pag.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await pag.waitForFunction(() => (document.body?.innerText ?? "").includes("84 linha(s)"), null, {
  timeout: 90_000,
});
console.log("[84] app aberto, banco importado");

const problemas = [];
let ok = 0;
const inicio = Date.now();

for (const [i, numero] of numeros.entries()) {
  const id = mapa[numero];
  const antes = erros.length;
  try {
    // navegação SPA: pushState + evento popstate trigger do expo-router
    await pag.evaluate((caminho) => {
      window.history.pushState({}, "", caminho);
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    }, `/linha/${id}`);

    await pag.waitForFunction((n) => (document.body?.innerText ?? "").includes(n), numero, {
      timeout: 20_000,
    });
    // espera o quadro (ou o estado vazio) para não ler antes do efeito
    await pag
      .waitForFunction(
        () => {
          const t = document.body?.innerText ?? "";
          return t.includes("viagem(ns)") || t.includes("Sem horários nesse tipo de dia");
        },
        null,
        { timeout: 20_000 },
      )
      .catch(() => undefined);
    const t = await pag.evaluate(() => document.body?.innerText ?? "");
    const faltas = [];
    if (!t.includes("teóricos")) faltas.push("aviso");
    if (!/feed \d{4}-\d{2}-\d{2}/.test(t)) faltas.push("feed");
    if (!t.includes("viagem(ns)") && !t.includes("Sem horários nesse tipo de dia")) faltas.push("quadro");
    if (!t.includes("voltar à busca")) faltas.push("voltar");
    if (erros.length > antes) faltas.push("erro:" + erros[erros.length - 1].slice(0, 60));
    if (faltas.length === 0) ok += 1;
    else problemas.push({ numero, id, faltas });
  } catch (e) {
    problemas.push({ numero, id, faltas: ["timeout:" + String(e).split("\n")[0].slice(0, 50)] });
  }
  if ((i + 1) % 20 === 0) {
    console.log(`[84] ${i + 1}/${numeros.length} ok=${ok} (${((Date.now() - inicio) / 1000).toFixed(0)}s)`);
  }
}

await navegador.close();
const linhas = [
  "# Varredura das 84 linhas do feed (export estático + navegação SPA)",
  "",
  `Data: ${new Date().toISOString()} · **${ok}/${numeros.length} OK** · ${((Date.now() - inicio) / 1000).toFixed(0)}s`,
  "",
  problemas.length === 0
    ? `Todas as ${numeros.length} linhas abrem com: aviso teórico, data do feed, quadro de horários (ou estado vazio honesto) e link de voltar — sem erro de página.`
    : "| Linha | route_id | Falta |\n|---|---|---|\n" +
      problemas.map((p) => `| ${p.numero} | ${p.id} | ${p.faltas.join(", ")} |`).join("\n"),
];
await writeFile(
  new URL("../../../docs/design/telas/varredura_84_linhas.md", import.meta.url),
  linhas.join("\n") + "\n",
  "utf-8",
);
console.log(`[84] FIM ok=${ok}/${numeros.length} problemas=${problemas.length}`);
if (problemas.length) console.log(JSON.stringify(problemas.slice(0, 8)));
process.exit(problemas.length ? 1 : 0);
