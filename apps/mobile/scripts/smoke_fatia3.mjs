// Smoke + capturas da FATIA 3 (B6). Roda o fluxo inteiro no dev server
// (Expo web, 8081) com Playwright/msedge — 4 combos (390x844 e 360x640 ×
// claro e escuro). Por combo:
//  1. "/" cai na LISTA de linhas (rota vazia do grupo = arquivo index =
//     aba Linhas, enquanto o Início é provisório);
//  2. SearchBar botão abre /buscar com o campo em FOCO;
//  3. "101" mostra 0101 primeiro; "zzz" mostra vazio com "Limpar busca";
//  4. abrir uma linha carrega o DETALHE antigo e "voltar à busca" volta
//     p/ a lista; botão Voltar da Busca volta p/ a lista;
//  5. Sobre com o seletor Sistema/Claro/Escuro: clicar e LER o fundo
//     resolvido (prova de tema imediato);
//  6. Início e Favoritos provisórios com EmptyState;
//  7. checagens objetivas em TODAS as telas NOVAS: overflow (scrollWidth),
//     toque >= 44 em botão/aba/campo VISÍVEL (elementos 0x0 são itens
//     fora da janela virtualizada/aba oculta — ignorados), 0 erros de
//     console. O DETALHE antigo é capturado sem checagem de toque (dívida
//     da tela antiga, fatia 4).
// Capturas (fullPage, deviceScaleFactor 2) em .claude/fatia3_*.png.
// Exit != 0 se qualquer checagem falhar.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FATIA3_BASE ?? "http://127.0.0.1:8081/";
const DESTINO = "C:/Users/Usuario/Pictures/Flavos-Bus/.claude";
mkdirSync(DESTINO, { recursive: true });

const COMBOS = [
  { w: 390, h: 844, tema: "claro", colorScheme: "light" },
  { w: 390, h: 844, tema: "escuro", colorScheme: "dark" },
  { w: 360, h: 640, tema: "claro", colorScheme: "light" },
  { w: 360, h: 640, tema: "escuro", colorScheme: "dark" },
];

const linhasDoLog = [];
function registrar(msg) {
  console.log(msg);
  linhasDoLog.push(msg);
}
function EraFalha(msg) {
  registrar(`FALHA: ${msg}`);
  process.exitCode = 1;
}

const LENTO = { timeout: 150000 };
const SEL_ITEM = '[role="button"][aria-label^="Linha "]';
const SEL_ITEM_VISIVEL = '[role="button"][aria-label^="Linha "]:visible';

async function bgNaPosicao(page, x, y) {
  return page.evaluate(
    ([px, py]) => {
      let el = document.elementFromPoint(px, py);
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && !bg.includes("rgba(0, 0, 0, 0)")) return bg;
        el = el.parentElement;
      }
      return null;
    },
    [x, y],
  );
}

function somaRgb(bg) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg ?? "");
  return m ? Number(m[1]) + Number(m[2]) + Number(m[3]) : -1;
}

async function abrirApp(page, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await page.goto(BASE, LENTO);
      return;
    } catch (e) {
      if (i === tentativas) throw e;
      registrar(`  (goto tentativa ${i} falhou: ${String(e.message).slice(0, 80)} — retry)`);
      await page.waitForTimeout(4000);
    }
  }
}

/** waitSelector com dump de contexto quando estoura (em vez de stack cru). */
async function esperar(page, seletor, ms, rotulo) {
  try {
    await page.waitForSelector(seletor, { timeout: ms });
  } catch {
    const texto = await page.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => "(off)");
    registrar(`  TIMEOUT em ${rotulo} | url=${page.url()} | corpo="${texto.replace(/\s+/g, " ").slice(0, 200)}"`);
    throw new Error(`timeout: ${rotulo}`);
  }
}

/** Checagens objetivas da tela corrente + captura fullPage. */
async function checarTela(page, { w, h, tema, nome, tituloEsperado, checarToque = true }) {
  await page.waitForTimeout(250); // acomoda layout RN-Web
  const overflowOk = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  if (!overflowOk) EraFalha(`${nome}: overflow horizontal (scrollWidth > innerWidth+1)`);

  let toqueOk = "n/a";
  if (checarToque) {
    const toqueRuins = await page.evaluate(() => {
      const ruins = [];
      for (const el of document.querySelectorAll('[role="button"],[role="tab"],input')) {
        const estilo = getComputedStyle(el);
        if (estilo.display === "none" || estilo.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // fora da janela virtualizada/aba oculta
        if (r.width < 43.5 || r.height < 43.5) {
          ruins.push(
            `${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 24) ?? el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`,
          );
        }
      }
      return ruins.slice(0, 6);
    });
    if (toqueRuins.length > 0) EraFalha(`${nome}: alvos de toque < 44: ${toqueRuins.join(" | ")}`);
    toqueOk = "ok";
  }

  if (tituloEsperado) {
    const achou = (await page.getByText(tituloEsperado, { exact: false }).count()) > 0;
    if (!achou) EraFalha(`${nome}: texto esperado ausente: "${tituloEsperado}"`);
  }

  const caminho = join(DESTINO, `fatia3_${nome}_${w}x${h}_${tema}.png`);
  await page.screenshot({ path: caminho, fullPage: true });
  registrar(`${nome}: overflow=ok | toque=${toqueOk}${tituloEsperado ? " | texto=ok" : ""} | captura ${caminho.split("/").pop()}`);
}

async function rodarCombo({ w, h, tema, colorScheme }) {
  const navegador = await chromium.launch({ channel: "msedge" });
  const contexto = await navegador.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    colorScheme,
  });
  const page = await contexto.newPage();
  const erros = [];
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(`console.error: ${m.text()}`);
  });
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  const S = (nome, extra = {}) => checarTela(page, { w, h, tema, nome, ...extra });
  // detalhe antigo: captura só prova navegação — os alvos < 44 dele são
  // dívida da tela ANTIGA (fatia 4), fora do escopo desta fatia.
  const SDet = (nome) => checarTela(page, { w, h, tema, nome, checarToque: false });

  registrar(`=== ${w}x${h} ${tema} ===`);
  await abrirApp(page);

  // 1) "/" cai na LISTA (aba inicial = Linhas: lista no arquivo index do
  //    grupo — rota vazia — enquanto o Início é provisório)
  await esperar(page, '[role="button"][aria-label="Buscar linha ou parada"]:visible', 90000, "tela de linhas (botão buscar)");
  const rota = new URL(page.url()).pathname;
  if (rota !== "/") EraFalha(`abertura esperava / (lista de linhas no index), veio ${rota}`);
  await esperar(page, SEL_ITEM_VISIVEL, 90000, "itens da lista de linhas");
  // FlatList é virtualizada: a janela inicial traz ~20 itens (84 no dataset)
  const nItens = await page.locator(SEL_ITEM_VISIVEL).count();
  if (nItens < 10) EraFalha(`lista de linhas com poucos itens visíveis: ${nItens}`);
  const primeiroItem = (await page.locator(SEL_ITEM_VISIVEL).first().getAttribute("aria-label")) ?? "";
  if (!primeiroItem.startsWith("Linha 0507")) EraFalha(`primeiro da lista deveria ser o MVP 0507, veio ${primeiroItem}`);
  const vf = await page.evaluate(() => document.querySelectorAll('[role="button"][aria-label^="Linha "]').length);
  registrar(`lista: ${nItens} itens na janela visível (${vf} no DOM), primeiro = MVP 0507`);
  await S("linhas", { tituloEsperado: "Primeiro as do MVP" });

  // 2) SearchBar botão -> /buscar com foco no campo
  await page.locator('[role="button"][aria-label="Buscar linha ou parada"]:visible').first().click();
  await page.waitForURL("**/buscar", { timeout: 30000 });
  await page.waitForSelector("input:visible", LENTO);
  await page.waitForTimeout(300);
  const focoOk = await page.evaluate(() => document.activeElement?.tagName === "INPUT");
  if (!focoOk) EraFalha("Buscar: campo não recebeu foco automático");
  await S("buscar_vazio");

  // 3) "101" -> 0101 primeiro
  const campo = page.locator("input:visible").first();
  await campo.fill("101");
  await page.waitForSelector('[role="button"][aria-label^="Linha 0101"]:visible', { timeout: 20000 });
  const primeiro = await page.locator(SEL_ITEM_VISIVEL).first().getAttribute("aria-label");
  if (!primeiro?.startsWith("Linha 0101")) EraFalha(`"101": primeiro resultado deveria ser 0101, veio ${primeiro}`);
  await S("buscar_101");

  // 4) "zzz" -> vazio + "Limpar busca"
  await campo.fill("zzz");
  await page.getByText("Nenhuma linha com esse termo", { exact: false }).first().waitFor({ timeout: 20000 });
  await S("buscar_zzz", { tituloEsperado: "Limpar busca" });
  await page.getByText("Limpar busca", { exact: true }).first().click();
  await page.waitForSelector(SEL_ITEM_VISIVEL, { timeout: 20000 });
  const valorPosLimpar = await campo.inputValue();
  if (valorPosLimpar !== "") EraFalha(`"Limpar busca" não limpou o campo: "${valorPosLimpar}"`);

  // 5) Voltar (ícone) -> lista; abrir linha -> detalhe antigo; voltar
  const naLista = (u) => {
    const p = new URL(u).pathname;
    return p === "/" || p === "/linhas";
  };
  await page.locator('[role="button"][aria-label="Voltar"]:visible').click();
  await page.waitForURL(naLista, { timeout: 30000 });
  const rotuloItem = (await page.locator(SEL_ITEM_VISIVEL).first().getAttribute("aria-label")) ?? "";
  await page.locator(SEL_ITEM_VISIVEL).first().click();
  await page.waitForURL("**/linha/**", { timeout: 30000 });
  await page.getByText("voltar à busca", { exact: false }).first().waitFor({ timeout: 60000 });
  const idDaItem = /Linha\s+(\S+):/.exec(rotuloItem)?.[1] ?? "linha";
  await SDet(`detalhe_${idDaItem.toLowerCase()}`);
  await page.getByText("voltar à busca", { exact: false }).first().click();
  await page.waitForURL(naLista, { timeout: 30000 });

  // 6) Sobre + Início + Favoritos (tema base do combo, ANTES da troca).
  //    A tab bar do expo-router é <a role="tab" href="/...">: clicar por
  //    href (textos soltos de cenas antigas escondidas interceptam).
  const tocarAba = async (rotaAba) => {
    await page.locator(`a[role="tab"][href="${rotaAba}"]:visible`).first().click({ timeout: 30000 });
  };

  await tocarAba("/sobre");
  await page.waitForURL("**/sobre", { timeout: 30000 });
  await page.getByText("Tema do app", { exact: true }).first().waitFor({ timeout: 30000 });
  await page.getByText("Os horários são teóricos", { exact: false }).first().waitFor({ timeout: 30000 });
  await page.getByText("Versão do feed", { exact: true }).first().waitFor({ timeout: 30000 });
  await S("sobre", { tituloEsperado: "Fonte e créditos" });

  await tocarAba("/inicio");
  await page.waitForURL("**/inicio", { timeout: 30000 });
  await page.getByText("Início chega na próxima etapa", { exact: true }).first().waitFor({ timeout: 30000 });
  await S("inicio", { tituloEsperado: "Início chega na próxima etapa" });

  await tocarAba("/favoritos");
  await page.waitForURL("**/favoritos", { timeout: 30000 });
  await page.getByText("Favoritos chega na próxima etapa", { exact: true }).first().waitFor({ timeout: 30000 });
  await S("favoritos", { tituloEsperado: "Favoritos chega na próxima etapa" });

  // 7) prova do tema: clicar e LER o fundo resolvido. No combo claro:
  //    Escuro -> fundo escuro. No escuro: Claro -> clareia, Escuro -> escurece.
  await tocarAba("/sobre");
  await page.waitForURL("**/sobre", { timeout: 30000 });
  await page.getByText("Tema do app", { exact: true }).first().waitFor(LENTO);
  const aba = (rotuloSegmento) =>
    page.locator('[role="tablist"][aria-label="Tema do app"] [role="tab"]').filter({ hasText: rotuloSegmento }).first();
  const bgAntes = await bgNaPosicao(page, Math.floor(w / 2), 4);
  if (tema === "claro") {
    await aba("Escuro").click();
    await page.waitForTimeout(400);
    const bgDepois = await bgNaPosicao(page, Math.floor(w / 2), 4);
    if (somaRgb(bgDepois) >= 250) EraFalha(`tema: fundo após "Escuro" não é escuro: ${bgDepois}`);
    if (bgAntes === bgDepois) EraFalha("tema: fundo não mudou ao clicar Escuro");
  } else {
    await aba("Claro").click();
    await page.waitForTimeout(400);
    const bgClaro = await bgNaPosicao(page, Math.floor(w / 2), 4);
    if (somaRgb(bgClaro) < 500) EraFalha(`tema: fundo após "Claro" não é claro: ${bgClaro}`);
    await aba("Escuro").click();
    await page.waitForTimeout(400);
    const bgEscuro = await bgNaPosicao(page, Math.floor(w / 2), 4);
    if (somaRgb(bgEscuro) >= 250) EraFalha(`tema: fundo após "Escuro" não voltou ao escuro: ${bgEscuro}`);
  }
  const bgFinal = await bgNaPosicao(page, Math.floor(w / 2), 4);
  registrar(`tema: antes=${bgAntes} depois(Escuro)=${bgFinal}`);
  await S("sobre_tema_escuro_ativo");
  await aba("Sistema").click(); // preferência de volta ao default
  await page.waitForTimeout(250);

  await page.close();
  await contexto.close();
  await navegador.close();

  if (erros.length > 0) {
    EraFalha(`erros de console/página (${w}x${h} ${tema}): ${erros.slice(0, 4).join(" || ")}`);
  } else {
    registrar("console: 0 erros");
  }
}

for (const combo of COMBOS) {
  await rodarCombo(combo);
}

registrar(process.exitCode ? "RESULTADO: FALHOU" : "RESULTADO: TUDO OK");
writeFileSync(`${DESTINO}/fatia3_checagens.txt`, linhasDoLog.join("\n") + "\n");
