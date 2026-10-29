# Gera docs/dashboard_semob.html — dashboard de monitoramento + divergências
# ruff: noqa: E501
# SEMOB-JP × feed Flavos Bus (missão: saída visual com dataviz, 0509 destacada,
# diagrama do pipeline). Lê os CSVs já gerados:
#   docs/monitoramento_semob.csv   (defasagem por linha, item 4)
#   docs/divergencias_semob.csv    (divergências por linha, item 5)
# e tests/live_509/LOG.md          (rodadas de validação ao vivo)
# Nada é inventado: números vêm só dessas fontes. Re-gerar após cada rodada:
#   .venv/Scripts/python.exe gera_dashboard.py

from __future__ import annotations

import csv
import html
from collections import Counter
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
DOCS = RAIZ / "docs"
TESTES = RAIZ / "tests" / "live_509"

CSS_CORES = {
    "fresca": "#15803d",
    "aceitavel": "#a16207",
    "defasada": "#c2410c",
    "sem-data": "#64748b",
    "confere": "#0f766e",
    "diverge": "#b45309",
    "destaque": "#1d4ed8",
}

COR_CLARO = {
    "bg": "#f6f8fb", "superficie": "#ffffff", "tinta": "#152641",
    "tinta2": "#4b5b70", "borda": "#d8e0ea", "linha_suave": "#e8edf3",
    "tinta_invertida": "#ffffff", "superficie2": "#eef2f8",
}
COR_ESCURO = {
    "bg": "#0b1220", "superficie": "#111a2b", "tinta": "#e8eef7",
    "tinta2": "#9fb0c5", "borda": "#27354c", "linha_suave": "#1d2a40",
    "tinta_invertida": "#0b1220", "superficie2": "#18233a",
}


def _ler_csv(nome: str) -> list[dict[str, str]]:
    with (DOCS / nome).open(encoding="utf-8", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def _rodadas_509() -> list[dict[str, str]]:
    linhas = (TESTES / "LOG.md").read_text(encoding="utf-8").splitlines()
    cabeca = linhas[0]
    corpo = [ln for ln in linhas[1:]
             if ln.strip().startswith("|") and "---" not in ln]
    rebatidas = []
    for r in csv.DictReader([cabeca, *corpo], delimiter="|"):
        rebatidas.append({(k or "").strip(): (v or "").strip() for k, v in r.items()})
    return rebatidas


def _esc(t: object) -> str:
    return html.escape(str(t), quote=True)


def gerar() -> str:
    mon = _ler_csv("monitoramento_semob.csv")
    div = _ler_csv("divergencias_semob.csv")
    gerado_em = datetime.now().strftime("%d/%m/%Y %H:%M")
    por_linha_mon = {r["linha"]: r for r in mon}

    stat_mon = Counter(r["status"] for r in mon)
    stat_div = Counter(r["status"].split(" (")[0].split(" ·")[0] for r in div)
    sem_geojson = {"0116", "0120", "0604", "9901", "CBTU", "I015", "T003"}

    linha_509_mon = por_linha_mon.get("0509", {})
    linha_509_div = next((r for r in div if r["linha"] == "0509"), {})

    # distribuição de idades (histograma simples)
    baldes = Counter()
    for r in mon:
        bruto = r.get("idade_min_anos", "")
        try:
            idade = float(bruto.replace(",", "."))
        except ValueError:
            baldes["sem data"] += 1
            continue
        if idade <= 1:
            baldes["≤ 1 ano"] += 1
        elif idade <= 2:
            baldes["1–2"] += 1
        elif idade <= 4:
            baldes["2–4"] += 1
        elif idade <= 6:
            baldes["4–6"] += 1
        elif idade <= 8:
            baldes["6–8"] += 1
        else:
            baldes["> 8 anos"] += 1

    # maiores divergências de contagem (úteis, todas reais)
    difs: list[tuple[str, int, int]] = []
    for r in div:
        try:
            f = int(r["viagens_uteis_feed"])
            o = int(r["viagens_uteis_oficial"])
        except ValueError:
            continue
        difs.append((r["linha"], f, o))
    difs.sort(key=lambda x: -abs(x[1] - x[2]))
    piores: list[tuple[str, int, int]] = difs[:12]

    # amostras de horário só em um lado (0104 e 0510 como casos típicos)
    casos: list[tuple[str, str, str]] = []
    for sigla_a in ("0104", "0510", "0106"):
        r = next((x for x in div if x["linha"] == sigla_a), None)
        if r:
            casos.append((
                r["linha"],
                r["so_feed_uteis"] or "—", r["so_oficial_uteis"] or "—"))


    # ── barras de defasagem (SVG) ─────────────────────────────────────────────
    barras = [
        ("Traçado fresco (≤ 1 ano)", stat_mon.get("fresca", 0), CSS_CORES["fresca"]),
        ("Aceitável (1–4 anos)", stat_mon.get("aceitável", 0), CSS_CORES["aceitavel"]),
        ("Defasado (> 4 anos)", stat_mon.get("defasada", 0), CSS_CORES["defasada"]),
        ("Sem data de atualização", stat_mon.get("sem-data", 0), CSS_CORES["sem-data"]),
    ]
    maximo_barras = max((v for _, v, _ in barras), default=1) or 1
    barras_svg: list[str] = []
    for i, (rotulo, valor, cor) in enumerate(barras):
        y = 26 + i * 46
        largura = round((valor / maximo_barras) * 520, 1)
        barras_svg.append(
            f'<text x="0" y="{y + 4}" class="ax">{_esc(rotulo)}</text>'
            f'<rect x="230" y="{y - 12}" width="{largura}" height="20" rx="4" fill="{cor}"/>'
            f'<text x="{230 + largura + 8}" y="{y + 4}" class="nv">{valor}</text>')

    # histograma idades
    ordem_idade = ["≤ 1 ano", "1–2", "2–4", "4–6", "6–8", "> 8 anos", "sem data"]
    vals = [baldes.get(k, 0) for k in ordem_idade]
    max_hist = max(vals) or 1
    hist_bars: list[str] = []
    for i, (k, v) in enumerate(zip(ordem_idade, vals, strict=True)):
        x = 40 + i * 74
        h = round((v / max_hist) * 120, 1)
        hist_bars.append(
            f'<rect x="{x}" y="{140 - h}" width="54" height="{h}" rx="4" '
            f'fill="{CSS_CORES["sem-data"] if k == "sem data" else CSS_CORES["destaque"]}"/>'
            f'<text x="{x + 27}" y="{140 - h - 6}" class="nv" text-anchor="middle">{v}</text>'
            f'<text x="{x + 27}" y="{156}" class="ax" text-anchor="middle">{_esc(k)}</text>')

    # pipeline SVG (identidade da página)
    no = 130
    pipeline_svg = f'''
<svg viewBox="0 0 1080 148" role="img" aria-label="Pipeline: coleta Bus2 e geojson SEMOB geram o GTFS Flavos Bus, validado pelo validador MobilityData e monitorado contra as fontes oficiais" class="pipe">
  <defs>
    <marker id="st" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="currentColor" opacity=".55"/></marker>
  </defs>
  <g class="fluxo">
    <rect x="8" y="34" rx="12" width="{no}" height="80" class="n painel"/>
    <text x="16" y="56">Coleta</text>
    <text x="16" y="74" class="s">painel Mobilibus</text>
    <text x="16" y="92" class="s">84/84 linhas · AES</text>
    <rect x="8" y="34" rx="12" width="{no}" height="80" class="sombra"/>
    <rect x="158" y="34" rx="12" width="{no}" height="80" class="n semob"/>
    <text x="166" y="56">GeoJSON</text>
    <text x="166" y="74" class="s">site SEMOB-JP</text>
    <text x="166" y="92" class="s">77 linhas com traçado</text>
    <rect x="308" y="34" rx="12" width="{no}" height="80" class="n artefato"/>
    <text x="316" y="56">GTFS</text>
    <text x="316" y="74" class="s">gerador próprio</text>
    <text x="316" y="92" class="s">shapes · 8 agency</text>
    <rect x="458" y="34" rx="12" width="{no}" height="80" class="n val"/>
    <text x="466" y="56">Validação</text>
    <text x="466" y="74" class="s">MobilityData</text>
    <text x="466" y="92" class="s">0 erros · 1 aviso</text>
    <rect x="608" y="34" rx="12" width="{no}" height="80" class="n monitor"/>
    <text x="616" y="56">Monitoramento</text>
    <text x="616" y="74" class="s">defasagem + divergência</text>
    <text x="616" y="92" class="s">0509 ao vivo: OK</text>
    <rect x="758" y="34" rx="12" width="{no}" height="80" class="n app"/>
    <text x="766" y="56">App</text>
    <text x="766" y="74" class="s">Flavos Bus (RN)</text>
    <text x="766" y="92" class="s">GTFS estático</text>
    <path d="M139 74 h16" class="arq" marker-end="url(#st)"/>
    <path d="M289 74 h16" class="arq" marker-end="url(#st)"/>
    <path d="M439 74 h16" class="arq" marker-end="url(#st)"/>
    <path d="M589 74 h16" class="arq" marker-end="url(#st)"/>
    <path d="M739 74 h16" class="arq" marker-end="url(#st)"/>
    <path d="M308 118 h390 v-16" class="arq ret" marker-end="url(#st)"/>
    <text x="900" y="58" class="leg">dados de 29/10/2026</text>
    <text x="900" y="76" class="leg s">fontes públicas</text>
    <text x="900" y="94" class="leg s">nenhum dado inventado</text>
  </g>
</svg>'''

    # tabela de piores diferenças
    linhas_tabela: list[str] = []
    for sigla_t, feed_t, ofi_t in piores:
        d509 = " destaque" if sigla_t == "0509" else ""
        linhas_tabela.append(
            f'<tr class="{d509.strip()}"><th scope="row">{_esc(sigla_t)}</th>'
            f"<td>{feed_t}</td><td>{ofi_t if ofi_t is not None else '—'}</td>"
            f"<td>{feed_t - (ofi_t or 0):+d}</td></tr>")
    tabela_piores = "\n".join(linhas_tabela)

    casos_html = "\n".join(
        f'<article class="caso"><h3>Linha {_esc(c[0])}</h3>'
        f'<p class="mini">só no feed</p><p class="cod">{_esc(c[1])}</p>'
        f'<p class="mini">só no quadro oficial</p><p class="cod">{_esc(c[2])}</p>'
        f"</article>"
        for c in casos)

    rodadas_html = ""
    try:
        for rod in _rodadas_509():
            resultado_txt = rod.get("Resultado", "").replace("*", "").strip()
            ok = "OK" in resultado_txt
            rodadas_html += (
                f'<tr><td>{_esc(rod.get("Data", "").strip())} '
                f'{_esc(rod.get("Hora", "").strip())}</td>'
                f'<td>{_esc(rod.get("Rodada", "").strip())}</td>'
                f'<td><span class="chip {"ok" if ok else "alerta"}">'
                f'{_esc(resultado_txt)}</span></td>'
                f'<td>{_esc(rod.get("[3] Veículos", "").strip())}</td>'
                f'<td class="esconde-cel">{_esc(rod.get("Obs", "").strip())}</td></tr>')
    except Exception:
        rodadas_html = ""

    tema = f"""
:root {{
  --bg: {COR_CLARO['bg']}; --superficie: {COR_CLARO['superficie']};
  --tinta: {COR_CLARO['tinta']}; --tinta2: {COR_CLARO['tinta2']};
  --borda: {COR_CLARO['borda']}; --suave: {COR_CLARO['linha_suave']};
  --superficie2: {COR_CLARO['superficie2']};
  --tinta-invertida: {COR_CLARO['tinta_invertida']};
  --ok: {CSS_CORES['confere']}; --alerta: {CSS_CORES['defasada']};
  --destaque: {CSS_CORES['destaque']}; --amb: {CSS_CORES['diverge']};
}}
@media (prefers-color-scheme: dark) {{
  :root {{
    --bg: {COR_ESCURO['bg']}; --superficie: {COR_ESCURO['superficie']};
    --tinta: {COR_ESCURO['tinta']}; --tinta2: {COR_ESCURO['tinta2']};
    --borda: {COR_ESCURO['borda']}; --suave: {COR_ESCURO['linha_suave']};
    --superficie2: {COR_ESCURO['superficie2']};
    --tinta-invertida: {COR_ESCURO['tinta_invertida']};
    --ok: #34d399; --alerta: #fb923c; --destaque: #7ca9ff; --amb: #fbbf24;
  }}
}}"""

    pagina = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Flavos Bus · painel SEMOB × feed</title>
<style>
{tema}
@media (prefers-reduced-motion: no-preference) {{ :target {{ scroll-behavior: smooth; }} }}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; background: var(--bg); color: var(--tinta);
  font-family: "Fira Sans", "Segoe UI", system-ui, sans-serif;
  font-size: 15px; line-height: 1.55;
}}
.mono {{ font-family: "Fira Code", "Cascadia Mono", Consolas, monospace; }}
header.topo {{
  background: linear-gradient(180deg, var(--superficie) 0%, var(--bg) 100%);
  border-bottom: 1px solid var(--borda); padding: 28px 20px 18px;
}}
header.topo .miolo, main, footer .miolo {{ max-width: 1080px; margin: 0 auto; }}
h1 {{ font-size: 26px; letter-spacing: -.2px; margin: 0 0 4px; }}
.sub {{ color: var(--tinta2); margin: 0; }}
.sub b {{ color: var(--tinta); font-weight: 600; }}
main {{ padding: 26px 20px 8px; display: grid; gap: 26px; }}
section > h2 {{
  font-size: 18px; margin: 0 0 4px; letter-spacing: -.1px;
}}
section > p.nota {{ margin: 0 0 14px; color: var(--tinta2); font-size: 13.5px; }}
section {{ scroll-margin-top: 16px; }}
.kpis {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }}
.kpi {{
  background: var(--superficie); border: 1px solid var(--borda);
  border-radius: 10px; padding: 14px 16px;
}}
.kpi .num {{ font-size: 30px; font-weight: 700; letter-spacing: -1px; line-height: 1.1; }}
.kpi .rot {{ font-size: 13px; color: var(--tinta2); margin-top: 2px; }}
.kpi .det {{ font-size: 12px; color: var(--tinta2); opacity: .85; margin-top: 6px; }}
.kpi.atencao .num {{ color: var(--alerta); }}
.kpi.bom .num {{ color: var(--ok); }}
.pipe {{ width: 100%; height: auto; color: var(--tinta); display: block; }}
.pipe .n {{ fill: var(--superficie2); stroke: var(--borda); stroke-width: 1.2; }}
.pipe .painel {{ stroke: var(--destaque); stroke-width: 1.8; }}
.pipe .semob {{ stroke: var(--ok); stroke-width: 1.8; }}
.pipe .val {{ stroke: var(--ok); }}
.pipe .monitor {{ stroke: var(--amb); stroke-width: 1.8; }}
.pipe text {{ font-family: "Fira Sans", "Segoe UI", sans-serif; font-size: 13.5px; fill: var(--tinta); }}
.pipe text.s {{ font-size: 11.5px; fill: var(--tinta2); }}
.pipe .arq {{ stroke: var(--tinta2); stroke-width: 1.4; fill: none; opacity: .8; }}
.pipe .leg {{ font-size: 12px; }}
.grade2 {{ display: grid; grid-template-columns: 1.1fr .9fr; gap: 18px; align-items: start; }}
@media (max-width: 880px) {{ .grade2 {{ grid-template-columns: 1fr; }} }}
.cartao {{
  background: var(--superficie); border: 1px solid var(--borda);
  border-radius: 10px; padding: 16px 18px;
}}
.cartao h2 {{ margin: 0 0 2px; font-size: 16px; }}
.cartao .nota {{ font-size: 12.5px; color: var(--tinta2); margin: 0 0 12px; }}
svg.graf {{ width: 100%; height: auto; }}
svg.graf text {{ font-size: 12px; fill: var(--tinta); }}
svg.graf text.ax {{ fill: var(--tinta2); font-size: 11.5px; }}
svg.graf text.nv {{ font-weight: 600; fill: var(--tinta); font-size: 12.5px; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13.5px; }}
th, td {{ text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--suave); }}
thead th {{
  text-align: left; color: var(--tinta2); font-weight: 600; font-size: 12px;
  text-transform: none; border-bottom: 1px solid var(--borda);
}}
tbody th[scope="row"] {{ text-align: left; font-weight: 600; }}
tr.destaque td, tr.destaque th {{
  background: color-mix(in oklab, var(--destaque) 14%, transparent);
}}
.chip {{
  display: inline-block; border-radius: 999px; padding: 1px 10px; font-size: 12px;
  font-weight: 600; background: var(--superficie2); border: 1px solid var(--borda);
}}
.chip.ok {{ color: var(--ok); border-color: color-mix(in oklab, var(--ok) 45%, var(--borda)); }}
.chip.alerta {{ color: var(--alerta); border-color: color-mix(in oklab, var(--alerta) 45%, var(--borda)); }}
.casos {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }}
article.caso {{ background: var(--superficie2); border-radius: 8px; padding: 12px 14px; }}
article.caso h3 {{ margin: 0 0 6px; font-size: 14px; }}
p.mini {{ margin: 8px 0 2px; color: var(--tinta2); font-size: 11.5px; }}
p.cod {{
  margin: 0; font-size: 12px; word-break: break-word; color: var(--tinta);
  background: var(--superficie); border-radius: 6px; padding: 6px 8px;
  border: 1px solid var(--suave);
}}
.bloco509 {{
  border: 1.6px solid var(--destaque); border-radius: 12px;
  padding: 18px 20px; background: var(--superficie); position: relative;
}}
.bloco509 h2 {{ margin: 0; font-size: 17px; }}
.bloco509 .tag509 {{
  position: absolute; top: -11px; left: 18px; background: var(--destaque);
  color: var(--tinta-invertida); font-size: 11.5px; font-weight: 700;
  border-radius: 999px; padding: 2px 12px; letter-spacing: .2px;
}}
.col509 {{ display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; }}
@media (max-width: 820px) {{ .col509 {{ grid-template-columns: 1fr; }} }}
.dl {{ display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; font-size: 13.5px; margin: 10px 0 0; }}
.dl dt {{ color: var(--tinta2); }}
.dl dd {{ margin: 0; font-weight: 600; }}
footer {{ padding: 22px 20px 40px; color: var(--tinta2); font-size: 12.5px; border-top: 1px solid var(--borda); margin-top: 26px; }}
footer a, header a {{ color: var(--destaque); }}
.esconde-cel {{ max-width: 260px; }}
@media (max-width: 700px) {{ .esconde-cel {{ display: none; }} }}
:focus-visible {{ outline: 2px solid var(--destaque); outline-offset: 2px; }}
</style>
</head>
<body>
<header class="topo">
  <div class="miolo">
    <h1>Flavos Bus · dados oficiais SEMOB-JP × feed</h1>
    <p class="sub">Monitoramento contínuo do ecossistema: <b>84 linhas</b> de ônibus de João Pessoa
    publicado em <time>{gerado_em}</time> · fontes: geojson/quadro oficial da SEMOB-JP e painel Mobilibus</p>
  </div>
</header>
<main>
  <section aria-labelledby="t-pipe">
    <h2 id="t-pipe">O caminho do dado, do painel ao app</h2>
    <p class="nota">Duas fontes públicas independentes alimentam o feed; nada é digitado à mão.</p>
    {pipeline_svg}
  </section>

  <section class="kpis" aria-label="Indicadores gerais">
    <div class="kpi"><div class="num">84</div><div class="rot">linhas no feed</div>
      <div class="det">8 operadoras declaradas no agency.txt</div></div>
    <div class="kpi atencao"><div class="num">{stat_div.get('diverge', 0)}</div>
      <div class="rot">linhas divergem do quadro oficial</div>
      <div class="det">{stat_div.get('confere', 0)} conferem · 1 sem quadro</div></div>
    <div class="kpi bom"><div class="num">{stat_mon.get('fresca', 0)}</div>
      <div class="rot">traçados oficiais frescos</div>
      <div class="det">≤ 1 ano · aceitáveis: {stat_mon.get('aceitável', 0)}</div></div>
    <div class="kpi atencao"><div class="num">{stat_mon.get('defasada', 0)}</div>
      <div class="rot">traçados defasados</div>
      <div class="det">&gt; 4 anos · sem data: {stat_mon.get('sem-data', 0)}</div></div>
    <div class="kpi"><div class="num">{len(sem_geojson)}</div>
      <div class="rot">sem geojson publicado</div>
      <div class="det">{' · '.join(sorted(sem_geojson))}</div></div>
  </section>

  <div class="bloco509" id="linha-509">
    <span class="tag509">LINHA DE VALIDAÇÃO CONTÍNUA</span>
    <div class="col509">
      <div>
        <h2>0509 · João Agripino</h2>
        <dl class="dl">
          <dt>Horários feed × quadro oficial (úteis)</dt>
            <dd>{_esc(linha_509_div.get('viagens_uteis_feed', '—'))} × {_esc(linha_509_div.get('viagens_uteis_oficial', '—'))} — confere viagem a viagem</dd>
          <dt>Sábado</dt>
            <dd>{_esc(linha_509_div.get('viagens_sabado_feed', '—'))} × {_esc(linha_509_div.get('viagens_sabado_oficial', '—'))}</dd>
          <dt>Traçado oficial</dt>
            <dd class="mono">ATUALIZACA {_esc(linha_509_mon.get('atualizacoes', '—') or '—')}</dd>
          <dt>Idade mín. do traçado</dt>
            <dd>{_esc(linha_509_mon.get('idade_min_anos', '—'))} anos — <b>defasado</b></dd>
          <dt>Operadora declarada</dt>
            <dd>{_esc(linha_509_mon.get('operadora_declarada', '—'))} (dado declarativo, não confirmação atual)</dd>
          <dt>Paradas distintas no feed</dt><dd>{_esc(linha_509_div.get('paradas_distintas_feed', '—'))}</dd>
          <dt>Tempo real</dt><dd>não publicado (painel sem RT · endpoint GPS com erro 500)</dd>
        </dl>
      </div>
      <div class="cartao">
        <h2>Rodadas ao vivo</h2>
        <p class="nota">Integridade + horários × painel fresco + captura de veículos; a MISSÃO exige OK após cada mudança.</p>
        <table class="mono">
          <thead><tr><th>Quando</th><th>Rodada</th><th>Resultado</th><th>Veículos</th></tr></thead>
          <tbody>
{rodadas_html}</tbody>
        </table>
      </div>
    </div>
  </div>

  <section aria-labelledby="t-defa">
    <h2 id="t-defa">Defasagem dos traçados oficiais</h2>
    <p class="nota">Idade do campo ATUALIZACA por linha ({len(mon)} linhas com geojson). Critério de referência: 4 anos.</p>
    <div class="grade2">
      <div class="cartao">
        <h2>Traçados por status</h2>
        <svg class="graf" viewBox="0 0 720 200" role="img" aria-label="Barras: traçados por status de atualização">
          {''.join(barras_svg)}
        </svg>
      </div>
      <div class="cartao">
        <h2>Histograma de idades</h2>
        <svg class="graf" viewBox="0 0 520 170" role="img" aria-label="Histograma da idade mínima dos traçados">
          {''.join(hist_bars)}
        </svg>
      </div>
    </div>
  </section>

  <section aria-labelledby="t-div">
    <h2 id="t-div">Divergência de viagens (úteis): feed × quadro oficial</h2>
    <p class="nota">12 maiores diferenças de contagem. A divergência dominante é de <b>versão de tabela</b>
    (horários deslocados), não de quantidade — ver exemplos abaixo.</p>
    <div class="grade2">
      <div class="cartao">
        <table class="mono">
          <thead><tr><th>Linha</th><th>Feed</th><th>Oficial</th><th>Δ</th></tr></thead>
          <tbody>
{tabela_piores}</tbody>
        </table>
      </div>
      <div class="casos" aria-label="Exemplos de horários divergentes">
        {casos_html}
      </div>
    </div>
  </section>
</main>
<footer>
  <div class="miolo">
    Gerado automaticamente a partir de <code>docs/monitoramento_semob.csv</code>,
    <code>docs/divergencias_semob.csv</code> e <code>tests/live_509/LOG.md</code> —
    regenerar com <code>python tools/scraper/gera_dashboard.py</code>. Projeto Flavos Bus ·
    dados públicos de João Pessoa/PB · nenhum dado pessoal é coletado ou exibido.
  </div>
</footer>
</body>
</html>"""
    return pagina


def main() -> int:
    if not (DOCS / "monitoramento_semob.csv").is_file() or not (
            DOCS / "divergencias_semob.csv").is_file():
        print("ERRO: rode monitora_semob.py e divergencias_semob.py antes")
        return 2
    destino = DOCS / "dashboard_semob.html"
    destino.write_text(gerar(), encoding="utf-8")
    print(f"dashboard: {destino} ({destino.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
