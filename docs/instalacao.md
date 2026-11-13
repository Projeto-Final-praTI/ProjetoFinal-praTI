# Instalação e execução

Guia para executar a ZELO localmente: banco, backend e frontend.

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Uso |
|------------|---------------|-----|
| Java JDK | 21 | Backend |
| Maven | 3.9 | Build do backend |
| Node.js | 18 | Frontend |
| npm | 9 | Dependências do frontend |
| PostgreSQL | 16 | Banco |
| PostGIS | 3.x | Extensão geoespacial |
| Docker | 24 (opcional) | Execução em containers |

Verifique:

```bash
java -version
mvn -version
node -v
npm -v
psql --version
```

---

## 2. Banco de dados

Crie o banco e habilite o PostGIS:

```sql
CREATE DATABASE zelo_db;
\c zelo_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

Crie um usuário dedicado (exemplo; ajuste a senha):

```sql
CREATE USER zelo_user WITH PASSWORD 'zelo_pass';
GRANT ALL PRIVILEGES ON DATABASE zelo_db TO zelo_user;
\c zelo_db
GRANT ALL ON SCHEMA public TO zelo_user;
```

O schema é criado automaticamente pelo Hibernate
(`spring.jpa.hibernate.ddl-auto=update`). Não há scripts de migração versionados.

> Para produção, crie o banco com um usuário de aplicação sem superpoderes e
> adote migrações versionadas (Flyway/Liquibase).

---

## 3. Backend

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. Para gerar o jar:

```bash
mvn clean package
java -jar target/backend-1.0.0.jar
```

### Variáveis de ambiente

Nenhuma variável é obrigatória para desenvolvimento: os padrões de
`application.yml` apontam para `localhost:5432/zelo_db`. Para sobrescrever:

**PowerShell**

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/zelo_db"
$env:DB_USER="zelo_user"
$env:DB_PASSWORD="zelo_pass"
$env:JWT_SECRET="uma-chave-forte-com-no-minimo-32-bytes"
$env:APP_CORS_ALLOWEDORIGINS="http://localhost:5173"
mvn spring-boot:run
```

**Bash**

```bash
export DB_URL="jdbc:postgresql://localhost:5432/zelo_db"
export DB_USER="zelo_user"
export DB_PASSWORD="zelo_pass"
export JWT_SECRET="uma-chave-forte-com-no-minimo-32-bytes"
export APP_CORS_ALLOWEDORIGINS="http://localhost:5173"
mvn spring-boot:run
```

A lista completa está em [backend.md](backend.md#5-configuração).

### Verificação

```bash
curl http://localhost:8080/api/public/incidents?lat=-23.5505&lng=-46.6333&radiusMeters=5000
```

Swagger UI: `http://localhost:8080/docs`.

---

## 4. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite encaminha `/api` e `/uploads` para
`http://localhost:8080`, então não é necessário configurar URL de API.

### Build de produção

```bash
npm run build
npm run preview
```

O resultado fica em `frontend/dist/`.

### Teste da regra de linha do tempo

```bash
npm run test:filter
```

---

## 5. Execução com Docker

O repositório possui `backend/Dockerfile` e `frontend/Dockerfile`, mas **não
inclui um `docker-compose.yml`**. Para subir tudo manualmente:

```bash
# 1. rede
docker network create zelo

# 2. banco
docker run -d --name zelo-db --network zelo \
  -e POSTGRES_DB=zelo_db \
  -e POSTGRES_USER=zelo_user \
  -e POSTGRES_PASSWORD=zelo_pass \
  -v zelo_pgdata:/var/lib/postgresql/data \
  postgis/postgis:16-3.4

# 3. backend
docker build -t zelo-backend ./backend
docker run -d --name zelo-backend --network zelo \
  -e DB_URL="jdbc:postgresql://zelo-db:5432/zelo_db" \
  -e DB_USER=zelo_user \
  -e DB_PASSWORD=zelo_pass \
  -e JWT_SECRET="uma-chave-forte-com-no-minimo-32-bytes" \
  -e APP_CORS_ALLOWEDORIGINS="http://localhost:8080" \
  -v zelo_uploads:/app/uploads \
  zelo-backend

# 4. frontend
docker build -t zelo-frontend ./frontend
docker run -d --name zelo-frontend --network zelo -p 8080:80 zelo-frontend
```

O `nginx.conf` encaminha `/api` para o host `backend:8080`. Se o container do
backend tiver outro nome, ajuste o `proxy_pass` ou use um alias de rede
(`--network-alias backend`).

Acesse `http://localhost:8080`.

> As imagens de upload ficam no volume `zelo_uploads`. Sem volume, os arquivos
> são perdidos ao recriar o container.

---

## 6. Primeiro acesso

1. Abra o frontend.
2. Clique em **Entrar** → **Cadastre-se**.
3. Informe nome, e-mail, CPF (somente dígitos), senha e cidade.
4. O cadastro cria um usuário `USER`.
5. Para testar recursos administrativos, promova o usuário no banco ou use uma
   conta `ROOT` provisionada.

### Conta de sistema

O backend possui `SystemUserInitializer`, que garante a existência de uma conta
técnica usada para preservar a autoria de pontos quando um usuário é excluído com
a opção de manter as ocorrências. Essa conta não possui senha utilizável e não
deve ser usada para login.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Connection refused` no backend | PostgreSQL parado ou URL errada | Verifique `DB_URL` e o serviço do banco |
| `type "geometry" does not exist` | PostGIS não habilitado | `CREATE EXTENSION postgis;` no banco |
| Frontend recebe `401` em tudo | Token expirado | Faça login novamente |
| `403` em ações de fiscal/gestor | Usuário sem cidade | Preencha a cidade no perfil |
| Erro de CORS | Origem não listada | Inclua a origem em `APP_CORS_ALLOWEDORIGINS` |
| Upload falha | Arquivo acima de 10 MB ou requisição acima de 30 MB | Reduza o tamanho |
| Imagens não aparecem | `storage.local-path` sem permissão ou volume ausente | Ajuste o diretório/volume |
| Alertas climáticos vazios | Open-Meteo indisponível | Verifique a conectividade; o app continua funcional |
| Ponto sem cidade | Nominatim indisponível | O registro é mantido sem cidade; root pode gerenciá-lo |
| Build do frontend falha | Variável/import não utilizado | Remova ou use o símbolo; `tsc` é estrito |

Para detalhes de limites, cache e fallback das integrações, consulte
[apis-externas.md](apis-externas.md).

---

## 8. Parar e limpar

```bash
# processos locais: Ctrl+C nos terminais

# containers
docker rm -f zelo-frontend zelo-backend zelo-db
docker network rm zelo

# volumes (apaga dados)
docker volume rm zelo_pgdata zelo_uploads
```

---

## 9. Próximos passos

- Deploy e operação: [deploy.md](deploy.md)
- Referência da API: [api.md](api.md)
- Testes e checklist: [testes-e-qualidade.md](testes-e-qualidade.md)
