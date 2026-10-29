// Copia data/gtfs/flavos.sqlite para os assets do app (58 MB; fica fora do
// git — ver .gitignore). O MESMO asset serve o nativo (copiado para o app
// SQLite do aparelho) e a web de depuração (importada pelo expo-sqlite).
// Uso: pnpm --dir apps/mobile sync-db
import { copyFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const origem = resolve(raiz, "data/gtfs/flavos.sqlite");
const destino = resolve(raiz, "apps/mobile/assets/flavos.sqlite");

if (!existsSync(origem)) {
  console.error(`[sync-db] não encontrei ${origem}`);
  console.error("[sync-db] gere antes com: python -m scraper sqlite");
  process.exit(1);
}
copyFileSync(origem, destino);
const mb = statSync(destino).size / 1024 / 1024;
console.log(`[sync-db] ${destino.replace(raiz, "")} atualizado (${mb.toFixed(1)} MB)`);
