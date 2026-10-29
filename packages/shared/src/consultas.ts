// Consultas do app sobre o flavos.sqlite — SQL no pacote compartilhado para
// que app (expo-sqlite) e web de depuração (sql.js) usem exatamente a mesma
// lógica (doc do projeto: "um código, três alvos").

import type { FonteDados, HorarioParada, InfoFeed, Linha, TipoDia } from "./tipos";

/** O feed usa "H:MM:SS" sem zero à esquerda — padroniza para comparação e exibição. */
function normalizarHora(hhmmss: string): string {
  const [h = "", m = "", s = "00"] = hhmmss.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
}

function minutosDoDia(hhmmss: string): number {
  const partes = hhmmss.split(":");
  return Number(partes[0] ?? 0) * 60 + Number(partes[1] ?? 0);
}

export async function contarLinhas(fonte: FonteDados): Promise<number> {
  const linha = await fonte.unic<{ total: number }>("SELECT COUNT(*) AS total FROM routes");
  return linha?.total ?? 0;
}

export async function infoDoFeed(fonte: FonteDados): Promise<InfoFeed> {
  const pares = await fonte.consulta<{ chave: string; valor: string }>(
    "SELECT chave, valor FROM meta WHERE chave IN ('feed_version', 'gerado_em')",
  );
  const mapa = new Map(pares.map((p) => [p.chave, p.valor]));
  return { versao: mapa.get("feed_version") ?? "", geradoEm: mapa.get("gerado_em") ?? "" };
}

/**
 * Busca por número ou nome (doc seção 8: "ex.: 510, Tambaú"), sem acento.
 * lower() do SQLite não remove acento: normalizo o termo, e nomes da fonte
 * vêm sem acento em grande parte (histórico verificado no feed).
 */
export async function buscarLinhas(fonte: FonteDados, texto: string): Promise<Linha[]> {
  const bruto = texto.trim().toLowerCase();
  if (!bruto) {
    return todasAsLinhas(fonte);
  }
  const semAcento = bruto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const padrao = `%${semAcento}%`;
  const linhas = await fonte.consulta<{
    route_id: string;
    short_name: string;
    long_name: string;
  }>(
    `SELECT route_id, short_name, long_name
     FROM routes
     WHERE lower(short_name) LIKE ? OR lower(long_name) LIKE ?
     ORDER BY short_name
     LIMIT 100`,
    [padrao, padrao],
  );
  return linhas.map((r) => normalizarLinha(r.route_id, r.short_name, r.long_name));
}

export async function todasAsLinhas(fonte: FonteDados): Promise<Linha[]> {
  const linhas = await fonte.consulta<{
    route_id: string;
    short_name: string;
    long_name: string;
  }>("SELECT route_id, short_name, long_name FROM routes ORDER BY short_name");
  return linhas.map((r) => normalizarLinha(r.route_id, r.short_name, r.long_name));
}

function normalizarLinha(id: string, numero: string, nomeLongo: string): Linha {
  return {
    id,
    numero,
    // o nome curto vem antes do primeiro separador do route_long_name
    nome: nomeLongo.split(" | ")[0] ?? nomeLongo,
    descricao: nomeLongo,
  };
}

/** Busca a linha pelo route_id (deep link / detalhe). */
export async function linhaPorId(fonte: FonteDados, routeId: string): Promise<Linha | null> {
  const r = await fonte.unic<{ route_id: string; short_name: string; long_name: string }>(
    "SELECT route_id, short_name, long_name FROM routes WHERE route_id = ?",
    [routeId],
  );
  return r ? normalizarLinha(r.route_id, r.short_name, r.long_name) : null;
}

/** Coluna do calendar correspondente ao tipo de dia da data local. */
export function colunaDoDia(data: Date): TipoDia {
  const colunas: readonly TipoDia[] = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];
  return colunas[data.getDay()] ?? "segunda";
}

/**
 * Quadro de partidas de uma linha no tipo de dia, agrupado por sentido
 * (direction) — a "saída" de cada viagem é a partida na PRIMEIRA parada da
 * sequência (terminal), o que o quadro de horários publica. Isso não é o
 * horário por parada intermediária (a T-de parada vem depois no detalhe).
 * Identificador de coluna (tipoDia) vem da allowlist TipoDia.
 */
export async function horariosDaLinha(
  fonte: FonteDados,
  routeId: string,
  tipoDia: TipoDia,
  colunaDataIso: string,
): Promise<Record<string, HorarioParada[]>> {
  const cru = await fonte.consulta<{
    direction: number | null;
    departure: string;
    trip_id: string;
    headsign: string;
    short_name: string;
  }>(
    `SELECT t.direction, t.trip_id, t.headsign, r.short_name,
       (SELECT st.departure FROM stop_times AS st
        WHERE st.trip_id = t.trip_id
        ORDER BY st.seq ASC LIMIT 1) AS departure
     FROM trips AS t
     JOIN routes AS r ON r.route_id = t.route_id
     JOIN calendar AS c ON c.service_id = t.service_id
     WHERE t.route_id = ?
       AND c."${tipoDia}" = 1
       AND c.start_date <= ? AND c.end_date >= ?
     ORDER BY t.direction ASC, departure ASC`,
    [routeId, colunaDataIso, colunaDataIso],
  );
  const porSentido: Record<string, HorarioParada[]> = {};
  for (const r of cru) {
    if (r.departure == null) continue; // viagem sem stop_times (não deveria)
    const sentido = String(r.direction ?? -1);
    const lista = (porSentido[sentido] ??= []);
    lista.push({
      tripId: r.trip_id,
      linhaNumero: r.short_name,
      partida: normalizarHora(r.departure),
      destino: r.headsign,
    });
  }
  // ordenação cronológica em minutos: o ORDER BY textual desordena porque o
  // feed grava "5:00:00" sem zero à esquerda ("10:20" < "5:00" como texto)
  for (const lista of Object.values(porSentido)) {
    lista.sort((a, b) => minutosDoDia(a.partida) - minutosDoDia(b.partida));
  }
  return porSentido;
}
