// A1: fontes RESOLVIDAS (getComputedStyle) dos papeis pedidos.
// Uso: node scripts/diag_fontes.mjs [base]
// Saida: tabela papel | primeiro nome concreto da pilha | pilha | peso. se a
// PRIMEIRA familia concreta for serif (Times/serif sem sans antes), marca SERIF.
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const contexto = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
await pagina.goto(`${BASE}/galeria`, { waitUntil: "domcontentloaded", timeout: 120_000 });

let pronto = false;
for (let i = 0; i < 6 && !pronto; i += 1) {
  await pagina.waitForTimeout(20_000);
  pronto = await pagina.evaluate(() => (document.body?.innerText ?? "").includes("EmptyState"));
}
if (!pronto) {
  console.error("galeria nao carregou");
  process.exit(1);
}

const tumulo = await pagina.evaluate(() => {
  const passaTexto = (txt) =>
    [...document.querySelectorAll("div[dir=auto]")].find((n) => (n.textContent ?? "").trim() === txt && n.children.length === 0);
  const pega = (n) => {
    if (!n) return null;
    const cs = getComputedStyle(n);
    return { pilha: cs.fontFamily, peso: cs.fontWeight, variante: cs.fontVariantNumeric || cs.fontVariant };
  };
  const primeira = (pilha) => {
    if (!pilha) return "AUSENTE";
    const concreto = pilha.split(",")[0].replaceAll('"', "").trim().toLowerCase();
    const serif = ["times", "times new roman", "georgia", "garamond", "serif", "cambria", "book antiqua", "palatino"];
    return `${concreto}${serif.some((s) => concreto.includes(s)) ? "  <<<< SERIF!" : ""}`;
  };
  const linhas = [];
  const alvos = [
    ["titulo da secao da galeria", "LineBadge (regra 3:1 automática — pares REAIS do feed)"],
    ["numeral do LineBadge", "0002"],
    ["rotulo do DaySegmented", "Útil"],
    ["texto do TheoreticalBadge", "Horário teórico"],
  ];
  for (const [papel, texto] of alvos) {
    const d = passaTexto(texto);
    const info = pega(d);
    linhas.push({ papel, primeira: primeira(info?.pilha), ...info, presente: Boolean(d) });
  }
  const input = document.querySelector('input[placeholder="Buscar linha ou parada"]');
  const cs = input ? getComputedStyle(input) : null;
  linhas.push({
    papel: "texto do SearchBar (campo)",
    primeira: primeira(cs?.fontFamily),
    pilha: cs?.fontFamily ?? "AUSENTE (input não encontrado)",
    peso: cs?.fontWeight ?? "-",
    variante: cs?.fontVariantNumeric || cs?.fontVariant || "-",
    presente: Boolean(input),
  });
  return linhas;
});

console.log("papel                            | primeira familia concreta      | presente");
for (const l of tumulo) {
  console.log(`${l.papel.padEnd(32)} | ${String(l.primeira).padEnd(30)} | ${l.presente}`);
}
console.log("---- pilhas completas ----");
for (const l of tumulo) console.log(`${l.papel}: ${l.pilha} (peso ${l.peso}, variante ${l.variante})`);
console.log(`pageerrors: ${erros.length}`);
await browser.close();
