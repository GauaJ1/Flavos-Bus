// Lista de linhas COM as cores do feed (fatia 3, B2). Consulta PRÓPRIA do
// app (não mexe em packages/shared — o Linha do shared não tem color/
// text_color e o filtro busca buscaLinhas continua lá para a Buscar).
// color/text_color do feed vêm SEM '#': o corDoBadge normaliza.
import type { FonteDados } from "@flavos/shared";

export interface LinhaComCores {
  /** route_id — keyExtractor estável da lista. */
  readonly id: string;
  /** short_name ("0002"). */
  readonly numero: string;
  /** long_name antes do " | " (nome público; terminais/sentido não existem no feed). */
  readonly nome: string;
  /** color do feed, sem '#' ("0000FF"). */
  readonly cor: string;
  /** text_color do feed, sem '#'. */
  readonly corTexto: string;
}

const SQL_LINHAS =
  "SELECT route_id, short_name, long_name, COALESCE(color, '') AS cor, COALESCE(text_color, '') AS corTexto " +
  "FROM routes ORDER BY short_name ASC LIMIT 500";

export async function linhasComCores(fonte: FonteDados): Promise<LinhaComCores[]> {
  const linhas = await fonte.consulta<{
    route_id: string;
    short_name: string;
    long_name: string;
    cor: string;
    corTexto: string;
  }>(SQL_LINHAS);
  return linhas.map((r) => ({
    id: r.route_id,
    numero: r.short_name,
    // nome público: o que vem antes do primeiro separador declarado no feed
    nome: r.long_name.split(" | ")[0] ?? r.long_name,
    cor: r.cor,
    corTexto: r.corTexto,
  }));
}
