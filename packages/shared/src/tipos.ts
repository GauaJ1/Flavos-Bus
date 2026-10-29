// Tipos do domínio Flavos Bus (doc do projeto, seção 8): tudo que o app
// mostra vem do flavos.sqlite — nada inventado. Os nomes seguem o schema
// do banco (routes/trips/stop_times/calendar).

export interface Linha {
  /** route_id estável (favoritos dependem dele — doc seção 6) */
  readonly id: string;
  readonly numero: string;
  readonly nome: string;
  /** texto completo da fonte, ex.: "Radial | ida 3.55 km ... operadora declarada 2024: X" */
  readonly descricao: string;
}

export interface HorarioParada {
  readonly tripId: string;
  readonly linhaNumero: string;
  readonly partida: string;
  readonly destino: string;
}

/** tipo de dia conforme quadro de horários do documento (útil, sábado, domingo) */
export type TipoDia = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

export interface InfoFeed {
  readonly versao: string;
  readonly geradoEm: string;
}

/** Conexão mínima que a plataforma fornece: expo-sqlite (nativo) ou sql.js (web). */
export interface FonteDados {
  consulta<T>(sql: string, parametros?: ReadonlyArray<string | number>): Promise<T[]>;
  unic<T>(sql: string, parametros?: ReadonlyArray<string | number>): Promise<T | null>;
}
