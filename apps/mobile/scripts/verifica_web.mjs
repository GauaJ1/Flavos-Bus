// Checklist funcional das telas no web de depuração (Playwright + Edge).
// Complementa as capturas PNG: verifica CONTEÚDO real renderizado — rótulos,
// aviso permanente, resultado da busca por "509", próxima saída e quadro da
// linha de referência. Saída: docs/design/telas/relatorio_runtime.md
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8081";
const navegador = await chromium.launch({ channel: "msedge", headless: true });
const achados = [];
function registro(check, ok, detalhe) {
  achados.push({ check, ok, detalhe });
  console.log(`${ok ? "PASS" : "FAIL"} ${check}${detalhe ? ` — ${detalhe}` : ""}`);
}

const contexto = await navegador.newContext({
  viewport: { width: 360, height: 740 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));

/** Espera o corpo conter TODOS os trechos (não confia em tempo fixo). */
async function esperarTextos(termos, timeoutMs = 60_000) {
  await pagina.waitForFunction(
    (lista) => {
      const texto = document.body?.innerText ?? "";
      return lista.every((t) => texto.includes(t));
    },
    termos,
    { timeout: timeoutMs },
  );
  return pagina.evaluate(() => document.body?.innerText ?? "");
}

// 1) busca: aviso presente, digitar 509 encontra a linha
await pagina.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
const textoBusca = await esperarTextos(["Flavos Bus", "linha(s)"]);
registro("busca: aviso teórico visível", textoBusca.includes("teóricos"), "");
const campo = pagina.locator("input");
await campo.first().fill("509");
await pagina.waitForTimeout(1_500);
const textoResultado = await pagina.evaluate(() => document.body?.innerText ?? "");
registro(
  "busca: 509 encontra João Agripino",
  textoResultado.includes("0509") && textoResultado.toLowerCase().includes("agripino"),
  "",
);
const semResultado = await pagina.evaluate(() => document.body?.innerText ?? "");
registro("busca: contagem de linhas exibida", /\d+ linha\(s\)/.test(semResultado), "");

// 2) detalhe por deep link: aviso, próxima, quadro (0509 — sem operadora no
// feed, o app oculta o campo: comportamento honesto esperado)
await pagina.goto(`${BASE}/linha/42029`, { waitUntil: "domcontentloaded", timeout: 90_000 });
let detalhe = "";
try {
  detalhe = await esperarTextos(["PRÓXIMA SAÍDA", "17:40", "feed 2026-10-29"]);
} catch {
  detalhe = await pagina.evaluate(() => document.body?.innerText ?? "");
}
registro("detalhe: aviso teórico no topo", detalhe.includes("teóricos"), "");
registro("detalhe: bloco próximo saída", detalhe.includes("PRÓXIMA SAÍDA"), "");
registro("detalhe: horários extremos do quadro", detalhe.includes("05:00") && detalhe.includes("17:40"), "");
registro("detalhe: sem operadora ausente (não inventa)", !/operadora declarada \d{4}/.test(detalhe), "");
registro("detalhe: data da fonte (feed)", /feed \d{4}-\d{2}-\d{2}/.test(detalhe), "");
registro("detalhe: chips de dia da semana", ["Seg", "Sáb", "Dom"].every((d) => detalhe.includes(d)), "");

// 3) linha COM operadora declarada (0003 Jaguaribe — feed 42001)
await pagina.goto(`${BASE}/linha/42001`, { waitUntil: "domcontentloaded", timeout: 90_000 });
let detalheOperadora = "";
try {
  detalheOperadora = await esperarTextos(["PRÓXIMA SAÍDA", "Operadora declarada"], 45_000);
} catch {
  detalheOperadora = await pagina.evaluate(() => document.body?.innerText ?? "");
}
registro(
  "detalhe: operadora declarada (c/ ano) na linha que tem o dado",
  /Operadora declarada \d{4}/.test(detalheOperadora),
  "",
);
registro("runtime: nenhum pageerror", erros.length === 0, erros.join(" | ").slice(0, 200));

const linhas = [
  "# Verificação runtime das telas (web de depuração, Edge/Playwright)",
  "",
  `Data: ${new Date().toISOString()} · viewport 360x740@2x · claro`,
  "",
  "| Check | Resultado |",
  "|---|---|",
  ...achados.map((a) => `| ${a.check} | ${a.ok ? "PASS" : "FAIL"} |`),
  "",
  "Limitação honesta: conferência pixel a pixel das capturas PNG fica para",
  "humano ou modelo com entrada de imagem; aqui o conteúdo é verificado em",
  "runtime (texto + ausência de erros de console).",
];
await writeFile(
  new URL("../../../docs/design/telas/relatorio_runtime.md", import.meta.url),
  linhas.join("\n") + "\n",
  "utf-8",
);
await navegador.close();
const falhas = achados.filter((a) => !a.ok).length;
console.log(`[verifica] fim: ${achados.length - falhas}/${achados.length} pass`);
process.exit(falhas === 0 ? 0 : 1);
