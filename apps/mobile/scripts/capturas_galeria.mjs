// CAPTURAS + CHECAGENS OBJETIVAS da galeria (A4 do dono):
// - um PNG por parte/tema/tamanho: galeria_<w>x<h>_<claro|escuro>_p<N>.png
//   (fullPage sempre; cada parte e curta o suficiente p/ nao exagerar).
// - checagens impressas por pagina:
//   (a) sem overflow horizontal (documentElement.scrollWidth <= innerWidth)
//   (b) todo [role=tab],[role=button] e input com largura E altura >= 44
//   (c) os titulos de secao esperados da parte existem no DOM
//   (d) SearchBar variante campo aceita digitacao (fill "abc" e le o valor)
//   (e) 0 erros de console
// Codigo de saida != 0 se algo falhar.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const PASTA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".claude");

const TITULOS_POR_PARTE = {
  1: ["LineBadge (regra 3:1 automática — pares REAIS do feed)", "TheoreticalBadge (único usuário das cores theoretical*)"],
  2: ["SearchBar (botão e campo)", "DaySegmented (3 estados, toque >= 44)"],
  3: ["NextDepartureCard (3 estados, agora fixo = 14:23 Fortaleza)", "StopRow (1 linha e 8 linhas com +X)", "TimelineStop (6 paradas, atual na 2ª)"],
  4: ["Skeleton (sem animação em loop)", "EmptyState", "BottomSheet (web: toque na alça · nativo: arrasto)"],
};

const TAMANHOS = [
  { w: 390, h: 844 },
  { w: 360, h: 640 },
];
const TEMAS = ["claro", "escuro"];
const PARTES = [1, 2, 3, 4];

await mkdir(PASTA, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

let falhou = false;
const linhas = [];

for (const { w, h } of TAMANHOS) {
  for (const tema of TEMAS) {
    const contexto = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      colorScheme: tema === "escuro" ? "dark" : "light",
    });
    for (const parte of PARTES) {
      const pagina = await contexto.newPage();
      const erros = [];
      pagina.on("pageerror", (e) => erros.push(`pageerror: ${e}`));
      pagina.on("console", (m) => {
        if (m.type() === "error") erros.push(`console: ${m.text().slice(0, 200)}`);
      });
      const nome = `galeria_${w}x${h}_${tema}_p${parte}.png`;
      let carregou = false;
      for (let t = 0; t < 4 && !carregou; t += 1) {
        try {
          await pagina.goto(`${BASE}/galeria?parte=${parte}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
          await pagina.waitForTimeout(t === 0 ? 30_000 : 12_000);
          const corpo = await pagina.evaluate(() => document.body?.innerText ?? "");
          carregou = TITULOS_POR_PARTE[parte].every((s) => corpo.includes(s)) || corpo.length > 100;
        } catch (e) {
          erros.push(`goto: ${e.message?.slice(0, 150)}`);
        }
      }

      // (a) overflow horizontal
      const scroll = await pagina.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      const okOverflow = scroll.scrollWidth <= scroll.innerWidth + 1;

      // (c) titulos esperados
      const corpo = await pagina.evaluate(() => document.body?.innerText ?? "");
      const faltando = TITULOS_POR_PARTE[parte].filter((s) => !corpo.includes(s));

      // (b) alvos de toque >= 44 nos DOIS eixos
      const toque_falho = await pagina.evaluate(() => {
        const nodes = [...document.querySelectorAll('[role="tab"], [role="button"], input')];
        return nodes
          .map((n) => ({ r: n.getBoundingClientRect(), rotulo: (n.getAttribute("aria-label") ?? n.textContent ?? "input").slice(0, 28) }))
          .filter((x) => !(x.r.width >= 43.5 && x.r.height >= 43.5))
          .map((x) => `${x.rotulo} (${Math.round(x.r.width)}x${Math.round(x.r.height)})`);
      });
      const okToque = toque_falho.length === 0;

      // (d) digitacao no campo (so existe input na parte 2)
      let okDigitacao = "n/a";
      if (parte === 2) {
        const input = pagina.locator('input[placeholder="Buscar linha ou parada"]').first();
        try {
          await input.fill("abc");
          const valor = await input.inputValue();
          okDigitacao = valor === "abc" ? "ok" : `valor=${valor}`;
          await input.fill("");
        } catch (e) {
          okDigitacao = `falhou: ${e.message?.slice(0, 80)}`;
        }
      }

      await pagina.screenshot({ path: join(PASTA, nome), fullPage: true });
      const semErro = erros.length === 0;
      const okChecks = okOverflow && okToque && faltando.length === 0 && semErro;
      const okPagina = okChecks && (okDigitacao === "n/a" || okDigitacao === "ok");
      if (!okPagina) falhou = true;
      const linha =
        `${nome}: overflow=${okOverflow ? "ok" : `${scroll.scrollWidth}>${scroll.innerWidth}`} | ` +
        `toque=${okToque ? "ok (todos >=44)" : `FALHA: ${toque_falho.join("; ")}`} | ` +
        `titulos=${faltando.length === 0 ? "ok" : `FALTAM: ${faltando.join(" | ")}`} | ` +
        `digitacao=${okDigitacao} | console=${semErro ? "0" : erros.join(" | ")}`;
      linhas.push(linha);
      await writeFile(join(PASTA, `${nome}.check.txt`), `${linha}\n`, "utf-8");
      await pagina.close();
    }
    await contexto.close();
  }
}
await browser.close();
for (const l of linhas) console.log(l);
console.log(falhou ? "RESULTADO: HOUVE FALHAS" : "RESULTADO: TUDO OK");
process.exit(falhou ? 1 : 0);
