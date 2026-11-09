# Estratégia de testes

| Nível | Ferramenta | O que cobre | Onde |
|---|---|---|---|
| Unidade (backend) | JUnit 5 + Mockito | regras puras: geração de parcelas, proporcionalidade, saldo, transições de status, validação de upload | `backend/src/test/.../*Test.java` |
| Integração (backend) | Spring Boot Test + Testcontainers (PostgreSQL 17) | endpoints reais com banco real: auth, permissões, RLS, constraints, idempotência, concorrência | `backend/src/test/.../*IT.java` |
| Unidade (frontend) | Vitest + React Testing Library | componentes, schemas zod, formatação BRL/datas, estados vazio/erro | `frontend/src/**/*.test.tsx` |
| E2E | Playwright (desktop 1280px + mobile 390px) | fluxos completos no navegador contra a stack do Docker Compose | `frontend/tests/e2e` |

## Casos obrigatórios

| Área | Caso | Nível |
|---|---|---|
| Auth | signup cria organização + admin; login certo e errado; logout invalida a sessão | IT, E2E |
| Auth | 6ª tentativa falha em 15 min → 429 | IT |
| Auth | requisição que altera dados sem CSRF → 403 | IT |
| Permissões | STAFF não acessa `/users`; OWNER/TENANT não acessam `/api/**` interno | IT |
| Permissões | OWNER só vê os próprios imóveis; TENANT só vê o próprio contrato | IT |
| Isolamento | para cada recurso: GET/PUT/DELETE com ID de outra organização → 404 | IT |
| Isolamento | query nativa sem `WHERE organization_id` retorna só dados do tenant atual (RLS) | IT |
| Imóveis | criar, filtrar (cidade/tipo/status/preço), editar, excluir bloqueado com contrato ativo | IT, E2E |
| Uploads | arquivo .exe renomeado para .jpg é rejeitado; arquivo > 5 MB → 413; download de outra organização → 404 | IT |
| Contratos | dois ativos sobrepostos → 409 (inclusive em requisições simultâneas) | IT |
| Contratos | encerramento cancela só as parcelas futuras sem pagamento | Unid., IT |
| Parcelas | contrato de 15/01 a 14/01 do ano seguinte, vencimento dia 10 → número de parcelas e valores proporcionais corretos | Unid. |
| Pagamentos | parcial → status PARCIAL e saldo certo; quitação → PAGA | Unid., IT |
| Pagamentos | mesma `Idempotency-Key` duas vezes → um pagamento só | IT |
| Pagamentos | 2 pagamentos simultâneos que juntos passam do saldo → um deles 409 | IT |
| Pagamentos | estorno devolve o saldo | IT |
| Relatórios | totais do dashboard batem com os dados de teste; CSV com cabeçalho e separador corretos | IT |
| Fluxo | signup → imóvel → inquilino → contrato → pagamento → recibo → relatório | E2E |
| Fluxo | inquilino abre manutenção → admin conclui com custo → despesa aparece | E2E |

## Como rodar

```bash
cd backend && ./mvnw verify          # unidade + integração (precisa do Docker rodando)
cd frontend && npm test               # vitest
cd frontend && npx playwright test    # e2e (precisa da stack no ar: docker compose up)
```

## Resultados

Os resultados de cada fase ficam registrados em [PROGRESSO.md](PROGRESSO.md), sempre com a saída real dos comandos.
