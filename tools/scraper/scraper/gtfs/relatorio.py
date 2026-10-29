# Relatório da geração do feed: contagens, notas (decisões e lacunas) e o
# resultado da validação interna — em Markdown, direto para data/gtfs/.

from __future__ import annotations

from .dados import Nota, Tabelas

DESCRICAO_TABELAS = {
    "agency": "agency.txt — órgão gestor (dados do painel)",
    "routes": "routes.txt — linhas do sistema",
    "stops": "stops.txt — paradas únicas com coordenadas",
    "calendar": "calendar.txt — serviços por dia da semana",
    "shapes": "shapes.txt — pontos dos trajetos (polyline decodificada)",
    "trips": "trips.txt — uma viagem por partida real do quadro de horários",
    "stop_times": "stop_times.txt — horário teórico em cada parada de cada viagem",
    "feed_info": "feed_info.txt — versão e editor do feed",
}


def texto_relatorio(tab: Tabelas, achados: list[Nota], data_geracao: str) -> str:
    linhas: list[str] = [
        f"# Feed GTFS João Pessoa — relatório de geração ({data_geracao})",
        "",
        "Fonte: painel Mobilibus (project_id 394), respostas brutas de `data/raw/` decifradas.",
        "Feed montado a partir do decodificado; a validação oficial vem depois (seção abaixo).",
        "",
        "## Contagens",
        "",
        "| Arquivo | Registros |",
        "| --- | --- |",
    ]
    for campo, descricao in DESCRICAO_TABELAS.items():
        linhas.append(f"| {descricao} | {len(getattr(tab, campo))} |")

    erros_valid = sum(1 for a in achados if a.severidade == "erro")
    avisos_valid = sum(1 for a in achados if a.severidade == "aviso")
    linhas += [
        "",
        "## Notas da montagem (decisões e lacunas)",
        "",
    ]
    if not tab.notas:
        linhas.append("- (nenhuma)")
    for nota in tab.notas:
        linhas.append(f"- {nota.linha()}")
    linhas += [
        "",
        "## Validação interna",
        "",
        f"- erros: {erros_valid} · avisos: {avisos_valid}",
        "",
    ]
    for achado in achados:
        linhas.append(f"- {achado.linha()}")
    linhas += [
        "",
        "## Validação oficial (MobilityData gtfs-validator)",
        "",
        "Publicação exige zero erros (doc seção 6). Executar com Java 17+:",
        "`java -jar gtfs-validator-<versão>.jar --input <caminho do gtfs.zip> "
        "--validation_report_path <pasta> --system_errors_path <pasta>`",
        "Instruções exatas variam por versão — seguir o README da release oficial.",
        "",
        "## Estabilidade dos identificadores",
        "",
        "- `route_id` = rid do painel; `stop_id` = sid; `service_id` = sid; "
        "`shape_id` = sh-<tid>; `trip_id` = `<tid>-<sid>-<hhmmss>` — "
        "todos determinísticos entre coletas (favoritos do app dependem disso).",
        "",
    ]
    return "\n".join(linhas)
