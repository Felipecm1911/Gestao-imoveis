# Requisitos

Contexto: SaaS multi-imobiliária para pequenas imobiliárias, administradores e proprietários.
Objetivo deste repositório: **portfólio** com qualidade de produção (dados fictícios, sem cobrança real).

## Requisitos funcionais

### RF-01 Autenticação e organizações
- RF-01.1 Cadastro público de organização cria a organização + o primeiro usuário ADMIN.
- RF-01.2 Login por e-mail e senha; logout; "quem sou eu" (`/me`).
- RF-01.3 ADMIN convida/cria usuários STAFF, OWNER (vinculado a um Proprietário) e TENANT (vinculado a um Inquilino).
- RF-01.4 ADMIN ativa/desativa usuários e altera perfis.

### RF-02 Proprietários
- CRUD de proprietários (nome, CPF/CNPJ, e-mail, telefone, endereço, dados bancários opcionais).

### RF-03 Imóveis
- RF-03.1 CRUD com: código interno (único por organização), título, descrição, tipo (CASA, APARTAMENTO, TERRENO, COMERCIAL), endereço, cidade, UF, CEP, área m², quartos, banheiros, vagas, aluguel sugerido, situação (DISPONIVEL, OCUPADO, MANUTENCAO, INATIVO), proprietário, fotos.
- RF-03.2 Filtros: cidade, tipo, situação, faixa de preço; paginação e ordenação.
- RF-03.3 Upload de fotos (JPEG/PNG/WebP, até 5 MB cada, até 20 por imóvel); definir foto de capa.
- RF-03.4 Página de detalhes com fotos, contrato atual, histórico de locações, manutenções e financeiro.

### RF-04 Inquilinos
- CRUD (nome, CPF/CNPJ, telefone, e-mail, endereço) e histórico de locações.
- Documento exibido mascarado em listagens (`***.456.789-**`); completo só no detalhe para ADMIN/STAFF.

### RF-05 Contratos
- RF-05.1 Criação: imóvel, proprietário (herdado do imóvel), inquilino, início, término, valor mensal, dia de vencimento (1–28), índice de reajuste (NENHUM, IGPM, IPCA, PERCENTUAL_FIXO), garantia (CAUCAO, FIADOR, SEGURO_FIANCA, TITULO_CAPITALIZACAO, NENHUMA) com valor/observação, observações.
- RF-05.2 Status: RASCUNHO → ATIVO → ENCERRADO | CANCELADO. Renovado gera novo contrato ligado ao anterior.
- RF-05.3 Edição controlada: em RASCUNHO tudo é editável; em ATIVO só observações e garantia. Valor só muda por **reajuste** registrado.
- RF-05.4 Reajuste **manual**: o usuário informa o percentual aplicado e a data de vigência; o sistema recalcula as parcelas futuras em aberto. O sistema **não** busca índices oficiais nem aplica reajuste sozinho.
- RF-05.5 Renovação, encerramento (com data e motivo; cancela parcelas futuras sem pagamento) e histórico de alterações.
- RF-05.6 Bloquear dois contratos ATIVOS com períodos sobrepostos no mesmo imóvel (regra no banco).
- RF-05.7 Geração do contrato em PDF; upload da versão assinada.
- RF-05.8 Alerta de contratos que terminam em até 60 dias.

### RF-06 Financeiro
- RF-06.1 Ao ativar o contrato, gerar parcelas mensais para toda a vigência (primeira e última proporcionais aos dias).
- RF-06.2 Registrar pagamento total ou parcial (data, valor, forma, referência, usuário). Várias baixas por parcela.
- RF-06.3 Status da parcela calculado: ABERTA, PARCIAL, PAGA, ATRASADA (vencida com saldo > 0), CANCELADA.
- RF-06.4 Idempotência: cabeçalho `Idempotency-Key` obrigatório no registro de pagamento; repetir a mesma chave devolve o mesmo pagamento.
- RF-06.5 Não aceitar pagamento maior que o saldo; estorno de pagamento (com motivo) em vez de exclusão.
- RF-06.6 Despesas do imóvel (categoria, data, valor, descrição, responsável: PROPRIETARIO ou INQUILINO, vínculo opcional com manutenção).
- RF-06.7 Recibo em PDF por pagamento.
- RF-06.8 Histórico e filtros por imóvel, proprietário, inquilino e período.
- RF-06.9 Dashboard financeiro: previsto, recebido, pendente, em atraso, despesas e resultado por imóvel.

### RF-07 Manutenção
- Solicitação com imóvel, solicitante, descrição, prioridade (BAIXA, MEDIA, ALTA, URGENTE), status (ABERTA, EM_ANALISE, APROVADA, EM_EXECUCAO, CONCLUIDA, CANCELADA), responsável, fotos, custo e linha do tempo de atualizações.
- Inquilino abre solicitação pelo portal; ao concluir com custo, gera uma despesa vinculada.

### RF-08 Documentos
- Upload de PDF/imagem vinculado a imóvel ou contrato, com visibilidade (INTERNO, PROPRIETARIO, INQUILINO).
- Download só por endpoint autenticado e autorizado.

### RF-09 Dashboard, relatórios e alertas
- Dashboard: total de imóveis, disponíveis, alugados, taxa de ocupação, contratos a vencer, aluguéis em atraso, receitas e despesas do mês, manutenções abertas, gráficos de 12 meses.
- Relatórios com exportação CSV e PDF: receitas por período, despesas por imóvel, histórico de pagamentos, inadimplência, ocupação, contratos ativos/encerrados, manutenções realizadas.
- Notificações internas diárias: aluguel vencendo em 3 dias, atraso, contrato terminando em 60 dias, manutenção parada há mais de 7 dias.
- Calendário de vencimentos.

### RF-10 Portais
- Proprietário: seus imóveis, contratos, pagamentos recebidos e despesas visíveis.
- Inquilino: seu contrato, cobranças, pagamentos, recibos e solicitações de manutenção.

### RF-11 Auditoria e LGPD
- Registro de alterações em contratos, parcelas, pagamentos, despesas e usuários (quem, quando, o quê, antes/depois).
- Anonimização de proprietário/inquilino sem contratos ativos.

## Requisitos não funcionais

| Id | Requisito |
|---|---|
| RNF-01 | Isolamento entre organizações no backend **e** no banco (Row Level Security). |
| RNF-02 | Senhas com BCrypt (fator 12). Sessão em cookie `HttpOnly`, `Secure` em produção, `SameSite=Lax`, proteção CSRF. |
| RNF-03 | Limite de 5 tentativas de login falhas por e-mail+IP a cada 15 minutos. |
| RNF-04 | Valores monetários em `BigDecimal` / `numeric(14,2)`, arredondamento `HALF_EVEN`, cálculos só no backend. |
| RNF-05 | Erros no formato RFC 9457 (`application/problem+json`) sem stack trace. |
| RNF-06 | Logs JSON estruturados, sem senhas, tokens ou documentos pessoais. |
| RNF-07 | Listagens paginadas (padrão 20, máx. 100); p95 < 300 ms com 10 mil imóveis no ambiente local. |
| RNF-08 | Interface responsiva (360 px → desktop), modo claro/escuro, WCAG 2.1 AA (contraste, teclado, rótulos). |
| RNF-09 | Segredos só por variáveis de ambiente; `.env` fora do Git. |
| RNF-10 | Sobe com um comando: `docker compose up`. |
| RNF-11 | CI no GitHub Actions: build, testes unitários, integração (Testcontainers) e E2E (Playwright). |
| RNF-12 | Datas no fuso `America/Sao_Paulo`; valores exibidos em `pt-BR` / BRL. |
