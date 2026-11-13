# Banco de dados

Esta pasta reúne os scripts e a documentação do banco de dados da ZELO.

## Tecnologias

- **PostgreSQL 16+**
- **PostGIS 3.x** (tipos e funções geoespaciais)

O backend usa Spring Data JPA / Hibernate e, em desenvolvimento, atualiza o
schema automaticamente com `spring.jpa.hibernate.ddl-auto=update`.

## Estrutura

| Arquivo | Descrição |
|---------|-----------|
| `schema.sql` | Criação completa do schema (tabelas, chaves, constraints e índices), sem dados |

O script representa o modelo atual das entidades JPA em
`backend/src/main/java/com/zelo/backend/entity`. Ele **não** contém usuários,
senhas, CPFs ou qualquer dado pessoal.

## Como usar

### 1. Criar o banco e habilitar o PostGIS

```sql
CREATE DATABASE zelo_db;
\c zelo_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Executar o schema

```bash
psql -U zelo_user -d zelo_db -f database/schema.sql
```

No Windows, se o `psql` não estiver no `PATH`, use o caminho completo do
PostgreSQL:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U zelo_user -d zelo_db -f database\schema.sql
```

### 3. Subir o backend

```bash
cd backend
mvn spring-boot:run
```

O Hibernate valida/atualiza o schema conforme as entidades. Se o script já foi
aplicado, nenhuma tabela adicional é necessária.

## Modelo

O diagrama entidade-relacionamento, a descrição das tabelas e os enums estão em
[`docs/modelo-de-dados.md`](../docs/modelo-de-dados.md).

Resumo das tabelas:

| Tabela | Conteúdo |
|--------|----------|
| `users` | Usuários e papéis (`USER`, `FISCAL`, `GESTOR`, `ROOT`) |
| `incidents` | Pontos críticos georreferenciados |
| `incident_evidences` | Imagens dos pontos críticos |
| `incident_comments` | Comentários nos pontos |
| `incident_upvotes` | Confirmações comunitárias (uma por usuário/ponto) |
| `incident_status_history` | Linha do tempo de status |
| `weather_alerts` | Alertas climáticos automáticos e oficiais |
| `missing_person_reports` | Denúncias de pessoas desaparecidas |
| `missing_person_comments` | Avistamentos/comentários das denúncias |

## Boas práticas

- Não versione dumps com dados reais. Use `schema.sql` e dados de teste anônimos.
- Em produção, **não** use `ddl-auto=update`: adote migrações versionadas
  (Flyway ou Liquibase) e mantenha o script como referência do modelo.
- Faça backup do banco e do diretório de uploads de imagens.
- Habilite TLS na conexão com o banco quando ele estiver em outra máquina.
- Restrinja o acesso ao banco à rede interna e use um usuário de aplicação sem
  privilégios de superusuário.
