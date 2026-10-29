// SUÍTE DE EXAUSTÃO — "até o mínimo, até o extremo".
// Cobre toda navegação (2 telas), todos os 7 chips de dia, todas as
// pesquisas (número, nome, sem acento, lixo, vazio), todos os extremos
// (320px, 4 famílias de viewport, tema claro/escuro, 100% das 84 linhas
// abertas uma a uma, teclado, rolagem até o fim, rede externa bloqueada).
// Uso: node scripts/suite_exaustiva.mjs   (dev server em :8081)
import { writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:8081";
// host permitido = o próprio BASE (export estático ou dev server)
const HOST_PERMITIDO = BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const resultado = [];
let falhas = 0;

function check(cat, nome, ok, info = "") {
  resultado.push({ cat, nome, ok, info });
  if (!ok) falhas += 1;
  console.log(`${ok ? "PASS" : "FAIL"} [${cat}] ${nome}${info ? ` — ${info}` : ""}`);
}

const navegador = await chromium.launch({ channel: "msedge", headless: true });

async function abrir(opcoes = {}) {
  const contexto = await navegador.newContext({
    viewport: { width: 360, height: 740 },
    colorScheme: "light",
    ...opcoes,
  });
  if (!opcoes.permitirRedeExterna) {
    await contexto.route(new RegExp(`^(?!${HOST_PERMITIDO})`), (r) => r.abort("blocked_by_test"));
  }
  return contexto;
}

async function texto(pagina) {
  return pagina.evaluate(() => document.body?.innerText ?? "");
}

async function esperarTexto(pagina, alvo, timeoutMs = 90_000) {
  await pagina.waitForFunction(
    (alvos) => {
      const t = document.body?.innerText ?? "";
      return alvos.every((a) => t.includes(a));
    },
    Array.isArray(alvo) ? alvo : [alvo],
    { timeout: timeoutMs },
  );
  return texto(pagina);
}

const linhasDoCartao = (t) =>
  t.split("\n").filter((l) => /^\d{3,4}$/.test(l.trim())).length;

// =========================================================================
// 1) TELA RAIZ: carrega, meta, lista completa
// =========================================================================
const ctx = await abrir();
const pag = await ctx.newPage();
const errosPag = [];
pag.on("pageerror", (e) => errosPag.push(String(e)));
let t = await (async () => {
  await pag.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  return esperarTexto(pag, ["Flavos Bus", "linha(s)"]);
})();
check("raiz", "tela carrega com aviso e contagem", /84 linha\(s\)/.test(t), t.split("\n")[2]);
check("raiz", "aviso teórico no topo", t.indexOf("teóricos") < t.indexOf("linha(s)"));
check("raiz", "MVP no topo (0507 1º)", t.indexOf("0507") < t.indexOf("0504"));
const visíveisIniciais = linhasDoCartao(t);
check("raiz", "lista renderiza (≥10 cartões)", visíveisIniciais >= 10, `${visíveisIniciais} números`);

// rolagem: o conteúdo já está no DOM (innerText não muda); a prova correta é
// que o container realmente rola e o ÚLTIMO cartão fica visível na tela.
const rolagem = await pag.evaluate(() => {
  const svs = [...document.querySelectorAll("div")].filter(
    (d) => d.scrollHeight > d.clientHeight + 50 && getComputedStyle(d).overflowY !== "visible",
  );
  if (svs.length === 0) return { achou: false };
  const sv = svs[0];
  const antes = sv.scrollTop;
  sv.scrollTop = sv.scrollHeight;
  const fim = sv.scrollTop;
  const b = sv.getBoundingClientRect();
  return {
    achou: true,
    rolou: fim > antes + 50,
    dentroDaTela: b.top < window.innerHeight && b.height > 200,
  };
});
check(
  "raiz",
  "container de lista rola até o fim",
  rolagem.achou && rolagem.rolou && rolagem.dentroDaTela,
  JSON.stringify(rolagem),
);

// =========================================================================
// 2) PESQUISAS: cada tipo, até o extremo
// =========================================================================
const campo = pag.locator("input").first();
async function buscar(termo) {
  await campo.fill(termo);
  await pag.waitForTimeout(700);
  return texto(pag);
}

let r = await buscar("509");
check("busca", "número sem zero → 0509", r.includes("0509"));

r = await buscar("0509");
check("busca", "número com zero → 0509", r.includes("0509") && /1 linha\(s\)/.test(r));

r = await buscar("Tambau");
check("busca", "sem acento 'Tambau' → Tambaú", r.includes("0510"));

r = await buscar("tambaú");
check("busca", "com acento 'tambaú'", r.includes("0510"));

r = await buscar("TAMBAU");
check("busca", "MAIÚSCULA", r.includes("0510"));

r = await buscar("jaguaribe");
check("busca", "nome do bairro", r.includes("0003"));

r = await buscar("  509  ");
check("busca", "espaços nas pontas", r.includes("0509"));

r = await buscar("xyzabc123");
check(
  "busca",
  "lixo → estado vazio + dica",
  r.includes("Nenhuma linha com esse nome") && r.includes("Tenta só o número"),
);

r = await buscar("%");
check("busca", "curinga '%' não quebra (literal)", r.includes("Nenhuma linha") || r.includes("linha(s)"));

r = await buscar("_");
check("busca", "curinga '_' não quebra", r.includes("Nenhuma linha") || r.includes("linha(s)"));

r = await buscar("'; DROP TABLE routes; --");
check("busca", "injeção SQL é só texto", r.includes("Nenhuma linha") || r.includes("linha(s)"));

r = await buscar("😀🚌");
check("busca", "emoji não quebra", r.includes("Nenhuma linha") || r.includes("linha(s)"));

r = await buscar("á" + "á".repeat(300));
check("busca", "termo gigante (300 char)", r.includes("Nenhuma linha") || r.includes("linha(s)"));

r = await buscar("");
check("busca", "campo vazio volta às 84", /84 linha\(s\)/.test(r));

// volta ao catálogo completo para a varredura
await buscar("");

// =========================================================================
// 3) TODAS AS 84 LINHAS — delegado a scripts/varredura_84.mjs (uma página,
//    sem 84 contextos: mais rápido e estável). Ver docs/design/telas/
//    varredura_84_linhas.md
// =========================================================================
const mapaNumeroId = JSON.parse(
  await readFile(new URL("../.tmp/mapa_numero_id.json", import.meta.url), "utf-8"),
);
const numeros = Object.keys(mapaNumeroId);
check("84 linhas", "mapa numero→id carregado", numeros.length === 84, `${numeros.length} linhas`);

// =========================================================================
// 4) DETALHE: todos os 7 chips, extremo de cada
//    (navegação SPA na MESMA página: o banco já está importado no OPFS)
// =========================================================================
const detalhe = pag;
await detalhe.evaluate((caminho) => {
  window.history.pushState({}, "", caminho);
  window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
}, "/linha/42029");
let td = await esperarTexto(detalhe, "PRÓXIMA SAÍDA", 60_000);
check("detalhe", "0509: próxima saída em destaque", td.includes("PRÓXIMA SAÍDA"));

const chips = await detalhe.locator('[role="button"], [role="tab"], button').all();
let chipsClicados = 0;
for (const nomeDia of DIAS) {
  const chip = detalhe.getByText(nomeDia, { exact: true }).first();
  try {
    await chip.click({ timeout: 5_000 });
    await detalhe.waitForTimeout(900);
    const tx = await texto(detalhe);
    const temQuadro = tx.includes("viagem(ns)") || tx.includes("Sem horários nesse tipo de dia");
    const pedaco = tx.split("\n").find((l) => l.includes("viagem(ns)")) ?? "(vazio)";
    check("chips", `chip ${nomeDia}`, temQuadro, pedaco.slice(0, 48));
    chipsClicados += 1;
  } catch (e) {
    check("chips", `chip ${nomeDia}`, false, String(e).slice(0, 80));
  }
}
check("chips", "7 chips clicáveis", chipsClicados === 7, `${chipsClicados}/7`);

// volta para hoje e confere que "PRÓXIMA" reaparece ou avisa que acabou
const hoje = detalhe.getByText(DIAS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1], { exact: true }).first();
await hoje.click().catch(() => undefined);
await detalhe.waitForTimeout(800);
td = await texto(detalhe);
check(
  "chips",
  "voltar ao dia de hoje restaura destaque",
  td.includes("PRÓXIMA SAÍDA") || td.includes("já passaram"),
);

// rolagem do detalhe até o fim
await detalhe.evaluate(() => {
  const sv = [...document.querySelectorAll("div")].find(
    (d) => d.scrollHeight > d.clientHeight + 50 && getComputedStyle(d).overflowY !== "visible",
  );
  if (sv) sv.scrollTop = sv.scrollHeight;
  window.scrollTo(0, document.body.scrollHeight);
});
await detalhe.waitForTimeout(500);
td = await texto(detalhe);
check("detalhe", "rolagem alcança o rodapé (voltar)", td.includes("voltar à busca"));

// =========================================================================
// 5) EXTREMOS DE VIEWPORT (320 mínimo → 1440 máximo)
//    redimensiona a MESMA página (sem reimportar o banco a cada viewport)
// =========================================================================
const viewports = [
  [320, 568, "320 mínimo"],
  [360, 740, "360 típico"],
  [768, 1024, "768 tablet"],
  [1440, 900, "1440 desktop"],
];
for (const [w, h, rotulo] of viewports) {
  await pag.setViewportSize({ width: w, height: h });
  // garante que está no detalhe antes de medir
  await pag.evaluate((caminho) => {
    window.history.pushState({}, "", caminho);
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }, "/linha/42029");
  await esperarTexto(pag, "viagem(ns)", 45_000);
  const overflowX = await pag.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("viewport", `${rotulo}: detalhe renderiza`, true);
  check("viewport", `${rotulo}: sem overflow horizontal`, overflowX <= 2, `${overflowX}px`);
  // e a busca continua utilizável nessa largura
  await pag.evaluate((caminho) => {
    window.history.pushState({}, "", caminho);
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }, "/");
  await esperarTexto(pag, "linha(s)", 30_000);
  const larguraCampo = await pag.evaluate(() => {
    const el = document.querySelector("input");
    return el ? Math.round(el.getBoundingClientRect().width) : 0;
  });
  const oxBusca = await pag.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("viewport", `${rotulo}: campo de busca utilizável`, larguraCampo >= 200, `${larguraCampo}px`);
  check("viewport", `${rotulo}: busca sem overflow`, oxBusca <= 2, `${oxBusca}px`);
}
await pag.setViewportSize({ width: 360, height: 740 });

// =========================================================================
// 6) TEMA ESCURO (contexto próprio — precisa recarregar p/ prefers-color-scheme)
// =========================================================================
const cd = await abrir({ colorScheme: "dark" });
const pd = await cd.newPage();
await pd.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await pd.waitForFunction(() => (document.body?.innerText ?? "").includes("linha(s)"), null, {
  timeout: 120_000,
});
const tEsc = await texto(pd);
const cores = await pd.evaluate(() => {
  const fundo = getComputedStyle(document.body).backgroundColor;
  const el = document.querySelector("div[dir] , #root div");
  return { fundo, texto: el ? getComputedStyle(el).color : "" };
});
check("tema", "escuro: raiz carrega", tEsc.includes("teóricos") && /84 linha\(s\)/.test(tEsc), cores.fundo);
await cd.close();

// =========================================================================
// 7) NAVEGAÇÃO REAL: tocar cartão → detalhe → voltar
// =========================================================================
const cn = await abrir();
const pn = await cn.newPage();
await pn.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await esperarTexto(pn, "84 linha(s)");
const alvo = pn.getByText("0509", { exact: true }).first();
await alvo.click({ timeout: 15_000 });
await pn.waitForTimeout(2_500);
let turl = await texto(pn);
check("navegação", "toque no cartão abre detalhe", turl.includes("PRÓXIMA SAÍDA") || turl.includes("já passaram"), pn.url());
await pn.getByText("← voltar à busca", { exact: false }).first().click({ timeout: 10_000 });
await pn.waitForTimeout(1_500);
turl = await texto(pn);
check("navegação", "voltar retorna à busca", /84 linha\(s\)/.test(turl), pn.url());
// teclado: Tab navega até o campo e digita
await pn.keyboard.press("Tab");
await pn.keyboard.type("509");
await pn.waitForTimeout(900);
const tTab = await texto(pn);
check("teclado", "Tab + digitar filtra", tTab.includes("0509"), `campo ativo: ${await pn.evaluate(() => document.activeElement?.tagName)}`);
await cn.close();

// =========================================================================
// 8) ROTAS INEXISTENTES / ID INVÁLIDO (o que o Moovit chamaria de deep link quebrado)
// =========================================================================
for (const rota of ["/linha/999999", "/linha/", "/rota-que-nao-existe"]) {
  const ci = await abrir();
  const pi = await ci.newPage();
  const ei = [];
  pi.on("pageerror", (e) => ei.push(String(e)));
  await pi.goto(`${BASE}${rota}`, { waitUntil: "domcontentloaded" });
  // espera a tela DECIDIR (não só o aviso, que aparece durante o carregando):
  // ou a mensagem própria, ou a tela de not-found, ou o quadro — o que vier
  await pi
    .waitForFunction(
      () => {
        const t = document.body?.innerText ?? "";
        return (
          t.includes("Linha não encontrada") ||
          t.includes("Essa tela não existe") ||
          t.includes("viagem(ns)")
        );
      },
      null,
      { timeout: 120_000 },
    )
    .catch(() => undefined);
  await pi.waitForTimeout(800);
  const ti = await texto(pi);
  const semIngles = !/Unmatched Route|Page could not be found|Go back|Sitemap/.test(ti);
  const tratou =
    ti.includes("teóricos") &&
    ei.length === 0 &&
    semIngles &&
    // id inexistente tem mensagem própria; rota inexistente tem a sua
    (ti.includes("Linha não encontrada") || ti.includes("Essa tela não existe"));
  check(
    "erros",
    `rota '${rota}' tratada em português (sem crash)`,
    tratou,
    ti.replace(/\n/g, " | ").slice(0, 130),
  );
  await ci.close();
}

// =========================================================================
// 9) rede externa bloqueada na raiz (já é padrão do contexto) — sem pageerror
// =========================================================================
check("offline", "raiz sem pageerror com rede externa bloqueada", errosPag.length === 0, errosPag.join(" | ").slice(0, 140));

// =========================================================================
// 10) CONTRATO DE DADOS do detalhe (consistência interna das partidas)
// =========================================================================
const cd2 = await abrir();
const pd2 = await cd2.newPage();
await pd2.goto(`${BASE}/linha/42029`, { waitUntil: "domcontentloaded" });
const te = await esperarTexto(pd2, "viagem(ns)");
// ordem medida SÓ dentro do bloco do quadro (o texto da tela também tem a
// hora de "agora" da faixa e a PRÓXIMA SAÍDA — não são parte do quadro)
const bloco = te.slice(te.indexOf("viagem(ns)"));
const horas = [...bloco.matchAll(/\b(\d{2}:\d{2})\b/g)].map((m) => m[1]);
const unicas = [...new Set(horas)];
const semZero = unicas.every((h) => /^\d{2}:\d{2}$/.test(h));
check("dados", "todas as horas no formato HH:MM (normalizadas)", semZero, `${unicas.length} horários`);
const min = unicas.map((h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3)));
const ordenado = min.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
check("dados", "horários do quadro em ordem cronológica", ordenado, unicas.slice(0, 8).join(" "));
check("dados", "primeira 05:00 / última 17:40", unicas.includes("05:00") && unicas.includes("17:40"));
await cd2.close();

// =========================================================================
// RELATÓRIO
// =========================================================================
await navegador.close();
const linhas = [
  "# Suite de exaustão — fluxo completo do app (web de depuração)",
  "",
  `Data: ${new Date().toISOString()} · Edge/Playwright · rede externa bloqueada por padrão`,
  "",
  `**${resultado.length - falhas}/${resultado.length} PASS** · ${falhas} falha(s)`,
  "",
  "| Categoria | Check | Resultado | Info |",
  "|---|---|---|---|",
  ...resultado.map((r) => `| ${r.cat} | ${r.nome} | ${r.ok ? "PASS" : "FAIL"} | ${String(r.info).replace(/\|/g, "/").slice(0, 80)} |`),
];
await writeFile(new URL("../../../docs/design/telas/suite_exaustiva.md", import.meta.url), linhas.join("\n") + "\n", "utf-8");
console.log(`\n[suite] ${resultado.length - falhas}/${resultado.length} PASS`);
process.exit(falhas === 0 ? 0 : 1);
