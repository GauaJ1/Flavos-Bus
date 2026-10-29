# Relatório da coleta: o que está em disco (lista geral + timetables por linha),
# mais os erros registrados no manifest. Nunca inventa dado ausente.

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .cache import KIND_TIMETABLE, caminho_do_arquivo
from .manifest import Manifest


@dataclass
class ColetaReport:
    lista_geral_ok: bool = False
    total_linhas: int = 0
    completas: list[str] = field(default_factory=list)
    sem_dados: list[str] = field(default_factory=list)
    erros_manifest: list[dict[str, object]] = field(default_factory=list)


def build_report(raw_dir: Path) -> ColetaReport:
    raw_dir = Path(raw_dir)
    report = ColetaReport()

    report.lista_geral_ok = caminho_do_arquivo(raw_dir, "lista_geral").is_file()

    # Erros recentes ficam no manifest (URL, status, mensagem) — transparência total.
    for entrada in Manifest(raw_dir).load():
        if isinstance(entrada, dict) and entrada.get("error"):
            report.erros_manifest.append(entrada)

    pastas = [
        p
        for p in sorted(raw_dir.iterdir())
        if p.is_dir() and p.name.startswith("linha_")
    ] if raw_dir.is_dir() else []
    for pasta in pastas:
        report.total_linhas += 1
        if (pasta / f"{KIND_TIMETABLE}.json").is_file():
            report.completas.append(pasta.name.removeprefix("linha_"))
        else:
            report.sem_dados.append(pasta.name.removeprefix("linha_"))
    return report


def format_report(report: ColetaReport) -> str:
    """Texto pensado para o terminal (sem dependência de acentos/emoji)."""
    saida: list[str] = [
        f"lista geral (get-routes): {'ok' if report.lista_geral_ok else 'ausente'}",
        f"Linhas com pasta em data/raw: {report.total_linhas}",
    ]
    saida.append(f"  [ok]   completas: {len(report.completas)}")
    if report.completas:
        saida.append(f"      {', '.join(report.completas)}")
    saida.append(f"  [erro] sem dados: {len(report.sem_dados)}")
    if report.sem_dados:
        saida.append(f"      {', '.join(report.sem_dados)}")
    if report.erros_manifest:
        saida.append(f"Erros registrados no manifest: {len(report.erros_manifest)}")
        for entrada in report.erros_manifest[-10:]:
            saida.append(f"      [{entrada.get('collected_at_utc')}] {entrada.get('error')}")
    return "\n".join(saida)
