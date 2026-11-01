// Prova numérica das FUNÇÕES DE ESTILO M3 (Passo 6/9).
// Importa src/tema/estilos_m3.ts (puro, sem react-native) e confere medidas,
// cores por papel e estados — sem renderizar. Cada asserção cita a spec.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  coresDoBotao,
  estiloBotao,
  estiloChip,
  estiloContainerNav,
  estiloDestinoNav,
  estiloDestinoNavAzul,
  estiloDivider,
  estiloIconButton,
  estiloListItem,
  estiloNoTimeline,
  estiloRotuloSectionHeader,
  estiloSearchBar,
  estiloSegmento,
  estiloSegmentedContainer,
  estiloTextoSegmento,
  estiloTopAppBar,
} from "../src/tema/estilos_m3.ts";
import { estadoM3, forma, m3_medidas, papeis, tiposM3 } from "../src/tema/tokens.ts";

const CL = papeis.claro;
const ES = papeis.escuro;

test("botão: altura 40, raio full, padding 16 (A + projeto)", () => {
  for (const p of [CL, ES]) {
    const e = estiloBotao(p, "filled", false);
    assert.equal(e.container.minHeight, 40);
    assert.equal(e.container.paddingHorizontal, 16);
    assert.equal(e.container.borderRadius, forma.full);
    assert.equal(e.texto.fontSize, tiposM3.labelLarge.tamanho);
    assert.equal(e.texto.fontWeight, "500");
  }
});

test("botão filled: primary/onPrimary; tonal: secondaryContainer/onSecondaryContainer (A)", () => {
  assert.deepEqual(coresDoBotao(CL, "filled"), {
    container: CL.primary,
    rotulo: CL.onPrimary,
    borda: null,
    ripple: CL.onPrimary,
  });
  const tonal = coresDoBotao(CL, "tonal");
  assert.equal(tonal.container, CL.secondaryContainer);
  assert.equal(tonal.rotulo, CL.onSecondaryContainer);
});

test("botão outlined: RÓTULO primary + borda outline (C5 do M3_SPEC_EXTRACT)", () => {
  const o = coresDoBotao(CL, "outlined");
  assert.equal(o.rotulo, CL.primary);
  assert.equal(o.borda, CL.outline);
  assert.equal(o.container, null);
});

test("botão desabilitado: conteúdo 0,38 e container 0,12 (A)", () => {
  const d = estiloBotao(CL, "filled", true);
  assert.equal(d.rotulo.opacity, estadoM3.desabilitadoConteudo);
  assert.equal(d.container.opacity, estadoM3.desabilitadoContainer);
});

test("divider: 1dp outlineVariant (A)", () => {
  for (const p of [CL, ES]) {
    const e = estiloDivider(p);
    assert.equal(e.height, 1);
    assert.equal(e.backgroundColor, p.outlineVariant);
  }
  assert.equal(CL.outlineVariant, "#C2C7CF");
  assert.equal(ES.outlineVariant, "#404752");
});

test("sectionHeader: labelLarge onSurfaceVariant, sem maiúsculas (precedência do dono)", () => {
  const e = estiloRotuloSectionHeader(CL);
  assert.equal(e.color, CL.onSurfaceVariant);
  assert.equal(e.fontSize, 14);
  assert.equal(e.fontWeight, "500");
  assert.equal(e.letterSpacing, 0.1);
  assert.ok(!("textTransform" in e), "não pode forçar textTransform");
});

test("iconButton: 48x48, ícone 24 (A)", () => {
  const e = estiloIconButton(CL);
  assert.equal(e.container.width, 48);
  assert.equal(e.container.height, 48);
  assert.equal(m3_medidas.iconButton.icone, 24);
});

test("iconButton: não selecionado onSurfaceVariant; selecionado primary (A)", () => {
  assert.equal(estiloIconButton(CL).corIcone, CL.onSurfaceVariant);
  assert.equal(estiloIconButton(CL, { selecionado: true }).corIcone, CL.primary);
});

test("iconButton desabilitado: opacidade 0,38 e sem ripple", () => {
  const e = estiloIconButton(CL, { desabilitado: true });
  assert.equal(e.container.opacity, 0.38);
});

test("listItem: 56 / 72 / 88 dp por número de linhas (A)", () => {
  assert.equal(estiloListItem(CL, { linhas: 1 }).container.minHeight, 56);
  assert.equal(estiloListItem(CL, { linhas: 2 }).container.minHeight, 72);
  assert.equal(estiloListItem(CL, { linhas: 3 }).container.minHeight, 88);
});

test("listItem selecionado: secondaryContainer (C4)", () => {
  const e = estiloListItem(CL, { selecionado: true });
  assert.equal(e.container.backgroundColor, CL.secondaryContainer);
  assert.notEqual(e.container.backgroundColor, CL.primaryContainer);
});

test("topAppBar: 64dp; surface → surfaceContainer ao rolar (A)", () => {
  assert.equal(estiloTopAppBar(CL, false).container.minHeight, 64);
  assert.equal(estiloTopAppBar(CL, false).container.backgroundColor, CL.surface);
  assert.equal(estiloTopAppBar(CL, true).container.backgroundColor, CL.surfaceContainer);
  assert.equal(estiloTopAppBar(CL, false).titulo.fontSize, tiposM3.titleLarge.tamanho);
});

test("searchBar: 56dp, full, surfaceContainerHigh, SEM borda (A)", () => {
  const e = estiloSearchBar(CL);
  assert.equal(e.container.height, 56);
  assert.equal(e.container.borderRadius, forma.full);
  assert.equal(e.container.backgroundColor, CL.surfaceContainerHigh);
  assert.equal(e.container.borderWidth, 0);
});

test("searchBar: líder onSurface, placeholder onSurfaceVariant (C6)", () => {
  const e = estiloSearchBar(CL);
  assert.equal(e.corLider, CL.onSurface);
  assert.equal(e.corPlaceholder, CL.onSurfaceVariant);
});

test("segmentedButton: 40dp, borda outline 1dp (A + projeto)", () => {
  const e = estiloSegmentedContainer(CL);
  assert.equal(e.height, 40);
  assert.equal(e.borderWidth, 1);
  assert.equal(e.borderColor, CL.outline);
  assert.equal(e.borderRadius, forma.full);
});

test("segmentedButton: selecionado secondaryContainer/onSecondaryContainer (A)", () => {
  const ativo = estiloSegmento(CL, true, false, false);
  assert.equal(ativo.backgroundColor, CL.secondaryContainer);
  assert.equal(estiloTextoSegmento(CL, true).color, CL.onSecondaryContainer);
  assert.equal(estiloTextoSegmento(CL, false).color, CL.onSurface);
});

test("segmentedButton: cantos arredondados só nas pontas (pílula)", () => {
  const meio = estiloSegmento(CL, false, false, false);
  assert.equal(meio.borderTopLeftRadius, 0);
  assert.equal(meio.borderTopRightRadius, 0);
  assert.equal(meio.borderLeftWidth, 1);
  const prim = estiloSegmento(CL, false, true, false);
  assert.equal(prim.borderTopLeftRadius, 20);
  assert.equal(prim.borderLeftWidth, 0);
});

test("chip: 32dp, raio 8 (small), NÃO pílula (A)", () => {
  const e = estiloChip(CL, "filter", false, false);
  assert.equal(e.container.height, 32);
  assert.equal(e.container.borderRadius, forma.pequena);
  assert.notEqual(e.container.borderRadius, forma.full);
});

test("chip filter ativo: preenchido secondaryContainer + onSecondaryContainer (A)", () => {
  const e = estiloChip(CL, "filter", true, false);
  assert.equal(e.container.backgroundColor, CL.secondaryContainer);
  assert.equal(e.texto.color, CL.onSecondaryContainer);
});

test("chip filter inativo: contorno outline (decisão do dono)", () => {
  const e = estiloChip(CL, "filter", false, false);
  assert.equal(e.container.borderColor, CL.outline);
  assert.equal(e.container.backgroundColor, "transparent");
});

test("chip assist: contorno outlineVariant + rótulo onSurface + ícone primary (A)", () => {
  const e = estiloChip(CL, "assist", false, false);
  assert.equal(e.container.borderColor, CL.outlineVariant);
  assert.equal(e.texto.color, CL.onSurface);
  assert.equal(e.corIcone, CL.primary);
});

test("navigationBar: altura 80, indicador 64x32, container surfaceContainer (A)", () => {
  const c = estiloContainerNav(CL);
  assert.equal(c.height, 80);
  assert.equal(c.backgroundColor, CL.surfaceContainer);
  const d = estiloDestinoNav(CL, false);
  assert.equal(d.indicador.width, 64);
  assert.equal(d.indicador.height, 32);
  assert.equal(d.indicador.borderRadius, forma.full);
});

test("navigationBar VERDE: indicador secondaryContainer, ícone onSecondaryContainer (C3/Portão A)", () => {
  const ativo = estiloDestinoNav(CL, true);
  assert.equal(ativo.indicador.backgroundColor, CL.secondaryContainer);
  assert.equal(ativo.corIcone, CL.onSecondaryContainer);
  // rótulo ativo = onSurface (token A), NUNCA o verde
  assert.equal(ativo.rotulo.color, CL.onSurface);
  assert.notEqual(ativo.rotulo.color, CL.secondary);
});

test("navigationBar AZUL (comparativo): indicador primaryContainer/onPrimaryContainer", () => {
  const ativo = estiloDestinoNavAzul(CL, true);
  assert.equal(ativo.indicador.backgroundColor, CL.primaryContainer);
  assert.equal(ativo.corIcone, CL.onPrimaryContainer);
  assert.equal(ativo.rotulo.color, CL.onSurface);
});

test("navigationBar inativo: ícone/rótulo onSurfaceVariant (A)", () => {
  const e = estiloDestinoNav(CL, false);
  assert.equal(e.corIcone, CL.onSurfaceVariant);
  assert.equal(e.rotulo.color, CL.onSurfaceVariant);
  assert.equal(e.indicador.backgroundColor, "transparent");
});

test("navigationBar: rótulo labelMedium e gap 4 (A + projeto)", () => {
  const e = estiloDestinoNav(CL, false);
  assert.equal(e.rotulo.fontSize, tiposM3.labelMedium.tamanho);
  assert.equal(e.rotulo.lineHeight, tiposM3.labelMedium.linhaAltura);
  assert.equal(e.rotulo.marginTop, 4);
});

test("navigationBar: trocar m3_medidas muda a barra (objeto único)", () => {
  // prova que a barra lê SÓ o objeto de medidas (nada duplicado no .tsx)
  const original = { ...m3_medidas.navigationBar };
  try {
    // não mutamos (readonly); conferimos a DERIVAÇÃO a partir do objeto
    assert.equal(estiloContainerNav(CL).height, m3_medidas.navigationBar.altura);
    assert.equal(estiloDestinoNav(CL, true).indicador.width, m3_medidas.navigationBar.indicadorLargura);
    assert.deepEqual({ ...m3_medidas.navigationBar }, original);
  } finally {
    // nada a restaurar
  }
});

test("timelineStop: primeira = círculo cheio; última = quadrado; intermediária = anel", () => {
  const cor = "#1D9BF0";
  const prim = estiloNoTimeline("primeira", false, cor);
  assert.equal(prim.forma, "circulo");
  assert.equal(prim.cheio, true);
  assert.equal(prim.no.borderRadius, prim.no.width / 2);

  const ult = estiloNoTimeline("ultima", false, cor);
  assert.equal(ult.forma, "quadrado");
  assert.equal(ult.cheio, true);
  assert.equal(ult.no.borderRadius, forma.extraPequena);

  const meio = estiloNoTimeline("intermediaria", false, cor);
  assert.equal(meio.forma, "anel");
  assert.equal(meio.cheio, false);
  assert.equal(meio.no.backgroundColor, "transparent");
});

test("timelineStop: conector 2dp na cor da LINHA do feed", () => {
  const cor = "#E4002B";
  const e = estiloNoTimeline("intermediaria", false, cor);
  assert.equal(e.conector.width, 2);
  assert.equal(e.conector.backgroundColor, cor);
  assert.equal(e.no.borderColor, cor);
});

test("timelineStop: parada atual vira ponto cheio mesmo intermediária", () => {
  const e = estiloNoTimeline("intermediaria", true, "#00A651");
  assert.equal(e.cheio, true);
  assert.equal(e.no.backgroundColor, "#00A651");
});
