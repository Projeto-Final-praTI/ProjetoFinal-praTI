# Contribuição

Guia para contribuir com a ZELO: fluxo de branches, padrões de código, commits,
pull requests e documentação.

---

## 1. Fluxo de trabalho

- A `main` é protegida e não deve receber commits diretos.
- Cada mudança nasce em uma branch `feature/...`, `fix/...` ou `docs/...`.
- Toda alteração chega à `main` por **Pull Request**.
- Mantenha a branch atualizada com a `main` antes de abrir o PR.

```bash
git checkout main
git pull origin main
git checkout -b feature/minha-melhoria

# ... alterações ...

git add .
git commit -m "feat: descreve a mudança"
git push -u origin feature/minha-melhoria
```

---

## 2. Nomes de branch

| Prefixo | Uso |
|---------|-----|
| `feature/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `docs/` | Documentação |
| `refactor/` | Refatoração sem mudança de comportamento |
| `chore/` | Manutenção, dependências, build |
| `test/` | Testes |

Use nomes curtos, em minúsculas e com hífen: `feature/filtro-por-cidade`.

---

## 3. Commits

Recomenda-se **Conventional Commits**:

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção |
| `docs` | Documentação |
| `style` | Formatação sem mudança de lógica |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Build, dependências, configuração |

Exemplos:

```
feat(incidents): valida raio de 500 m no registro
fix(auth): evita logout em senha incorreta
docs(api): documenta moderação de desaparecidos
```

Boas práticas:

- Commits pequenos e coesos.
- Descrição no imperativo ("adiciona", não "adicionado").
- Explique **por que** no corpo quando a mudança não for óbvia.
- Não commite arquivos gerados (`dist/`, `target/`, `node_modules/`, uploads).

---

## 4. Padrões de código

### 4.1 Frontend

- TypeScript estrito; sem `any` desnecessário.
- DTOs em `src/types.ts`; chamadas HTTP em `src/api.ts`.
- Componentes em `src/components/`, hooks em `src/hooks/`.
- Use as classes de tema (`.zelo-*`) e as variáveis de z-index.
- Rode `npm run build` antes do PR.
- Evite dependências novas para problemas pequenos.

### 4.2 Backend

- Java 21 e convenções do Spring Boot.
- Controllers expõem DTOs, nunca entidades.
- Regras de negócio e RBAC ficam nos services.
- Validação de entrada com Bean Validation.
- Consultas espaciais nos repositories.
- Mensagens de erro claras e em português.
- Não logue tokens, senhas, CPF ou dados pessoais.

### 4.3 Banco

- O schema é derivado das entidades JPA (`ddl-auto=update`).
- Ao alterar entidades, considere o impacto em dados existentes.
- A evolução recomendada é adotar Flyway/Liquibase.

---

## 5. Pull Request

Um bom PR contém:

1. **Título** claro e no mesmo padrão dos commits.
2. **Descrição** com contexto, o que mudou e por quê.
3. **Como testar** (passos e comandos).
4. **Riscos e impactos** (banco, API, permissões).
5. **Prints** quando houver mudança visual.
6. Link para a issue, quando existir.

### Checklist do PR

- [ ] `npm run build` passa (frontend).
- [ ] `npm run test:filter` passa.
- [ ] `mvn -B package` passa (backend).
- [ ] Fluxo afetado validado manualmente.
- [ ] Sem segredos, tokens ou dados pessoais.
- [ ] Sem arquivos gerados ou uploads.
- [ ] Documentação atualizada em `docs/`.
- [ ] Migração/impacto de dados descrito, se houver.

### Revisão

- Pelo menos um revisor aprova.
- Comentários resolvidos antes do merge.
- Prefira **squash merge** para manter o histórico limpo, quando o time concordar.

---

## 6. Documentação

- Toda documentação fica em `docs/`.
- Documentos atuais descrevem o que está implementado.
- Documentos iniciais ficam em `docs/planejamento/` e são históricos.
- Ao mudar uma regra, atualize o documento correspondente:
  - requisitos → `requisitos.md`
  - endpoints → `api.md`
  - schema → `modelo-de-dados.md`
  - regras de segurança → `seguranca-e-lgpd.md`
- Use Mermaid para diagramas.
- Mantenha UTF-8 e links relativos funcionando.

---

## 7. Segurança na contribuição

- Nunca versione `.env`, senhas, tokens, chaves ou dumps.
- Não inclua IPs internos, credenciais de servidor ou dados de produção.
- Use variáveis de ambiente para configuração sensível.
- Se um segredo for commitado por engano, **rotacione-o** e remova do histórico.

---

## 8. Ambiente local

```bash
# backend
cd backend
mvn spring-boot:run

# frontend
cd frontend
npm install
npm run dev
```

Detalhes em [instalacao.md](instalacao.md).

---

## 9. Dúvidas e comunicação

- Abra uma issue descrevendo o problema ou a proposta.
- Use o PR para discutir a solução.
- Em caso de dúvida sobre regra de negócio, consulte [requisitos.md](requisitos.md)
  e [decisoes-tecnicas.md](decisoes-tecnicas.md).
