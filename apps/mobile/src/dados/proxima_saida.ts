// PRÓXIMA SAÍDA — lógica PURA (sem React/RN/banco), testada por node:test.
//
// Regras do documento (Moovit §1) e do dono:
// - FUSO FIXO America/Fortaleza (UTC-3, sem horário de verão): toda conta é
//   sobre o instante com offset constante — nunca sobre getHours() local do
//   aparelho (a galeria/web de outro fuso não muda o resultado).
// - GTFS: "24:30:00" pertence ao DIA DE SERVIÇO anterior e ocorre no dia
//   civil SEGUINTE 00:30 (padrão GTFS; o quadro de sexta publica a viagem
//   que sai depois da meia-noite de sábado). Por isso a escolha considera
//   os dias de serviço ONTEM/HOJE/AMANHÃ de uma vez.
// - "No instante exato" de um horário, ele É a próxima (em 0 min).
// - Depois da última do dia de serviço de hoje: estado 'ultima_passou' com a
//   primeira de amanhã marcada com rótulo claro.
// - calendar_dates não existe neste feed (feriados não tratados — o caller
//   mostra que o quadro é pelo calendar regular).

export type DiaServico = "ontem" | "hoje" | "amanha";

export interface SaidaProxima {
  readonly estado: "ha_proxima" | "ultima_passou" | "sem_horarios";
  /** horário civil ("HH:MM") exibido — 24:30 do feed sai como 00:30. */
  readonly horaExibida?: string;
  /** minutos inteiros até a partida (>= 0). */
  readonly emMinutos?: number;
  /** dia de SERVIÇO da partida (o quadro que a publica). */
  readonly diaServico?: DiaServico;
  /** partida como o feed publica ("24:30:00" fica explícito na tela de lista). */
  readonly partidaFeed?: string;
}

/** "6:00:00" | "24:30" -> minutos absolutos contados da meia-noite do dia de serviço. */
export function partidaParaMinutos(hhmmss: string): number {
  const [h = "0", m = "0", s = "0"] = hhmmss.split(":");
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export interface EntradasProxima {
  /** partidas do dia de serviço de ONTEM (podem conter >= 24:00). */
  readonly ontem: readonly string[];
  /** partidas do dia de serviço de HOJE. */
  readonly hoje: readonly string[];
  /** partidas do dia de serviço de AMANHÃ. */
  readonly amanha: readonly string[];
  /** instante atual (Date de qualquer fuso — a conta usa UTC-3 fixo). */
  readonly agora: Date;
}

/** Minutos absolutos desde a meia-noite de 1970-01-01 EM FORTALEZA (UTC-3).
 * Fortaleza 00:00 = 03:00Z ⇒ epochMin - 180 alinha a meia-noite local. */
export function minutosFortaleza(agora: Date): number {
  return Math.floor(agora.getTime() / 60_000) - 180; // UTC-3
}

function partidaAbsoluta(partida: string, diaServicoNumero: number): number {
  return diaServicoNumero * 1440 + partidaParaMinutos(partida);
}

/** "25:10:00" mostra como "01:10"; "6:05:00" como "06:05". */
export function horaCivil(hhmmss: string): string {
  const total = Math.round(partidaParaMinutos(hhmmss));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Escolhe a próxima entre as partidas dos três dias de serviço. Earliest
 * absolute minute >= agora; empate quebra para o dia mais próximo (hoje
 * antes de ontem — irrelevante na prática, instantes não se repetem).
 */
export function proximaSaida({ ontem, hoje, amanha, agora }: EntradasProxima): SaidaProxima {
  const absAgora = minutosFortaleza(agora);
  const diaHoje = Math.floor(absAgora / 1440);
  const inicioHoje = diaHoje * 1440;
  const diaOntem = diaHoje - 1;

  interface Candidata {
    readonly abs: number;
    readonly partida: string;
    readonly dia: DiaServico;
  }
  const todas: Candidata[] = [];
  for (const p of ontem) todas.push({ abs: partidaAbsoluta(p, diaOntem), partida: p, dia: "ontem" });
  for (const p of hoje) todas.push({ abs: partidaAbsoluta(p, diaHoje), partida: p, dia: "hoje" });
  for (const p of amanha) todas.push({ abs: partidaAbsoluta(p, diaHoje + 1), partida: p, dia: "amanha" });
  if (todas.length === 0) {
    return { estado: "sem_horarios" };
  }
  const futuras = todas.filter((c) => c.abs >= absAgora).sort((a, b) => a.abs - b.abs);
  const primeira = futuras[0];
  if (!primeira) {
    // nada mais hoje nem amanhã: mostra a primeira de amanhã com rótulo claro
    const listaAmanha = amanha.length > 0 ? amanha : null;
    if (!listaAmanha) {
      return { estado: "sem_horarios" };
    }
    const ordenada = [...listaAmanha].sort((a, b) => partidaParaMinutos(a) - partidaParaMinutos(b));
    const p = ordenada[0] ?? "";
    const abs = partidaAbsoluta(p, diaHoje + 1);
    return {
      estado: "ultima_passou",
      horaExibida: horaCivil(p),
      emMinutos: Math.round(abs - absAgora),
      diaServico: "amanha",
      partidaFeed: p,
    };
  }
  return {
    // Se a próxima sai do QUADRO de amanhã, o dia de serviço de hoje acabou:
    // a UI mostra "Última saída de hoje já passou" + a primeira de amanhã
    // com rótulo claro. Partidas 24:xx do quadro de hoje (que rolam amanhã
    // de madrugada) continuam 'ha_proxima' — a informação é imediata.
    estado: primeira.dia === "amanha" ? "ultima_passou" : "ha_proxima",
    horaExibida: horaCivil(primeira.partida),
    emMinutos: Math.round(primeira.abs - absAgora),
    diaServico: primeira.dia,
    partidaFeed: primeira.partida,
  };
}

/**
 * Rótulo humano do dia de serviço p/ a UI: a próxima saída publicada no
 * quadro de ONTEM pode sair HOJE de madrugada (GTFS 24:xx) — o rótulo precisa
 * dizer os dois fatos (quadro de origem + dia civil em que acontece).
 */
export function rotulosDeDia(s: SaidaProxima, nomes?: Partial<Record<DiaServico, string>>): string {
  const nomesBase: Record<DiaServico, string> = {
    ontem: nomes?.ontem ?? "quadro de ontem",
    hoje: nomes?.hoje ?? "quadro de hoje",
    amanha: nomes?.amanha ?? "quadro de amanhã",
  };
  if (s.diaServico === undefined) return "";
  const civilMudou = s.diaServico === "ontem" ? "· sai hoje" : s.partidaFeed !== undefined && partidaParaMinutos(s.partidaFeed) >= 1440 ? "· sai amanhã" : "";
  const nome = nomesBase[s.diaServico];
  return civilMudou.length > 0 ? `${nome} ${civilMudou}` : nome;
}
