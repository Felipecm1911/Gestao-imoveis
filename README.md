# Imobly — Gestão de Imóveis e Aluguéis

SaaS para pequenas imobiliárias e administradores de imóveis: imóveis, proprietários, inquilinos, contratos, cobranças, pagamentos, manutenção, documentos e relatórios, com portais para proprietário e inquilino.

> 🚧 Em desenvolvimento. Já funcionam: login, dashboard, imóveis com fotos e filtros, proprietários e usuários da equipe. Em seguida: inquilinos, contratos e financeiro.

## Destaques técnicos

- **Multi-organização com isolamento duplo:** filtro na aplicação + Row Level Security do PostgreSQL.
- **Financeiro confiável:** `BigDecimal`, pagamentos idempotentes, lock de linha contra pagamento duplicado, estorno em vez de exclusão, trilha de auditoria.
- **Regra de negócio no banco:** restrição `EXCLUDE` impede dois contratos ativos sobrepostos no mesmo imóvel.
- **Segurança:** sessão em cookie HttpOnly, CSRF, BCrypt, limite de tentativas de login, upload validado pelos bytes do arquivo.

## Stack

| | |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Session, Spring Data JPA, Flyway |
| Banco | PostgreSQL 17 |
| Testes | JUnit 5, Mockito, Testcontainers, Vitest, React Testing Library, Playwright |
| Infra | Docker Compose, GitHub Actions |

## Rodando localmente

Requisitos: Docker, Java 21 e Node 20+ (estes dois só para desenvolvimento).

```bash
cp .env.example .env      # troque as senhas
docker compose up -d
```

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Requisitos](docs/REQUISITOS.md)
- [Testes](docs/TESTES.md)
- [Comercialização](docs/COMERCIALIZACAO.md)

## Licença

A definir pelo autor.
