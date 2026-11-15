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

Para rodar a aplicação, abra o Docker Desktop. Na raiz do projeto, mantenha o `.env` existente. Se for a primeira instalação, copie `.env.example` para `.env` e defina as senhas antes de subir o banco.

```bash
docker compose up -d --build --wait
```

Acesse [http://localhost:5181](http://localhost:5181). O Compose sobe o PostgreSQL, a API e a interface. Se o Vite estiver usando a porta 5181, encerre-o antes de subir o Compose ou configure outra porta em `WEB_PORT` no `.env`.

Depois da primeira execução, os contêineres que estavam rodando voltam a iniciar junto com o motor do Docker Desktop. Se você os parar ou remover pelo Docker Desktop ou com o Compose, execute `docker compose up -d --wait` para subir de novo. Use `docker compose ps` para conferir o estado e `docker compose logs --tail=100 backend` para consultar erros da API.

O banco continua no volume `pgdata` e os arquivos em `data/uploads`. Execute os comandos na raiz original do repositório para reutilizar o banco existente.

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Requisitos](docs/REQUISITOS.md)
- [Testes](docs/TESTES.md)
- [Comercialização](docs/COMERCIALIZACAO.md)

## Licença

A definir pelo autor.
