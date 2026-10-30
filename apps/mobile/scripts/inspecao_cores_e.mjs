import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const dbPath = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "flavos.sqlite");
const db = new DatabaseSync(dbPath, { readOnly: true });
const es = db.prepare("SELECT short_name, color, text_color FROM routes WHERE short_name LIKE 'E%' ORDER BY short_name").all();
console.log("executivas:", JSON.stringify(es, null, 1));
db.close();