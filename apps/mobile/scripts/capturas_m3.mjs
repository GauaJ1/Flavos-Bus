// CAPTURAS + CHECAGENS OBJETIVAS da galeria M3 (Passo 9).
// - um PNG por tamanho/tema/parte: galeria_<w>x<h>_<claro|escuro>_p<N>.png
// - capturas dedicadas: nav_360x640_<3,4,5>destinos_<tema>.png e
//   nav_390x844_<3,4,5>destinos_<tema>.png e nav_verde_x_azul_<w>x<h>_<tema>.png
// - checagens: (a) sem overflow horizontal; (b) alvos >= 44 nos dois eixos
//   (ignora elementos com rect 0x0: telas ocultas montadas atrás);
//   (c) títulos de seção esperados; (d) busca aceita digitação;
//   (e) 0 erros de console.
// Código de saída != 0 se algo falhar.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const PASTA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".claude");

const TITULOS_POR_PARTE = {
  1: ["NavigationBar — 3 destinos (360×640)", "NavigationBar — 4 destinos", "NavigationBar — 5 destinos", "indicador VERDE × AZUL"],
  2: ["TopAppBar small (voltar + selo + nome + estrela)", "SearchBar M3 (botão e campo — 56dp, sem borda)", "Botões M3", "IconButton"],
  3: ["SegmentedButton (Útil / Sábado / Domingo)", "Chips M3 (filter ativo/inativo, assist, desabilitado)", "FilterChipRow (estrela = favoritas, Todas)"],
  4: ["ListItem (56 / 72 / 88 + selecionado)", "SectionHeader (labelLarge onSurfaceVariant, sem maiúsculas)"],
  5: ["LineBadge (regra 3:1 automática — pares REAIS do feed)", "TheoreticalBadge (único usuário das cores theoretical*)", "NextDepartureCard (3 estados, agora fixo = 14:23 Fortaleza)"],
  6: ["TimelineStop (origem = círculo, destino = quadrado, anel no meio)", "StopRow (1 linha e 8 linhas com +X)", "Skeleton (sem animação em loop)"],
  7: ["EmptyState", "BottomSheet M3 (docked: surfaceContainerLow, cantos 28, alça 32×4)"],
};

// Erros de console que NÃO são do nosso código: o worker do expo-sqlite/web
// (OPFS) não consegue abrir arquivo no navegador headless. Registrado como
// ruído conhecido — qualquer OUTRO erro continua falhando o teste.
const RUIDO_CONHECIDO = [/cannot create file/i, /sqlite/i, /OPFS/i, /Access to storage is not allowed/i];
const ehRuido = (txt) => RUIDO_CONHECIDO.some((r) => r.test(txt));

const TAMANHOS = [
  { w: 390, h: 844 },
  { w: 360, h: 640 },
];
const TEMAS = ["claro", "escuro"];
const PARTES = [1, 2, 3, 4, 5, 6, 7];

await mkdir(PASTA, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

let falhou = false;
const linhas = [];
const anotar = (l) => {
  linhas.push(l);
  console.log(l);
};

async function abrir(contexto, parte) {
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(`pageerror: ${e}`));
  pagina.on("console", (m) => {
    if (m.type() !== "error") return;
    const txt = m.text();
    if (ehRuido(txt)) return; // worker do sqlite no headless
    erros.push(`console: ${txt.slice(0, 200)}`);
  });
  let carregou = false;
  for (let t = 0; t < 4 && !carregou; t += 1) {
    try {
      await pagina.goto(`${BASE}/galeria?parte=${parte}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await pagina.waitForTimeout(t === 0 ? 25_000 : 12_000);
      const corpo = await pagina.evaluate(() => document.body?.innerText ?? "");
      carregou = (TITULOS_POR_PARTE[parte] ?? []).every((s) => corpo.includes(s)) || corpo.length > 100;
    } catch (e) {
      erros.push(`goto: ${e.message?.slice(0, 150)}`);
    }
  }
  return { pagina, erros, carregou };
}

const medirToques = (pagina) =>
  pagina.evaluate(() => {
    const nodes = [...document.querySelectorAll('[role="tab"], [role="button"], [role="adjustable"], input')];
    return nodes
      .map((n) => ({
        r: n.getBoundingClientRect(),
        rotulo: (n.getAttribute("aria-label") ?? n.textContent ?? "input").trim().slice(0, 32),
      }))
      .filter((x) => x.r.width > 0 && x.r.height > 0)
      .filter((x) => !(x.r.width >= 43.5 && x.r.height >= 43.5))
      .map((x) => `${x.rotulo} (${Math.round(x.r.width)}x${Math.round(x.r.height)})`);
  });

const medirNav = (pagina) =>
  pagina.evaluate(() => {
    const barras = [...document.querySelectorAll('[role="tablist"][aria-label="Navegação principal"]')];
    return barras.map((b) => {
      const r = b.getBoundingClientRect();
      const abas = [...b.querySelectorAll('[role="tab"]')].map((a) => {
        const ar = a.getBoundingClientRect();
        // o RN-Web não repassa props data-*: o indicador é o 1º filho, com
        // width/height inline (64/32). Medimos pela geometria real.
        const ind = a.firstElementChild;
        const ir = ind ? ind.getBoundingClientRect() : null;
        const label = a.lastElementChild;
        const lr = label ? label.getBoundingClientRect() : null;
        // o RN-Web não emite aria-selected: a seleção é lida pelo fundo do
        // indicador (transparente quando inativo).
        const fundo = ir ? getComputedStyle(ind).backgroundColor : "";
        const sel = !/rgba\(0, 0, 0, 0\)|transparent/.test(fundo);
        return {
          rotulo: (a.getAttribute("aria-label") ?? "").slice(0, 20),
          selected: sel,
          w: Math.round(ar.width),
          h: Math.round(ar.height),
          indW: ir ? Math.round(ir.width) : -1,
          indH: ir ? Math.round(ir.height) : -1,
          rotuloH: lr ? Math.round(lr.height) : -1,
        };
      });
      return { altura: Math.round(r.height), abas };
    });
  });

for (const { w, h } of TAMANHOS) {
  for (const tema of TEMAS) {
    const contexto = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      colorScheme: tema === "escuro" ? "dark" : "light",
    });
    for (const parte of PARTES) {
      const nome = `galeria_${w}x${h}_${tema}_p${parte}.png`;
      const { pagina, erros } = await abrir(contexto, parte);
      const scroll = await pagina.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      const okOverflow = scroll.scrollWidth <= scroll.innerWidth + 1;
      const corpo = await pagina.evaluate(() => document.body?.innerText ?? "");
      const faltando = (TITULOS_POR_PARTE[parte] ?? []).filter((s) => !corpo.includes(s));
      const toqueFalho = await medirToques(pagina);
      let okDigitacao = "n/a";
      if (parte === 2) {
        const input = pagina.locator('input[placeholder="Buscar linha ou parada"]').first();
        try {
          await input.fill("abc");
          okDigitacao = (await input.inputValue()) === "abc" ? "ok" : "valor errado";
          await input.fill("");
        } catch (e) {
          okDigitacao = `falhou: ${e.message?.slice(0, 60)}`;
        }
      }
      await pagina.screenshot({ path: join(PASTA, nome), fullPage: true });
      const semErro = erros.length === 0;
      const ok = okOverflow && toqueFalho.length === 0 && faltando.length === 0 && semErro && (okDigitacao === "n/a" || okDigitacao === "ok");
      if (!ok) falhou = true;
      const linha =
        `${nome}: overflow=${okOverflow ? "ok" : `${scroll.scrollWidth}>${scroll.innerWidth}`} | ` +
        `toque=${toqueFalho.length === 0 ? "ok (>=44)" : `FALHA: ${toqueFalho.join("; ")}`} | ` +
        `titulos=${faltando.length === 0 ? "ok" : `FALTAM: ${faltando.join(" | ")}`} | ` +
        `digitacao=${okDigitacao} | console=${semErro ? "0" : erros.join(" | ")}`;
      anotar(linha);
      await writeFile(join(PASTA, `${nome}.check.txt`), `${linha}\n`, "utf-8");
      await pagina.close();
    }

    // ---- capturas dedicadas da NavigationBar (parte 1) ----
    const { pagina: pg, erros: errosNav } = await abrir(contexto, 1);
    const barras = await medirNav(pg);
    barras.forEach((b, i) => {
      const act = b.abas.find((a) => a.selected);
      const indOk = act && act.indW === 64 && act.indH === 32;
      anotar(
        `nav ${w}x${h} ${tema} barra${i + 1}: altura=${b.altura} (esperado 80) destinos=${b.abas.length} ` +
          `indicador=${act ? `${act.indW}x${act.indH}` : "?"} ${indOk ? "ok" : "FORA DA SPEC"} ` +
          `aba=${act ? `${act.w}x${act.h}` : "?"} console=${errosNav.length === 0 ? "0" : errosNav.join(" | ")}`,
      );
      if (b.altura !== 80 || !indOk) falhou = true;
    });
    await pg.screenshot({ path: join(PASTA, `nav_${w}x${h}_${tema}_tudo.png`), fullPage: true });
    await pg.close();
    await contexto.close();
  }
}

// ---- recortes por destino (3, 4, 5) nos dois tamanhos ----
for (const { w, h } of TAMANHOS) {
  for (const tema of TEMAS) {
    const contexto = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      colorScheme: tema === "escuro" ? "dark" : "light",
    });
    const { pagina } = await abrir(contexto, 1);
    const barras = pagina.locator('[role="tablist"][aria-label="Navegação principal"]');
    const total = await barras.count();
    for (let i = 0; i < total; i++) {
      const destinos = i === 0 ? 3 : i === 1 ? 4 : i === 2 ? 5 : null;
      if (destinos === null) continue;
      await barras.nth(i).screenshot({ path: join(PASTA, `nav_${w}x${h}_${tema}_${destinos}destinos.png`) });
    }
    // verde x azul ficam na 4ª barra (seção comparativa): as duas em sequência
    if (total >= 5) {
      await barras.nth(3).screenshot({ path: join(PASTA, `nav_${w}x${h}_${tema}_verde.png`) });
      await barras.nth(4).screenshot({ path: join(PASTA, `nav_${w}x${h}_${tema}_azul.png`) });
      anotar(`recortes ${w}x${h} ${tema}: 3/4/5 destinos + verde + azul gerados`);
    } else {
      anotar(`recortes ${w}x${h} ${tema}: FALHA — barras encontradas: ${total}`);
      falhou = true;
    }
    await pagina.close();
    await contexto.close();
  }
}

await browser.close();
console.log(falhou ? "RESULTADO: HOUVE FALHAS" : "RESULTADO: TUDO OK");
process.exit(falhou ? 1 : 0);
