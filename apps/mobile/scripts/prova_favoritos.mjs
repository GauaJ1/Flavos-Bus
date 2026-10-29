// PROVA DA CORREÇÃO 2: o banco do usuário (flavos_usuario.db) sobrevive à
// troca do arquivo do feed, e o favorito órfão é detectado no cruzamento.
// Roda o MESMO SQL do adaptador (src/db/banco_usuario.ts) via node:sqlite
// (Node 24 nativo), contra uma CÓPIA real do flavos.sqlite.
// Uso: node scripts/prova_favoritos.mjs
import { DatabaseSync } from "node:sqlite";
import { copyFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const feedFonte = join(raiz, "data", "gtfs", "flavos.sqlite");
const trabalho = join(raiz, "apps", "mobile", ".tmp", "prova_favoritos");
const feedPath = join(trabalho, "flavos.sqlite"); // "arquivo do feed" de trabalho
const usuarioPath = join(trabalho, "flavos_usuario.db");

let falhas = 0;
const check = (nome, ok, info = "") => {
  if (!ok) falhas += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${nome}${info ? ` — ${info}` : ""}`);
};

// 0) ambiente limpo (só a pasta .tmp/prova_favoritos, gitignored)
rmSync(trabalho, { recursive: true, force: true });
mkdirSync(trabalho, { recursive: true });

// 1) feed v1 = cópia real; banco do usuário criado com o MESMO SQL do adaptador
copyFileSync(feedFonte, feedPath);
const usuario = new DatabaseSync(usuarioPath);
usuario.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS favoritos_linha (
    route_id  TEXT PRIMARY KEY NOT NULL,
    criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS favoritos_parada (
    stop_id   TEXT PRIMARY KEY NOT NULL,
    criado_em TEXT NOT NULL
  );
`);
check("banco do usuário criado (tabelas de favoritos)", true);

// 2) usuário favorita 2 linhas: um id que existirá sempre (42001) e um que
//    será removido na "versão nova" do feed (pego um id real do feed v1)
const usuarioFeed = new DatabaseSync(feedPath);
const alvoPermanent = "42001";
const linhaAlvoRemovida = usuarioFeed
  .prepare("SELECT route_id FROM routes WHERE route_id <> ? ORDER BY route_id LIMIT 1")
  .get(alvoPermanent).route_id;

const insere = usuario.prepare(
  "INSERT OR REPLACE INTO favoritos_linha (route_id, criado_em) VALUES (?, ?)",
);
const agora = new Date().toISOString();
insere.run(alvoPermanent, agora);
insere.run(linhaAlvoRemovida, agora);
const antes = usuario.prepare("SELECT count(*) AS n FROM favoritos_linha").get().n;
check(`favoritos gravados no banco do usuário (${alvoPermanent} + ${linhaAlvoRemovida})`, antes === 2, `n=${antes}`);
usuarioFeed.close();

// 3) sai uma VERSÃO NOVA do feed: o arquivo é SUBSTITUÍDO por inteiro
//    (simulado: geramos feed_v2 e sobrepomos o arquivo do feed), e essa
//    versão remove a linha ${linhaAlvoRemovida} das routes
const feedV2Path = join(trabalho, "flavos_v2.sqlite");
copyFileSync(feedPath, feedV2Path);
const editor = new DatabaseSync(feedV2Path);
editor.prepare("DELETE FROM routes WHERE route_id = ?").run(linhaAlvoRemovida);
const nRoutesV2 = editor.prepare("SELECT count(*) AS n FROM routes").get().n;
editor.close();
rmSync(feedPath); // SUBSTITUIÇÃO do arquivo do feed (tocar no cenário real)
copyFileSync(feedV2Path, feedPath);
const feedNovo = new DatabaseSync(feedPath);
const aindaTem = feedNovo.prepare("SELECT count(*) AS n FROM routes WHERE route_id = ?").get(linhaAlvoRemovida).n;
check(`feed foi substituído e a linha ${linhaAlvoRemovida} NÃO existe mais nele`, aindaTem === 0, `routes v2=${nRoutesV2}`);

// 4) reabre o banco do usuário (novo handle, como no próximo boot): os
//    favoritos continuam lá — a troca do feed NÃO os apagou
const usuario2 = new DatabaseSync(usuarioPath);
const sobreviventes = usuario2.prepare(
  "SELECT route_id FROM favoritos_linha ORDER BY route_id",
).all().map((r) => r.route_id);
check(
  "favoritos sobrevivem à substituição do feed",
  sobreviventes.includes(alvoPermanent) && sobreviventes.includes(linhaAlvoRemovida),
  JSON.stringify(sobreviventes),
);

// 5) cruzamento com o feed novo: ${alvoPermanent} existe; ${linhaAlvoRemovida}
//    virou ÓRFÃO — o app classifica sem quebrar (mesmo SQL de checagem)
const existeNoFeed = (id) =>
  feedNovo.prepare("SELECT count(*) AS n FROM routes WHERE route_id = ?").get(id).n > 0;
const estado = sobreviventes.map((id) => ({
  id,
  status: existeNoFeed(id) ? "ok" : "orfo",
}));
const permanent = estado.find((e) => e.id === alvoPermanent);
const orfo = estado.find((e) => e.id === linhaAlvoRemovida);
check(`${alvoPermanent} segue utilizável (ok)`, permanent?.status === "ok");
check(`${linhaAlvoRemovida} detectado como "Linha não existe mais no feed atual"`, orfo?.status === "orfo");

// 6) ação de remover o órfão funciona (mesmo SQL do adaptador)
usuario2.prepare("DELETE FROM favoritos_linha WHERE route_id = ?").run(linhaAlvoRemovida);
const depois = usuario2.prepare("SELECT route_id FROM favoritos_linha").all().map((r) => r.route_id);
check("remoção do órfão", JSON.stringify(depois) === JSON.stringify([alvoPermanent]), JSON.stringify(depois));

usuario2.close();
feedNovo.close();
usuario.close();
console.log(falhas === 0 ? "\n[prova] TODAS as verificações passaram" : `\n[prova] ${falhas} FALHA(S)`);
process.exit(falhas ? 1 : 0);
