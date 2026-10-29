// Copia data/gtfs/flavos.sqlite para os assets do app (58 MB; fica fora do
// git — ver .gitignore). Uso: pnpm --dir apps/mobile sync-db
import { copyFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const origem = resolve(raiz, "data/gtfs/flavos.sqlite");
const destino = resolve(raiz, "apps/mobile/assets/flavos.sqlite");

if (!existsSync(origem)) {
  console.error(`[sync-db] não encontrei ${origem}`);
  console.error("[sync-db] gere antes com: pnpm --dir tools/scraper exec python -m scraper sqlite");
  process.exit(1);
}
copyFileSync(origem, destino);
const mb = statSync(destino).size / 1024 / 1024;
console.log(`[sync-db] flavos.sqlite atualizado nos assets (${mb.toFixed(1)} MB)`);
