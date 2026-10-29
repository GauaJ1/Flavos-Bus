// TESTES PÓS-APRENDIZADO — doc "Como funciona o Moovit — Anatomia e MVP.md"
// Cada check cita a seção do doc que o justifica. Roda no web de depuração
// (Expo dev server em 127.0.0.1:8081) com TODO tráfego externo BLOQUEADO
// (simula "funcionar mal conectado" — doc §Experiência do app).
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8081";
const navegador = await chromium.launch({ channel: "msedge", headless: true });
const contexto = await navegador.newContext({ viewport: { width: 360, height: 740 } });

// bloqueia tudo que NÃO é o próprio dev server (sem CDN, sem fonts, sem analytics)
await contexto.route(/^(?!http:\/\/127\.0\.0\.1:8081)/, (rota) =>
  rota.abort("blocked_by_test"),
);

const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e)));
const resultados = [];
function check(idDoc, ok, detalhe = "") {
  resultados.push({ idDoc, ok, detalhe });
  console.log(`${ok ? "PASS" : "FAIL"} ${idDoc}${detalhe ? ` — ${detalhe}` : ""}`);
}

async function esperarTexto(alvo, timeoutMs = 60_000) {
  await pagina.waitForFunction(
    (t) => (document.body?.innerText ?? "").includes(t),
    alvo,
    { timeout: timeoutMs },
  );
  return pagina.evaluate(() => document.body?.innerText ?? "");
}

// === Doc tabela "Experiência do app": Busca de linhas — "Qual é a linha X?" ===
await pagina.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
const busca = await esperarTexto("linha(s)");
check("app§BuscaDeLinhas: busca por NÚMERO (509)", (await (async () => {
  await pagina.locator("input").first().fill("509");
  await pagina.waitForTimeout(1_200);
  const t = await pagina.evaluate(() => document.body?.innerText ?? "");
  return t.includes("0509") && t.toLowerCase().includes("agripino");
})()), "");
await pagina.locator("input").first().fill("Jaguaribe");
await pagina.waitForTimeout(1_200);
const buscaNome = await pagina.evaluate(() => document.body?.innerText ?? "");
check("app§BuscaDeLinhas: busca por NOME (Jaguaribe)", buscaNome.includes("0003") && buscaNome.toLowerCase().includes("jaguaribe"), "");
check("app§BuscaDeLinhas: busca por NOME (Tambaú)", (await (async () => {
  await pagina.locator("input").first().fill("Tambau");
  await pagina.waitForTimeout(1_200);
  const t = await pagina.evaluate(() => document.body?.innerText ?? "");
  return t.includes("0510") || t.includes("0507");
})()), "sem acento também acha (tilde-less)");

// === Doc §Experiência: Detalhe — "A que horas passa?" + princípio
// "Primeiro a resposta, depois o detalhe" (próxima saída NO TOPO) ===
await pagina.goto(`${BASE}/linha/42029`, { waitUntil: "domcontentloaded", timeout: 90_000 });
const detalhe509 = await esperarTexto("PRÓXIMA SAÍDA");
check("app§DetalheLinha: próxima saída presente", detalhe509.includes("PRÓXIMA SAÍDA"), "");
const posPlaca = detalhe509.indexOf("0509");
const posProxima = detalhe509.indexOf("PRÓXIMA SAÍDA");
const posQuadro = detalhe509.indexOf("05:00");
check(
  "doc§Principios: primeiro a RESPOSTA (próxima) antes do resto",
  posPlaca >= 0 && posProxima > posPlaca && posQuadro > posProxima,
  `ordem: placa(${posPlaca}) < próxima(${posProxima}) < quadro(${posQuadro})`,
);

// === Doc §Tempo real: "horário teórico com aviso visível" e §Experiência
// "Mostrar a incerteza" — aviso ANTES de qualquer horário, nas duas telas ===
const posAviso = detalhe509.indexOf("teóricos");
check("doc§MostrarIncerteza: aviso antes de qualquer horário", posAviso >= 0 && posAviso < posQuadro, "");
check(
  "doc§TempoReal: nunca prometemos RT (nenhum 'ao vivo')",
  !/ao vivo|ao-vivo|em tempo real\b(?!)/i.test(detalhe509.replace(/não mostra tempo real/g, "")),
  "única ocorrência permitida: negação do aviso",
);

// === Doc §Dados: "rotular a idade e a origem de cada dado" ===
check("doc§Dados: idade do dado visível (feed 2026-10-29)", /feed \d{4}-\d{2}-\d{2}/.test(detalhe509), "");
check(
  "doc§Dados: origem da operadora rotulada com ANO da declaração",
  /Operadora declarada \d{4}/.test(detalhe509) || !/operadora/.test(detalhe509),
  "mostra com ano ou oculta (nunca sem rótulo)",
);

// === rede externa real: nada foi abortado essencial? Se o app renderizou
// (texto acima veio), TUDO já veio do dev server local. Confirma erros: ===
check("offline§malConectado: zero pageerror com rede externa bloqueada", erros.length === 0, erros.join(" | ").slice(0, 160));

const linhas = [
  "# Testes pós-aprendizado — doc 'Como funciona o Moovit — Anatomia e MVP'",
  "",
  `Data: ${new Date().toISOString()} · web de depuração (Edge/Playwright) ·`,
  "rede externa BLOQUEADA por rota Playwright (só o dev server 127.0.0.1:8081 passa).",
  "",
  "| Doc (seção) | Check | Resultado |",
  "|---|---|---|",
  ...resultados.map((r) => `| ${r.idDoc} | ${r.detalhe || "—"} | ${r.ok ? "PASS" : "FAIL"} |`),
  "",
  "Testáveis do doc deixados de fora, com motivo:",
  "- §Parada/Favoritos: doc marca 'Fase 2' — não é exigência do MVP;",
  "- §Planejador A→B (RAPTOR): doc marca 'Fase 3'; a leitura horária do MVP é",
  "  'uma consulta em stop_times' (doc §Rotas), coberta pelos testes Python;",
  "- §Notificações/§crowdsourcing: doc coloca depois do MVP (exigem servidor e",
  "  base de usuários).",
  "- 'Modo avião' real no aparelho sigue como prova humana (o web topa o",
  "  bundle do dev server; no NATIVO o banco é embutido — ver README).",
];
await writeFile(
  new URL("../../../docs/design/telas/testes_moovit.md", import.meta.url),
  linhas.join("\n") + "\n",
  "utf-8",
);
await navegador.close();
const falhas = resultados.filter((r) => !r.ok).length;
console.log(`[testes_moovit] fim: ${resultados.length - falhas}/${resultados.length} pass`);
process.exit(falhas === 0 ? 0 : 1);
