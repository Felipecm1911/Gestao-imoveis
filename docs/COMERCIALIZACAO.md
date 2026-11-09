# Comercialização

Este repositório é a **versão de portfólio**. Este documento separa o que já está no MVP, o que seria premium e o que falta antes de cobrar de um cliente.

## MVP (este repositório)

- Várias organizações no mesmo banco, com isolamento por RLS.
- Perfis ADMIN, STAFF, OWNER e TENANT, com portais.
- Imóveis, proprietários, inquilinos, contratos, parcelas, pagamentos manuais, despesas, manutenção e documentos.
- Dashboard, 8 relatórios (CSV/PDF), notificações internas e auditoria.
- Docker Compose e CI.

## Premium (planejado, não implementado)

| Funcionalidade | Observação |
|---|---|
| Planos com limites (usuários, imóveis, armazenamento) | coluna `organization.plan` já existe; falta aplicar os limites no service |
| Cobrança recorrente da assinatura | gateway (Stripe, Pagar.me, Asaas) |
| Boleto/PIX para o inquilino e baixa automática | webhook + conciliação |
| E-mail/WhatsApp de lembretes | trocar a implementação da interface `EmailSender` |
| Marca própria (logo, cores, domínio) | `organization.settings` em jsonb |
| Multa, juros e reajuste por índice oficial | dependem de cláusula contratual e de fonte confiável de índices |
| Repasse ao proprietário com taxa de administração | extrato e demonstrativo mensal |
| Assinatura eletrônica de contratos | integração de terceiros |
| Relatórios avançados e DRE por proprietário | |
| Armazenamento em S3 compatível | trocar a implementação de `FileStorage` |
| SSO / 2FA | TOTP para ADMIN |

## Requisitos antes de vender

**Segurança**
- Pentest externo e correção dos achados.
- 2FA para administradores; política de senha com checagem contra senhas vazadas.
- WAF/rate limit na borda; HTTPS obrigatório com HSTS.
- Varredura de dependências (Dependabot / OWASP Dependency-Check) e de segredos no CI.
- Antivírus nos uploads (ex.: ClamAV).

**Privacidade (LGPD)**
- Política de privacidade e termos de uso revisados por advogado.
- Contrato de operador de dados (DPA) com as imobiliárias (a imobiliária é controladora; nós somos operadores).
- Encarregado (DPO) indicado.
- Processo para atender pedidos de titulares (acesso, correção, anonimização) dentro do prazo.
- Política de retenção: dados financeiros por 5 anos após o fim do contrato (prazo fiscal); depois, anonimização.
- Registro das operações de tratamento.

**Operação**
- Backup diário criptografado do Postgres + teste de restauração mensal. Meta de RPO 24 h / RTO 4 h.
- Monitoramento (métricas, alertas, uptime) e logs centralizados com retenção definida.
- Ambientes separados (staging/produção) e migrações testadas com cópia anonimizada dos dados.
- Canal de suporte e SLA por plano.

**Negócio e jurídico**
- Empresa constituída, emissão de nota fiscal, contrato de assinatura (SaaS).
- Validação dos cálculos (proporcionalidade, reajuste) com uma imobiliária real.
- Licença: o código de portfólio e o comercial ficam em repositórios separados. A licença é decisão do autor.
