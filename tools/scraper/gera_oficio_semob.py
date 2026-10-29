# Gera docs/OFICIO_SEMOB_RASCUNHO.docx — của SEMOB-JP pedindo dados oficiais
# atualizados (operadoras vigentes, frota/prefixos, itinerários, horários),
# com os achados auditados do projeto. RASCUNHO: nada é enviado; identidade
# do remetente fica com placeholders explícitos [___].

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

RAIZ = Path(__file__).resolve().parent.parent.parent
DESTINO = RAIZ / "docs" / "OFICIO_SEMOB_RASCUNHO.docx"


def _par(doc: Document, texto: str, **kwargs) -> None:
    doc.add_paragraph(texto, **kwargs)


def _item(doc: Document, texto: str, curto: bool = False) -> None:
    p = doc.add_paragraph(texto)
    p.paragraph_format.left_indent = Cm(1.0 if curto else 0.6)
    p.paragraph_format.space_after = Pt(4)
    if curto:
        p.paragraph_format.left_indent = Cm(1.4)


def main() -> int:
    doc = Document()
    for secao in doc.sections:
        secao.top_margin = Cm(2.5)
        secao.bottom_margin = Cm(2.5)
        secao.left_margin = Cm(3.0)
        secao.right_margin = Cm(2.0)
    estilo = doc.styles["Normal"]
    estilo.font.name = "Times New Roman"
    estilo.font.size = Pt(12)

    # cabeçalho institucional
    cab = doc.add_paragraph("PROJETO FLAVOS BUS")
    cab.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cab.runs[0].bold = True
    sub = doc.add_paragraph(
        "Iniciativa independente de dados abertos sobre o transporte coletivo "
        "por ônibus de João Pessoa/PB"
    )
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    num = doc.add_paragraph("Ofício nº [___]/2026 — João Pessoa (PB), [data de envio]")
    num.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    doc.add_paragraph("")
    dest = doc.add_paragraph()
    dest.add_run("À Superintendência Executiva de Mobilidade Urbana de João Pessoa\n"
                 "(SEMOB-JP)\nA/C Superintendente Executivo(a)").bold = True
    _par(doc, "Assunto: solicitação de dados oficiais atualizados do sistema de "
              "transporte coletivo por ônibus — operadoras em operação, frota e "
              "prefixos de veículos, itinerários e quadros de horários.",
         style="Intense Quote" if "Intense Quote" in [s.name for s in doc.styles]
         else None)

    # 1. apresentação
    doc.add_paragraph("1. Apresentação", style="Heading 2")
    _item(doc,
          "O Projeto Flavos Bus é uma iniciativa independente que organiza em "
          "formato aberto (feed GTFS) os dados públicos do transporte coletivo "
          "por ônibus de João Pessoa, apurados exclusivamente de fontes "
          "públicas oficiais — em particular o painel de consulta pública da "
          "própria SEMOB-Mobilibus e as páginas de linhas do site institucional "
          "da SEMOB. O resultado é publicado gratuitamente, sem fins "
          "comerciais, para consulta de passageiros e para reúso por "
          "aplicativos de planejamento de viagem.")

    # 2. achados
    doc.add_paragraph("2. O que a auditoria técnica encontrou", style="Heading 2")
    _item(doc,
          "Entre 28 e 29/10/2026, auditamos sistematicamente os dados públicos "
          "das 77 linhas com itinerário publicado e os comparamos com o serviço "
          "em operação. Os achados a seguir estão documentados, com números por "
          "linha, nos anexos I a III deste ofício.")
    _item(doc, "2.1. Traçados: comparando o traçado em operação com o GeoJSON "
               "oficial de itinerário do site da SEMOB, 23 de 75 linhas "
               "apresentam distância média superior a 30 m (a pior, linha 0520, "
               "atinge 316,9 m de erro médio). A comparação mais reveladora é "
               "parada a parada: usando o traçado oficial, em várias linhas "
               "dezenas de paradas ficam a mais de 100 m do itinerário (na "
               "linha E155, 47 de 116 paradas; ponto mais distante a 4,4 km). "
               "Isso indica que o GeoJSON publicado não corresponde ao "
               "itinerário praticado — em alguns registros a data de atualização "
               "aparece como 30/12/1899 (nula).", curto=True)
    _item(doc, "2.2. Quadros de horários: das 84 linhas cujos quadros puderam "
               "ser comparados, apenas 16 conferem integralmente; 67 divergem. "
               "Em 59 linhas o serviço observado no painel tem viagens que não "
               "constam do quadro oficial e em 57 ocorre o inverso; o saldo é "
               "de +127 viagens por dia útil. Exemplo: linha 0104 com 71 "
               "partidas registradas no painel contra 69 no quadro; linha 0510 "
               "com 63 contra 49 (as viagens parciais são anunciadas apenas em "
               "texto corrido abaixo do quadro).", curto=True)
    _item(doc, "2.3. Operadoras: o campo EMPRESA dos GeoJSON e as páginas de "
               "linhas informam a operadora, mas em muitos casos com referência "
               "a levantamento de 2018, sem data de vigência. Para o "
               "passageiro, informar a operadora errada induz a reclamações ao "
               "órgão equivocado.", curto=True)
    _item(doc, "2.4. Frota e identificação de veículos: não há publicação "
               "de frota por linha nem regra estável de prefixos, o que "
               "impede validar se o veículo que atende à viagem é o "
               "previsto em contrato.", curto=True)

    # 3. solicitações
    doc.add_paragraph("3. Solicitações", style="Heading 2")
    _item(doc, "Diante do exposto, solicitamos, na condição de usuário de "
               "dados públicos:")
    for pedido in (
        "a relação atualizada de operadoras por linha, com data de início de "
        "vigência;",
        "a frota e os prefixos de veículos por linha (ou o instrumento "
        "contratual que os fixe);",
        "os itinerários oficiais atualizados de todas as linhas, "
        "preferencialmente em formato aberto e legível por máquina (o próprio "
        "GeoJSON publicado serve, bastando atualizá-lo e corrigir as datas);",
        "os quadros de horários oficiais atualizados, incluindo regra para "
        "viagens parciais/meias viagens hoje documentadas apenas em texto "
        "corrido;",
        "publicação do tempo real em formato GTFS-RT padrão (atualização de "
        "posição \"VehiclePositions\"), com o prefixo do veículo no campo "
        "VehicleDescriptor.label — hoje o painel público não expõe os dados "
        "de localização das vias: consultas ao serviço de tempo real "
        "devolveram lista vazia (linha 0509) ou erro 500 (linhas 0507, 0510 "
        "e 0104) mesmo com serviço em circulação;",
        "indicação de canal oficial para recebermos correspondência sobre "
        "dados abertos e eventuais correções que identificarmos (e-mail "
        "institucional, portal de dados abertos, portal de transparência).",
    ):
        _item(doc, pedido, curto=True)
    _item(doc, "Reforçamos que o uso é aberto e sem fins comerciais, com "
               "crédito à SEMOB como fonte, e que sincronizações periódicas "
               "mantêm o feed de consulta pública coerente com o serviço "
               "praticado.")

    # 4. encerramento
    doc.add_paragraph("4. Considerações finais", style="Heading 2")
    _item(doc, "Colocamo-nos à disposição para apresentar toda a metodologia "
               "das auditorias (código aberto), complementar os anexos e "
               "colaborar com iniciativas de dados abertos da SEMOB. Ficando "
               "à espera de resposta, subscrevemo-nos.")
    doc.add_paragraph("")
    doc.add_paragraph("Respeitosamente,")
    doc.add_paragraph("")
    doc.add_paragraph("[NOME COMPLETO DO RESPONSÁVEL]")
    doc.add_paragraph("[CPF · e-mail · telefone · cidade/UF]")

    doc.add_paragraph("")
    anexos = doc.add_paragraph()
    anexos.add_run("Anexos:").bold = True
    _item(doc, "I. Divergências de horários por linha — "
               "docs/divergencias_semob.csv (16 confere / 67 diverge / "
               "1 sem página).", curto=True)
    _item(doc, "II. Divergências de traçados por linha — "
               "docs/item6_shapes_semob.csv (paradas >100 m do traçado "
               "oficial).", curto=True)
    _item(doc, "III. Auditoria completa de traçados — "
               "data/gtfs/_AUDITORIA_SHAPES.md (75 linhas, erro médio "
               "geral 35,4 m).", curto=True)

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(DESTINO))
    print(f"ofício gerado: {DESTINO}")

    # verificação programática do conteúdo pedido
    doc2 = Document(str(DESTINO))
    texto = "\n".join(p.text for p in doc2.paragraphs)
    faltando = [
        k for k in ("operadoras", "frota", "itinerários oficiais atualizados",
                    "quadros de horários", "GTFS-RT", "VehicleDescriptor.label",
                    "Anexos:")
        if k not in texto
    ]
    print("verificação:", "OK — todos os pedidos presentes" if not faltando
          else f"FALTANDO: {faltando}")
    return 0 if not faltando else 1


if __name__ == "__main__":
    raise SystemExit(main())
