// Diagnóstico: o que a tela de busca está mostrando (fase do provedor)?
import { chromium } from "playwright";

const navegador = await chromium.launch({ channel: "msedge", headless: true });
const pagina = await navegador.newPage({ viewport: { width: 360, height: 740 } });
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
pagina.on("console", (m) => { if (m.type() === "error") erros.push(`console: ${m.text()}`); });
await pagina.goto("http://127.0.0.1:8081/", { waitUntil: "domcontentloaded", timeout: 90_000 });
await pagina.waitForTimeout(20_000);
const texto = await pagina.evaluate(() => document.body?.innerText ?? "");
const inputs = await pagina.evaluate(() => document.querySelectorAll("input, textarea").length);
console.log("=== innerText ===");
console.log(texto.slice(0, 700));
console.log("=== inputs:", inputs, " pageerrors:", erros.length, "===");
console.log(erros.slice(0, 6).join("\n").slice(0, 900));
await navegador.close();
