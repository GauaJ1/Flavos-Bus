// Inspeciona o schema do feed (somente leitura).
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const dbPath = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "flavos.sqlite");
const db = new DatabaseSync(dbPath, { readOnly: true });
const t = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("tabelas: " + t.map((x) => x.name).join(", "));
for (const nt of ["calendar", "calendar_dates", "stop_times", "routes", "trips", "feed_info"]) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${nt})`).all();
    const n = db.prepare(`SELECT COUNT(*) c FROM ${nt}`).get();
    console.log(`\n${nt} (${n.c} linhas): ${cols.map((c) => c.name).join(", ")}`);
    const r = db.prepare(`SELECT * FROM ${nt} LIMIT 1`).all();
    if (r[0]) console.log("  ex: " + JSON.stringify(r[0]).slice(0, 500));
  } catch {
    console.log(`\n${nt}: SEM TABELA`);
  }
}
db.close();
