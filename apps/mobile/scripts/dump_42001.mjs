// Dump da rota 42001 (linha com operadora declarada no feed)
import { chromium } from "playwright";
const navegador = await chromium.launch({ channel: "msedge", headless: true });
const pagina = await navegador.newPage({ viewport: { width: 360, height: 740 } });
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
await pagina.goto("http://127.0.0.1:8081/linha/42001", { waitUntil: "domcontentloaded", timeout: 90_000 });
await pagina.waitForTimeout(9_000);
const texto = await pagina.evaluate(() => document.body?.innerText ?? "");
console.log(texto.slice(0, 600));
console.log("=== pageerrors:", erros.length, "===");
await navegador.close();
