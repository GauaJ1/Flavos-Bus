// Servidor HTTP mínimo (Node nativo) para o export estático da web.
// Uso: node scripts/servir_export.mjs [porta] [pasta]
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const porta = Number(process.argv[2] ?? 8282);
const raiz = process.argv[3] ?? new URL("../.expo-export-test/", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1");

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".sqlite": "application/vnd.sqlite3",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".css": "text/css",
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let caminho = join(raiz, normalize(url));
  // SPA: rota sem extensão cai no index.html (expo-router resolve no cliente)
  try {
    if (statSync(caminho).isDirectory()) caminho = join(caminho, "index.html");
  } catch {
    if (!extname(url)) caminho = join(raiz, "index.html");
  }
  try {
    statSync(caminho);
    res.writeHead(200, { "Content-Type": tipos[extname(caminho)] ?? "application/octet-stream" });
    createReadStream(caminho).pipe(res);
  } catch {
    res.writeHead(404).end("404");
  }
}).listen(porta, "127.0.0.1", () => console.log(`[servir] http://127.0.0.1:${porta} (${raiz})`));
