# REFERENCIA_ESTRUTURA — padrões de um app de transporte público consagrado

Data: 2026-11-01 · **Análise de PADRÕES por descrição**, não de assets.
Regras desta análise (cumpridas): descreve anatomia e princípios de fluxo de um
app de transporte público de referência; **não** reproduz nome, logotipo, ícones,
ilustrações, textos nem a cor da marca do produto de origem; nenhuma engenharia
reversa; nenhum asset de terceiros versionado.

Capturas/arquivos de terceiros, se o dono colocar em `docs/design/referencias/`,
**não são versionados** (a pasta está no `.gitignore`).

---

## 1. Anatomia observada (4 telas)

### 1.1 Início (aba 1)
- Topo com identidade do app e **seletor de região** (contexto geográfico).
- **Título-pergunta grande** orientando a próxima ação.
- **Campo de busca em destaque** com botão de ação à direita (o campo é botão até
  o foco; a ação é explícita).
- **Seção de locais/destinos salvos**: cada item mostra a próxima saída e um menu
  de três pontos (ações por item).
- **Carrossel** com indicador de página (conteúdo editorial/educativo).
- Abas inferiores com **3 destinos**.

### 1.2 Paradas (aba 2)
- **Mapa no topo** (contexto espacial antes da lista).
- Abas segmentadas **"Ao redor" / "Favoritas"** (dois eixos de intenção no mesmo
  lugar).
- Lista de paradas: **nome**, **distância**, **linhas como selos** e **próximo
  horário por linha**.
- Link **"ver todas as linhas desta parada"** (progressão para o detalhe).

### 1.3 Linhas (aba 3)
- **Campo de busca**.
- **Chips de filtro**: favoritas (estrela), Todas, por modal.
- Lista **agrupada por operadora** com cabeçalho de seção (nome + tipo).
- Item: **selo colorido da linha**, nome e **ícone de alerta** quando há aviso.

### 1.4 Detalhe da linha
- **Barra superior**: voltar, selo + nome, estrela de favorito.
- **Faixa do sentido** com ação "mudar sentido" e botão de mapa.
- **Linha do tempo vertical de paradas**: nó em anel + conector na cor da linha,
  nome da parada, seta de detalhe.
- **Painel de aviso fixo na base** com dispensar, texto curto, link "ler mais" e
  interruptor de avisos futuros.

---

## 2. O que NÃO é do Flavos (fora do escopo — não desenhar como funcionando)

- Tempo real ("ao vivo", "agora", "última atualização", "faltam N paradas").
- Planejador de rota (origem → destino).
- Locais Casa/Trabalho (e qualquer rotulagem de locais pessoais).
- Anúncios.
- Avisos de serviço/operacionais (o Flavos não tem fonte de avisos).

Esses itens são o principal risco de cópia: o Flavos **não** os tem como dado, e a
interface não pode sugerir que tem (ver DIRECAO.md: nada sugere tempo real).

---

## 3. Estrutura decidida para o Flavos (3 abas)

| Aba | Conteúdo |
|---|---|
| **Início** | SearchBar em modo botão ("Buscar linha ou parada"); bloco **Favoritos** (linhas e paradas, com próxima saída TEÓRICA); bloco **Paradas perto de você** (permissão só no toque; fallback "paradas perto do centro"); BottomSheet com encaixes quando houver faixa de contexto. **Sem mapa no MVP.** |
| **Paradas** | Abas **Ao redor / Favoritas**; `StopRow` com chips das linhas (`LineBadge`); distância a pé quando houver localização; próximo horário teórico por linha **só com o `TheoreticalBadge` visível**. |
| **Linhas** | SearchBar + chips de filtro (**estrela**, **Todas**; por operadora **só se o feed tiver mais de uma agência**); lista com `SectionHeader` quando agrupada; ordem rotulada "Ordenadas por número de viagens". |

**Favoritos não é aba**: estrela-filtro em Linhas, aba "Favoritas" em Paradas e
bloco no Início. **Sobre** vira ícone de engrenagem na TopAppBar do Início (abre
a tela Sobre/tema).

### 3.1 Detalhe da linha (estrutura decidida)
- TopAppBar (voltar, `LineBadge` + nome, estrela).
- Faixa do sentido com "Mudar sentido" (**só se o feed tiver 2 sentidos**) e botão
  de traçado (SVG offline: ver `TracadoLinha` no DESIGN_SYSTEM.md — só especificado
  nesta fatia).
- `NextDepartureCard`, `SegmentedButton` Útil/Sáb/Dom.
- Linha do tempo com conector na cor da LINHA do feed (`TimelineStop`).
- Painel informativo **"Horário teórico"** fixo na base, **SEM** botão de dispensar
  para sempre (pode recolher a explicação; o selo permanece sempre visível).

---

## 4. Princípios adotados (e o porquê)

1. **Busca primeiro** — a ação mais comum recebe o elemento mais forte da tela
   (o Flavos usa a pílula de 56 do M3 SearchBar em modo botão).
2. **Dois eixos por tela quando natural** — Paradas com "Ao redor/Favoritas" usa
   o `SegmentedButton` do M3 (um controle, dois estados, largura total).
3. **Agrupamento com cabeçalho de seção** — no Flavos só quando houver mais de uma
   operadora no feed; `SectionHeader` (labelLarge onSurfaceVariant).
4. **Progressão nome-da-lista → detalhe** — item de lista com `LineBadge` + nome
   + chevron implícito; detalhe com a placa grande como elemento dominante.
5. **Favoritar por estrela**, nunca por aba dedicada.
6. **Aviso de escopo no detalhe** — o painel fixo de honestidade ("horário
   teórico") é sempre visível; o Flavos não oferece "dispensar para sempre".

## 5. Desvios conscientes em relação à referência

| Referência | Flavos | Motivo |
|---|---|---|
| Mapa no topo de Paradas | **sem mapa no MVP** (lista primeiro) | nenhuma dependência de mapa instalada; offline-first; mapa é fatia futura com interface própria |
| Carrossel editorial no Início | **não adotado** | conteúdo editorial exige fonte de conteúdo que o Flavos não tem |
| Aviso de serviço no detalhe | painel de "horário teórico" apenas | sem fonte de avisos operacionais |
| Distância em metros em todas as linhas | **só com localização concedida** | sem permissão, o Flavos não inventa distância |
| Bloco Casa/Trabalho | **não adotado** | rota pessoal exige planejamento e localização persistida |

## 6. Como esta análise se relaciona com o Material 3

A análise **não muda nenhuma decisão do M3**: a anatomia das telas usa os
componentes já adotados (NavigationBar, SearchBar, SegmentedButton, ListItem,
SectionHeader, FilterChipRow, TopAppBar, BottomSheet). O que vem da análise é
**sequência de informação e hierarquia**, não forma, cor ou medida. Onde a
referência tem um padrão que o M3 não cobre (mapa, carrossel, aviso dispensável),
o Flavos declara o desvio — não improvisa um componente novo.
