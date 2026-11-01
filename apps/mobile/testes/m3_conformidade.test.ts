// Conformidade M3 — cada medida derivada do m3_spec.json tem que bater com
// o token usado no código, e todo papel de cor tem que existir nos dois temas.
// Este teste é a "prova numérica" do Passo 9: se alguém mexer num token sem
// mexer na spec (ou vice-versa), ele reprova.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { m3_medidas, forma, estadoM3, tiposM3, papeis, identidade } from "../src/tema/tokens.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(readFileSync(join(raiz, "src/tema/m3_spec.json"), "utf8"));
const M = m3_medidas;

test("navigationBar: altura 80, indicador 64x32, ícone 24, 3-5 destinos (A)", () => {
  assert.equal(M.navigationBar.altura, spec.componentes.navigationBar.altura_container.valor);
  assert.equal(M.navigationBar.indicadorLargura, spec.componentes.navigationBar.indicador.largura.valor);
  assert.equal(M.navigationBar.indicadorAltura, spec.componentes.navigationBar.indicador.altura.valor);
  assert.equal(M.navigationBar.icone, spec.componentes.navigationBar.icone_tamanho.valor);
  assert.equal(M.navigationBar.destinosMin, spec.componentes.navigationBar.destinos.min);
  assert.equal(M.navigationBar.destinosMax, spec.componentes.navigationBar.destinos.max);
  assert.equal(M.navigationBar.gapIconeRotulo, spec.componentes.navigationBar.gap_icone_rotulo.valor);
});

test("topAppBar: 64dp (A)", () => {
  assert.equal(M.topAppBar.altura, spec.componentes.topAppBarSmall.altura.valor);
});

test("searchBar: 56dp (A)", () => {
  assert.equal(M.searchBar.altura, spec.componentes.searchBar.altura.valor);
});

test("botao: 40dp altura, ícone 18, padding 16 (A + projeto)", () => {
  assert.equal(M.botao.altura, spec.componentes.botao.altura.valor);
  assert.equal(M.botao.icone, spec.componentes.botao.icone.valor);
  assert.equal(M.botao.paddingHorizontal, spec.componentes.botao.padding_horizontal.valor);
});

test("listItem: 56/72/88dp (A)", () => {
  assert.equal(M.listItem.altura1Linha, spec.componentes.listItem.altura_1_linha.valor);
  assert.equal(M.listItem.altura2Linhas, spec.componentes.listItem.altura_2_linhas.valor);
  assert.equal(M.listItem.altura3Linhas, spec.componentes.listItem.altura_3_linhas.valor);
});

test("chip: 32dp, ícone 18 (A)", () => {
  assert.equal(M.chip.altura, spec.componentes.chip.altura.valor);
  assert.equal(M.chip.icone, spec.componentes.chip.icone.valor);
});

test("segmentedButton: 40dp (A)", () => {
  assert.equal(M.segmentedButton.altura, spec.componentes.segmentedButton.altura.valor);
});

test("bottomSheet: cantos 28, alça 32x4, elevação level1 (A)", () => {
  assert.equal(M.bottomSheet.cantosSuperiores, spec.componentes.bottomSheet.cantos_superiores.valor);
  assert.equal(M.bottomSheet.alcaLargura, spec.componentes.bottomSheet.alca.largura.valor);
  assert.equal(M.bottomSheet.alcaAltura, spec.componentes.bottomSheet.alca.altura.valor);
  assert.equal(M.bottomSheet.elevacao, 1);
});

test("divider: 1dp (A)", () => {
  assert.equal(M.divider.espessura, spec.componentes.divider.espessura.valor);
});

test("forma: escala 0/4/8/12/16/28/full (A)", () => {
  assert.equal(forma.none, spec.forma.none.valor);
  assert.equal(forma.extraPequena, spec.forma.extraPequena.valor);
  assert.equal(forma.pequena, spec.forma.pequena.valor);
  assert.equal(forma.media, spec.forma.media.valor);
  assert.equal(forma.grande, spec.forma.grande.valor);
  assert.equal(forma.extraGrande, spec.forma.extraGrande.valor);
  assert.equal(forma.full, 999);
});

test("estado: 0,08/0,10/0,10/0,16 e desabilitado 0,38/0,12 (A)", () => {
  assert.equal(estadoM3.hover, spec.estado.hover.valor);
  assert.equal(estadoM3.foco, spec.estado.foco.valor);
  assert.equal(estadoM3.pressionado, spec.estado.pressionado.valor);
  assert.equal(estadoM3.arrastado, spec.estado.arrastado.valor);
  assert.equal(estadoM3.desabilitadoConteudo, spec.estado.desabilitado_conteudo.valor);
  assert.equal(estadoM3.desabilitadoContainer, spec.estado.desabilitado_container.valor);
});

test("tipografia: os 15 estilos batem com a spec", () => {
  const estilos = spec.tipografia.estilos as Record<string, { tamanho: number; alturaLinha: number; peso: number; tracking: number }>;
  assert.equal(Object.keys(estilos).length, 15);
  for (const [nome, s] of Object.entries(estilos)) {
    const t = (tiposM3 as Record<string, { tamanho: number; linhaAltura: number; peso: string; tracking: number }>)[nome];
    assert.ok(t, `estilo ${nome} ausente nos tokens`);
    assert.equal(t.tamanho, s.tamanho, `${nome}.tamanho`);
    assert.equal(t.linhaAltura, s.alturaLinha, `${nome}.linhaAltura`);
    assert.equal(t.peso, String(s.peso), `${nome}.peso`);
    assert.equal(t.tracking, s.tracking, `${nome}.tracking`);
  }
});

test("papéis de cor: mesmas chaves nos dois temas e hex válido", () => {
  assert.deepEqual(Object.keys(papeis.claro), Object.keys(papeis.escuro));
  for (const tema of ["claro", "escuro"] as const) {
    for (const [papel, cor] of Object.entries(papeis[tema])) {
      assert.match(cor, /^#[0-9A-Fa-f]{6}$/, `${tema}.${papel} = ${cor}`);
    }
    for (const [papel, cor] of Object.entries(identidade[tema])) {
      assert.match(cor, /^#[0-9A-Fa-f]{6}$/, `${tema}.identidade.${papel} = ${cor}`);
    }
  }
});

test("estrutura escura: Lowest < surface < Low < base < High < Highest (luminância)", () => {
  const lum = (hex: string) => {
    const t = hex.slice(1);
    const c = [0, 2, 4].map((i) => parseInt(t.slice(i, i + 2), 16) / 255);
    const lin = c.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
  };
  const e = papeis.escuro;
  const ordem = [e.surfaceContainerLowest, e.surface, e.surfaceContainerLow, e.surfaceContainer, e.surfaceContainerHigh, e.surfaceContainerHighest];
  const lums = ordem.map(lum);
  for (let i = 1; i < lums.length; i++) {
    assert.ok(lums[i]! > lums[i - 1]!, `degrau ${i} (${ordem[i]}) não é mais claro que o anterior (${ordem[i - 1]})`);
  }
});

test("medidas aprovadas como 'decisão do projeto' estão marcadas origem 'projeto'", () => {
  const nb = spec.componentes.navigationBar.gap_icone_rotulo;
  assert.equal(nb.origem, "projeto");
  assert.equal(spec.componentes.botao.padding_horizontal.origem, "projeto");
  assert.equal(spec.componentes.segmentedButton.padding_horizontal_min.origem, "projeto");
  assert.equal(spec.componentes.bottomSheet.alca.faixa_48.origem, "projeto");
  assert.equal(spec.componentes.segmentedButton.borda.espessura.origem, "projeto");
});

test("nenhuma medida em código tem 'verificado: false' sem origem aprovada", () => {
  const semFonte: string[] = [];
  const visitar = (node: unknown, caminho: string) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n, i) => visitar(n, `${caminho}[${i}]`));
    const obj = node as Record<string, unknown>;
    if (obj["verificado"] === false && obj["origem"] !== "projeto") semFonte.push(caminho);
    for (const [k, v] of Object.entries(obj)) visitar(v, `${caminho}.${k}`);
  };
  visitar(spec.componentes, "componentes");
  // os que sobraram são os EXCLUÍDOS (spinner/Expressive) — documentados
  const permitidos = semFonte.filter((c) => !/carregando|descontinuado_expressive/.test(c));
  assert.deepEqual(permitidos, [], `medidas sem fonte aprovada: ${permitidos.join(", ")}`);
});

test("exclusões do Portão A estão registradas", () => {
  assert.ok(spec.meta.excluidos.some((e: string) => /spinner/i.test(e)));
  assert.ok(spec.meta.excluidos.some((e: string) => /Expressive/i.test(e)));
});
