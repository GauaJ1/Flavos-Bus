# Testes pós-aprendizado — doc 'Como funciona o Moovit — Anatomia e MVP'

Data: 2026-10-29T18:18:41.721Z · web de depuração (Edge/Playwright) ·
rede externa BLOQUEADA por rota Playwright (só o dev server 127.0.0.1:8081 passa).

| Doc (seção) | Check | Resultado |
|---|---|---|
| app§BuscaDeLinhas: busca por NÚMERO (509) | — | PASS |
| app§BuscaDeLinhas: busca por NOME (Jaguaribe) | — | PASS |
| app§BuscaDeLinhas: busca por NOME (Tambaú) | sem acento também acha (tilde-less) | PASS |
| app§DetalheLinha: próxima saída presente | — | PASS |
| doc§Principios: primeiro a RESPOSTA (próxima) antes do resto | ordem: placa(105) < próxima(259) < quadro(439) | PASS |
| doc§MostrarIncerteza: aviso antes de qualquer horário | — | PASS |
| doc§TempoReal: nunca prometemos RT (nenhum 'ao vivo') | única ocorrência permitida: negação do aviso | PASS |
| doc§Dados: idade do dado visível (feed 2026-10-29) | — | PASS |
| doc§Dados: origem da operadora rotulada com ANO da declaração | mostra com ano ou oculta (nunca sem rótulo) | PASS |
| offline§malConectado: zero pageerror com rede externa bloqueada | — | PASS |

Testáveis do doc deixados de fora, com motivo:
- §Parada/Favoritos: doc marca 'Fase 2' — não é exigência do MVP;
- §Planejador A→B (RAPTOR): doc marca 'Fase 3'; a leitura horária do MVP é
  'uma consulta em stop_times' (doc §Rotas), coberta pelos testes Python;
- §Notificações/§crowdsourcing: doc coloca depois do MVP (exigem servidor e
  base de usuários).
- 'Modo avião' real no aparelho sigue como prova humana (o web topa o
  bundle do dev server; no NATIVO o banco é embutido — ver README).
