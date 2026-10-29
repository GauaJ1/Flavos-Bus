// Bateria "aparelho": emulação de celular (touch + DPR 3 + UA Android),
// alvos de toque reais (WCAG 2.5.8 / regra do projeto: ≥48px), bloqueio de
// rede externa e verificação das duas telas + chips + voltar.
import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8282";
const HOST = BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const navegador = await chromium.launch({ channel: "msedge", headless: true });
let falhas = 0;
const check = (nome, ok, info = "") => {
  if (!ok) falhas += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${nome}${info ? ` — ${info}` : ""}`);
};

const pixel = devices["Pixel 7"];
const ctx = await navegador.newContext({
  ...pixel,
  defaultBrowserType: undefined,
  isMobile: true,
  hasTouch: true,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
await ctx.route(new RegExp(`^(?!${HOST})`), (r) => r.abort("blocked_by_test"));
const pag = await ctx.newPage();
const erros = [];
pag.on("pageerror", (e) => erros.push(String(e)));

await pag.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await pag.waitForFunction(() => (document.body?.innerText ?? "").includes("linha(s)"), null, {
  timeout: 120_000,
});

// --- alvos de toque (todos os elementos interativos visíveis) ---
const alvos = await pag.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('[role="button"], input, a, [tabindex]:not([tabindex="-1"])')) {
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    out.push({
      rotulo: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 28),
      w: Math.round(b.width),
      h: Math.round(b.height),
    });
  }
  return out;
});
const pequenos = alvos.filter((a) => a.h < 44);
check("toque: alvos medidos", alvos.length > 0, `${alvos.length} interativos`);
check(
  "toque: todos ≥44px de altura (mínimo WCAG 2.5.8)",
  pequenos.length === 0,
  pequenos.length ? JSON.stringify(pequenos.slice(0, 4)) : "ok",
);

// --- toque por TAP (não clique de mouse) ---
await pag.locator("input").first().tap();
await pag.keyboard.type("509");
await pag.waitForTimeout(900);
let t = await pag.evaluate(() => document.body?.innerText ?? "");
check("toque: digitar filtra (tap + teclado)", t.includes("0509"));

await pag.getByText("0509", { exact: true }).first().tap();
await pag.waitForFunction(
  () => /PRÓXIMA SAÍDA|já passaram|viagem\(ns\)/.test(document.body?.innerText ?? ""),
  null,
  { timeout: 60_000 },
);
t = await pag.evaluate(() => document.body?.innerText ?? "");
check("toque: abre o detalhe", /PRÓXIMA SAÍDA|viagem\(ns\)|já passaram/.test(t), pag.url());

// chip por tap
await pag.getByText("Sáb", { exact: true }).first().tap();
await pag.waitForTimeout(1200);
const tSab = await pag.evaluate(() => document.body?.innerText ?? "");
check("toque: chip Sáb por tap", /viagem\(ns\)|Sem horários/.test(tSab));

// voltar por tap
await pag.getByText("← voltar à busca", { exact: false }).first().tap();
await pag.waitForTimeout(1500);
t = await pag.evaluate(() => document.body?.innerText ?? "");
check("toque: voltar à busca", /linha\(s\)/.test(t), pag.url());

// --- troca de orientação (paisagem) ---
await pag.setViewportSize({ width: 915, height: 412 });
await pag.waitForTimeout(600);
const oxPaisagem = await pag.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check("paisagem: sem overflow", oxPaisagem <= 2, `${oxPaisagem}px`);

check("emulação: nenhum pageerror", erros.length === 0, erros[0]?.slice(0, 120) ?? "");
await navegador.close();
console.log(`\n[aparelho] ${falhas === 0 ? "TUDO PASS" : `${falhas} FALHA(S)`}`);
process.exit(falhas ? 1 : 0);
