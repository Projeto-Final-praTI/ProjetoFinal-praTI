# Testes e qualidade

Este documento descreve o que é validado automaticamente, como executar os testes
e o checklist manual de qualidade do projeto.

---

## 1. Situação atual

| Área | Automação | Observação |
|------|-----------|------------|
| Frontend — build | `npm run build` | `tsc` estrito + Vite |
| Frontend — testes unitários (Jest) | `npm test` / `npm run test:coverage` | Testes em `src/__tests__` com cobertura configurada (Jest + ts-jest) |
| Frontend — regra de linha do tempo | `npm run test:filter` | Script Node isolado (validação adicional) |
| Backend — testes unitários (JUnit) | `mvn test` | Testes JUnit 5 + Mockito em `src/test/java` (autenticação e CRUD/regras de negócio) |
| Backend — cobertura | `mvn verify` | JaCoCo gera relatório e valida cobertura mínima configurada (>= 70%) |
| API — contrato | Swagger/OpenAPI | Documentação viva em `/docs` |
| Banco — schema | Hibernate `ddl-auto=update` | Sem migrações versionadas |

---

## 2. Frontend

### 2.1 Build com checagem de tipos

```bash
cd frontend
npm ci
npm run build
```

O `tsc` roda em modo estrito, com `noUnusedLocals` e `noUnusedParameters`. O build
falha em caso de erro de tipo, import não usado ou parâmetro não utilizado.

### 2.2 Testes unitários (Jest)

```bash
cd frontend
npm install
npm test
npm run test:coverage
```

Os testes unitários do frontend utilizam **Jest** (com `ts-jest`) e ficam em
`frontend/src/__tests__`. A suíte cobre lógica crítica da aplicação (ex.: roteamento
e fluxos principais), e o projeto possui configuração de cobertura para geração de
relatório e verificação de limiar mínimo.

### 2.3 Teste da linha do tempo (script)

```bash
npm run test:filter
```

O script `scripts/check-resolved-filter.mjs` valida a regra `isActiveDuring`, que
define quais pontos aparecem no mapa conforme a janela de duas pontas:

- o ponto aparece se foi criado dentro da janela;
- um ponto resolvido desaparece quando a janela termina **depois** da resolução;
- rebobinar o fim para antes da resolução faz o ponto reaparecer;
- arrastar o início para trás reinclui pontos antigos.

O script imprime `PASS`/`FAIL` por verificação e retorna código de erro se alguma
falhar. São **8 verificações**.

### 2.4 Verificação manual do SPA

| Cenário | Resultado esperado |
|---------|--------------------|
| Abrir `/` sem sessão | Mapa carrega e mostra pontos públicos |
| Abrir `/login` direto | Modal de login abre sobre o mapa |
| Fechar modal | Volta para `/` sem quebrar o histórico |
| Recarregar em `/admin` logado como gestor | Painel abre (sessão restaurada antes do guarda) |
| Recarregar em `/admin` sem permissão | Redireciona para `/` |
| Token expirado | Sessão encerrada e modal de login |
| Senha errada no login | Mensagem no formulário, sem recarregar a página |

---

## 3. Backend

### 3.1 Compilação e testes unitários (JUnit)

```bash
cd backend
mvn test
mvn verify
```

- `mvn test`: executa os testes unitários (**JUnit 5 + Mockito**) em `backend/src/test/java`,
  cobrindo componentes críticos como autenticação e regras de negócio/CRUD de incidentes.
- `mvn verify`: executa testes, gera relatório do **JaCoCo** e valida a cobertura mínima
  configurada (>= 70%).
- Relatório de cobertura: `backend/target/site/jacoco/index.html`.

### 3.2 Teste manual da API

Com o backend em execução, use Swagger em `http://localhost:8080/docs` ou `curl`.

Fluxo mínimo:

1. `POST /api/auth/register` — cria usuário e retorna token.
2. `POST /api/auth/login` — valida credenciais.
3. `POST /api/incidents` — registra ponto com imagem e coordenadas próximas.
4. `GET /api/public/incidents?lat&lng&radiusMeters` — confirma que aparece.
5. `POST /api/incidents/{id}/upvote` duas vezes — contador incrementa só uma.
6. `POST /api/incidents/{id}/comments` — comentário aparece no detalhe.
7. `PUT /api/incidents/{id}/status` com usuário `USER` — retorna `403`.
8. Promover o usuário a `FISCAL` e repetir — retorna `200` e grava histórico.
9. `DELETE /api/incidents/{id}` com outro usuário — retorna `403`.
10. `DELETE /api/incidents/{id}` com o autor — retorna `204`.

### 3.3 Casos de borda importantes

| Caso | Esperado |
|------|----------|
| Registro a mais de 500 m | `422` com distância |
| Registro sem imagem | `400` |
| Mais de 5 imagens | `400` |
| Arquivo acima de 10 MB | `400`/`413` |
| E-mail duplicado | `400` |
| CPF duplicado | `400` |
| Senha com menos de 6 caracteres | `400` |
| Fiscal sem cidade | `403` |
| Gestor alterando cargo de outro gestor | `403` |
| Aprovação com duração fora de 5 min–7 dias | `400` |
| Aprovação `GLOBAL` por gestor | `403` |
| Denúncia não aprovada em rota pública | Não aparece |

---

## 4. Checklist de aceite da versão atual

- [ ] Aplicação acessível por URL.
- [ ] Mapa e alertas públicos sem cadastro.
- [ ] Cadastro, login e logout.
- [ ] Registro de ponto com localização e 1–5 imagens.
- [ ] Bloqueio acima de 500 m.
- [ ] Ponto visível no mapa e no detalhe.
- [ ] Comentário e confirmação idempotente.
- [ ] Alteração de status com histórico.
- [ ] Exclusão respeitando autor/cidade/root.
- [ ] Alertas climáticos e oficiais com severidade.
- [ ] Denúncia de desaparecido com pré-alerta e moderação.
- [ ] Painel administrativo com escopo por cidade.
- [ ] Erros padronizados e tratados no frontend.
- [ ] Build do frontend e da API sem erros.
- [ ] Nenhum segredo versionado.

---

## 5. Melhorias recomendadas (evolução)

| Item | Recomendação |
|------|--------------|
| Testes de integração backend | Ampliar com testes de integração usando Testcontainers + PostGIS |
| Testes de componentes/UI frontend | Adicionar testes de componentes (React Testing Library) para fluxos visuais |
| Testes E2E | Playwright cobrindo cadastro, registro e moderação ponta a ponta |
| CI de qualidade | Workflow de `pull_request` rodando build, testes e cobertura |
| Migrações de banco | Adotar Flyway/Liquibase para versionamento de schema |
| Teste de carga | k6 ou Gatling nas consultas geoespaciais |
| Análise estática/lint | Checkstyle/SpotBugs no backend e ESLint/Prettier no frontend |

### Exemplo de teste de integração (esboço)

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class IncidentIntegrationTest {

    @Container
    static PostgreSQLContainer<?> db =
        new PostgreSQLContainer<>("postgis/postgis:16-3.4");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", db::getJdbcUrl);
        registry.add("spring.datasource.username", db::getUsername);
        registry.add("spring.datasource.password", db::getPassword);
    }

    // ...
}
```

---

## 6. Definição de pronto (DoD)

Uma entrega é considerada pronta quando:

1. O código compila (`mvn package` e `npm run build`).
2. `npm run test:filter` passa.
3. O fluxo afetado foi validado manualmente no Swagger ou na UI.
4. Não há segredos, dados pessoais ou artefatos gerados no commit.
5. A documentação em `docs/` foi atualizada quando a regra mudou.
6. O PR descreve o que mudou, como testar e riscos.
