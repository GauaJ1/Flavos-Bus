// Passo 6 do processo de design: verificação visual de verdade.
// Captura as telas no web de depuração (Expo dev server já rodando em
// 127.0.0.1:8081) usando o Edge do sistema (channel msedge — sem baixar
// navegador). Saída: docs/design/telas/*.png
//   Uso: node scripts/capturas_web.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8081";
// apps/mobile/scripts → 3 níveis até a raiz do repo
const PASTA = new URL("../../../docs/design/telas/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const alvos = [
  { arquivo: "busca_claro.png", esquema: "light", rota: "/" },
  { arquivo: "busca_escuro.png", esquema: "dark", rota: "/" },
  { arquivo: "detalhe_claro.png", esquema: "light", rota: "/linha/42029" },
  { arquivo: "detalhe_escuro.png", esquema: "dark", rota: "/linha/42029" },
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
await mkdir(PASTA, { recursive: true });

for (const alvo of alvos) {
  const contexto = await browser.newContext({
    viewport: { width: 360, height: 740 }, // tela pequena (doc: ~360px)
    deviceScaleFactor: 2,
    colorScheme: alvo.esquema,
  });
  const pagina = await contexto.newPage();
  const errosDeConsole = [];
  pagina.on("pageerror", (e) => errosDeConsole.push(String(e)));
  let ok = false;
  for (let tentativa = 1; tentativa <= 3 && !ok; tentativa += 1) {
    try {
      await pagina.goto(`${BASE}${alvo.rota}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await pagina.waitForTimeout(tentativa === 1 ? 25_000 : 8_000); // primeiro bundle compila devagar
      const texto = await pagina.evaluate(() => document.body?.innerText ?? "");
      if (texto.trim().length > 40) ok = true;
    } catch (erro) {
      console.error(`[capturas] ${alvo.arquivo} tentativa ${tentativa}: ${erro.message}`);
    }
  }
  if (!ok) {
    console.error(`[capturas] conteúdo insuficiente em ${alvo.rota}; salvando mesmo assim p/ diagnóstico`);
  }
  const caminho = `${PASTA}${alvo.arquivo}`;
  await pagina.screenshot({ path: caminho, fullPage: false });
  await writeFile(
    `${PASTA}${alvo.arquivo}.txt`,
    `rota=${alvo.rota} esquema=${alvo.esquema} ok=${ok} erros=${JSON.stringify(errosDeConsole)}\n`,
    "utf-8",
  );
  console.log(`[capturas] ${caminho} ok=${ok} erros_console=${errosDeConsole.length}`);
  await contexto.close();
}
await browser.close();
console.log("[capturas] fim");
