// Capturas da galeria (4 contextos: 390x844 e 360x640, claro e escuro),
// via dev server Expo (a galeria é dev-only; em export de produção ela é
// vazia por guard). Saída: .claude/galeria_*.png
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
const PASTA = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".claude");

const alvos = [
  { arquivo: "galeria_390x844_claro.png", largura: 390, altura: 844, esquema: "light" },
  { arquivo: "galeria_390x844_escuro.png", largura: 390, altura: 844, esquema: "dark" },
  { arquivo: "galeria_360x640_claro.png", largura: 360, altura: 640, esquema: "light" },
  { arquivo: "galeria_360x640_escuro.png", largura: 360, altura: 640, esquema: "dark" },
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
await mkdir(PASTA, { recursive: true });

for (const alvo of alvos) {
  const contexto = await browser.newContext({
    viewport: { width: alvo.largura, height: alvo.altura },
    deviceScaleFactor: 2,
    colorScheme: alvo.esquema,
  });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e)));
  let ok = false;
  for (let tentativa = 1; tentativa <= 4 && !ok; tentativa += 1) {
    try {
      await pagina.goto(`${BASE}/galeria`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await pagina.waitForTimeout(tentativa === 1 ? 30_000 : 10_000); // 1º bundle compila devagar
      const texto = await pagina.evaluate(() => document.body?.innerText ?? "");
      if (texto.includes("LineBadge") && texto.includes("EmptyState")) ok = true;
      else console.error(`[galeria] ${alvo.arquivo}: conteúdo ainda não pronto (${texto.length} chars)`);
    } catch (erro) {
      console.error(`[galeria] ${alvo.arquivo} tentativa ${tentativa}: ${erro.message}`);
    }
  }
  await pagina.screenshot({ path: join(PASTA, alvo.arquivo), fullPage: true });
  await writeFile(
    join(PASTA, `${alvo.arquivo}.txt`),
    `rota=/galeria esquema=${alvo.esquema} ${alvo.largura}x${alvo.altura} ok=${ok} erros=${JSON.stringify(erros)}\n`,
    "utf-8",
  );
  console.log(`[galeria] ${alvo.arquivo} ok=${ok} erros_console=${erros.length}`);
  await contexto.close();
}
await browser.close();
console.log("[galeria] fim");
