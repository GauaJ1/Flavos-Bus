// Próxima saída — casos mínimos exigidos pelo dono + fuso fixo Fortaleza.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  minutosFortaleza,
  proximaSaida,
  type EntradasProxima,
} from "../src/dados/proxima_saida.ts";

function emFortaleza(y: number, mes: number, dia: number, h: number, min: number): Date {
  // instante UTC que corresponde a (h:min) civil de Fortaleza (UTC-3 fixo)
  return new Date(Date.UTC(y, mes - 1, dia, h + 3, min, 0));
}

function entrada(nos: Partial<EntradasProxima> & { agora: Date }): EntradasProxima {
  return { ontem: [], hoje: [], amanha: [], ...nos };
}

test("fuso fixo: 02:30 UTC = 23:30 do dia anterior em Fortaleza (nao usa o fuso do aparelho)", () => {
  // o instante 2026-01-10T02:30Z corresponde a 23:30 de 09/01 em Fortaleza.
  // A conta nunca chama getHours/getDate locais — o resultado é o MESMO
  // aparelho esteja em UTC, BRT ou UTC+13.
  const instante = new Date(Date.UTC(2026, 0, 10, 2, 30));
  const abs = minutosFortaleza(instante);
  assert.equal(((abs % 1440) + 1440) % 1440, 23 * 60 + 30);
  const diasFortaleza = Math.floor(abs / 1440);
  const diaEsperado = Math.floor((Date.UTC(2026, 0, 9, 3, 0) / 60_000 - 180) / 1440);
  assert.equal(diasFortaleza, diaEsperado); // começa contando de 09/01 00:00 BRT (= 03:00Z)
});

test("antes do primeiro horario: mostra o primeiro, em N min", () => {
  const r = proximaSaida(entrada({ hoje: ["06:00:00", "06:40:00"], agora: emFortaleza(2026, 1, 12, 5, 10) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.horaExibida, "06:00");
  assert.equal(r.emMinutos, 50);
  assert.equal(r.diaServico, "hoje");
});

test("entre dois horarios: escolhe o proximo", () => {
  const r = proximaSaida(entrada({ hoje: ["06:00:00", "06:40:00", "07:20:00"], agora: emFortaleza(2026, 1, 12, 6, 45) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.horaExibida, "07:20");
  assert.equal(r.emMinutos, 35);
});

test("no instante exato de um horario: ele e a proxima (em 0 min)", () => {
  const r = proximaSaida(entrada({ hoje: ["06:00:00", "06:40:00"], agora: emFortaleza(2026, 1, 12, 6, 40) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.partidaFeed, "06:40:00");
  assert.equal(r.emMinutos, 0);
});

test("depois do ultimo: ultima_passou + primeira de amanha com rótulo de dia claro", () => {
  const r = proximaSaida(entrada({ hoje: ["05:00:00", "23:10:00"], amanha: ["05:10:00"], agora: emFortaleza(2026, 1, 12, 23, 30) }));
  assert.equal(r.estado, "ultima_passou");
  assert.equal(r.horaExibida, "05:10");
  assert.equal(r.diaServico, "amanha");
  assert.equal(r.emMinutos, 5 * 60 + 40); // 23:30 -> 05:10 de amanhã
  assert.equal(r.partidaFeed, "05:10:00");
});

test("GTFS >= 24h pertence ao dia de servico anterior: 24:30 de quinta rola sexta 00:30", () => {
  // hoje = sexta 00:10; o quadro de QUINTA tem "24:30:00" (ontem)
  const r = proximaSaida(entrada({ ontem: ["24:30:00"], hoje: ["06:00:00"], agora: emFortaleza(2026, 1, 9, 0, 10) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.horaExibida, "00:30"); // exibição civil
  assert.equal(r.diaServico, "ontem"); // quadro que publica
  assert.equal(r.emMinutos, 20); // 00:10 -> 00:30 de hoje (civil)
  assert.equal(r.partidaFeed, "24:30:00"); // transparência do dado do feed
});

test("24:30 do quadro de HOJE rola amanha 00:30 (meia-noite virada)", () => {
  const r = proximaSaida(entrada({ hoje: ["23:00:00", "24:30:00"], amanha: ["06:00:00"], agora: emFortaleza(2026, 1, 9, 23, 50) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.diaServico, "hoje"); // do quadro de hoje
  assert.equal(r.horaExibida, "00:30"); // amanhã civil
  assert.equal(r.emMinutos, 40);
});

test("domingo sem horarios: sem_horarios (lista vazia)", () => {
  const r = proximaSaida(entrada({ hoje: [], amanha: [], agora: emFortaleza(2026, 1, 11, 10, 0) }));
  assert.equal(r.estado, "sem_horarios");
  assert.equal(r.horaExibida, undefined);
});

test("todas vazias: sem_horarios mesmo com dia avancado", () => {
  const r = proximaSaida(entrada({ ontem: [], hoje: [], amanha: [], agora: emFortaleza(2026, 1, 11, 23, 59) }));
  assert.equal(r.estado, "sem_horarios");
});

test("lista desordenada do banco: escolha continua correta", () => {
  const r = proximaSaida(entrada({ hoje: ["07:20:00", "06:40:00", "06:00:00"], agora: emFortaleza(2026, 1, 12, 6, 0) }));
  assert.equal(r.partidaFeed, "06:00:00");
  assert.equal(r.emMinutos, 0);
});

test("horario no passado recente nao e escolhido (pior madrugada: 00:30 de ontem ja passou)", () => {
  // 00:50 de sabado; a 24:30 de sexta (00:30 de sabado) JÁ passou; próximo é o do quadro de sábado
  const r = proximaSaida(entrada({ ontem: ["24:30:00"], hoje: ["06:00:00"], agora: emFortaleza(2026, 1, 10, 0, 50) }));
  assert.equal(r.estado, "ha_proxima");
  assert.equal(r.diaServico, "hoje");
  assert.equal(r.horaExibida, "06:00");
  assert.equal(r.emMinutos, 310);
});
