// Consultas do app sobre o flavos.sqlite — SQL no pacote compartilhado para
// que app (expo-sqlite) e web de depuração (sql.js) usem exatamente a mesma
// lógica (doc do projeto: "um código, três alvos").

import type { FonteDados, HorarioParada, InfoFeed, Linha, TipoDia } from "./tipos";

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
 * Horários teóricos de uma linha inteira no tipo de dia, agrupados por
 * sentido (direction) — a tela de detalhe mostra por sentido e destaca a
 * próxima partida. O nome da coluna do calendar vem da allowlist TipoDia
 * (identificador não parametriza em SQL).
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
    `SELECT DISTINCT t.direction, st.departure, t.trip_id, t.headsign, r.short_name
     FROM trips AS t
     JOIN stop_times AS st ON st.trip_id = t.trip_id
     JOIN routes AS r ON r.route_id = t.route_id
     JOIN calendar AS c ON c.service_id = t.service_id
     WHERE t.route_id = ?
       AND c."${tipoDia}" = 1
       AND c.start_date <= ? AND c.end_date >= ?
     ORDER BY t.direction, st.departure`,
    [routeId, colunaDataIso, colunaDataIso],
  );
  const porSentido: Record<string, HorarioParada[]> = {};
  for (const r of cru) {
    const sentido = String(r.direction ?? -1);
    (porSentido[sentido] ??= []).push({
      tripId: r.trip_id,
      linhaNumero: r.short_name,
      partida: r.departure,
      destino: r.headsign,
    });
  }
  return porSentido;
}
