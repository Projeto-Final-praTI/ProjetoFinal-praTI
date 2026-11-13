# Segurança e LGPD

Este documento descreve os controles de segurança implementados, os dados
pessoais tratados e as recomendações para operação em conformidade com a LGPD.

> **Aviso:** este é um projeto acadêmico. As recomendações abaixo não substituem
> uma avaliação jurídica ou de segurança profissional antes de uso real.

---

## 1. Autenticação e sessão

| Controle | Implementação |
|----------|---------------|
| Autenticação | E-mail + senha, token **JWT** assinado com HMAC |
| Armazenamento de senha | **BCrypt** |
| Sessão | **Stateless** — sem cookie de sessão no backend |
| Validade do token | 24 h por padrão (`JWT_EXPIRATION_MS`) |
| Envio do token | `Authorization: Bearer <token>` |
| Expiração no cliente | `401` encerra a sessão e limpa o `localStorage` |
| Rotas públicas | `/api/auth/**`, `/api/public/**`, `/uploads/**`, `/docs`, `/swagger-ui/**`, `/v3/api-docs/**` |

O frontend guarda o token em `localStorage` (`zelo_token`). Isso simplifica o SPA,
mas aumenta a exposição a XSS. Mitigações recomendadas:

- manter o React sem `dangerouslySetInnerHTML` com conteúdo de usuário;
- aplicar Content Security Policy no proxy;
- considerar cookies `HttpOnly` + `SameSite` em uma evolução futura.

---

## 2. Autorização (RBAC)

| Papel | Escopo |
|-------|--------|
| `USER` | Ações autenticadas básicas |
| `FISCAL` | Cidade do próprio perfil |
| `GESTOR` | Cidade do próprio perfil + cargos `USER` ⇄ `FISCAL` |
| `ROOT` | Global |

- O `SecurityConfig` protege `/api/admin/**` (ROOT/GESTOR) e
  `/api/moderation/**` (ROOT/GESTOR/FISCAL).
- O escopo por cidade é validado nos serviços, não apenas na rota.
- Cidade vazia em fiscal/gestor resulta em `403`.
- O frontend esconde ações sem permissão, mas **a decisão final é sempre do
  backend**.
- Um usuário não pode alterar o próprio cargo nem promover para `GESTOR`/`ROOT`
  fora das regras.

---

## 3. Validação de entrada

- DTOs usam Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@NotNull`).
- Categoria, status, severidade, escopo e tipo são enums — valores inválidos são
  rejeitados.
- O registro de ponto valida a distância (≤ 500 m) no backend.
- Uploads têm limite de 10 MB por arquivo e 30 MB por requisição.
- Erros retornam mensagens padronizadas, sem stack trace para o cliente.

### Recomendações

- Validar o **tipo real** do arquivo (magic bytes), não só a extensão.
- Reencodar imagens para remover metadados EXIF (incluindo GPS).
- Definir nomes de arquivo gerados pelo servidor (já não usa o nome original).
- Limitar a quantidade de requisições por usuário/IP (rate limiting).

---

## 4. Uploads e imagens

- Arquivos são gravados em `storage.local-path` (padrão `./uploads`).
- São servidos publicamente em `/uploads/**`.
- As URLs retornadas são relativas por padrão, funcionando atrás de proxy.
- O container do backend roda com usuário não-root (UID 1001).

**Atenção:** qualquer pessoa com a URL acessa a imagem. Não envie documentos,
placas ou rostos além do necessário. Para denúncias de desaparecidos, a foto é
parte essencial do alerta e deve ser tratada como dado sensível.

Recomendações:

- migrar para object storage com URLs assinadas quando houver dados sensíveis;
- aplicar retenção e expurgo de imagens de ocorrências resolvidas;
- remover EXIF e limitar dimensões.

---

## 5. Dados pessoais tratados

| Dado | Finalidade | Onde fica | Exposição |
|------|------------|-----------|-----------|
| Nome completo | Identificação e autoria | `users.full_name` | Nome do autor em pontos/comentários |
| E-mail | Login e contato | `users.email` | Não exposto em rotas públicas |
| CPF | Identificação única | `users.cpf` | **Nunca** retornado pela API |
| Senha | Autenticação | `users.password_hash` | Hash BCrypt, nunca exposto |
| Cidade | Escopo de gestão | `users.city` | Pode aparecer em contexto administrativo |
| Localização | Registro e alertas | `geometry` | Pública para pontos e alertas |
| Fotos | Evidência | `/uploads` | Pública |
| Contato do denunciante | Retorno sobre desaparecido | `missing_person_reports.contact` | Uso restrito à operação |
| Comentários/avistamentos | Colaboração | tabelas de comentários | Públicos |

### Bases legais e finalidade

- **Execução de política pública / interesse público:** monitoramento de
  infraestrutura urbana e alertas de risco.
- **Consentimento e legítimo interesse:** participação comunitária.
- **Proteção da vida:** alertas de pessoas desaparecidas.

Cada dado deve ter finalidade documentada e ser limitado ao necessário
(minimização).

---

## 6. Direitos dos titulares

A LGPD garante ao titular, entre outros:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários;
- portabilidade;
- informação sobre compartilhamento;
- revogação do consentimento, quando aplicável.

### Como o sistema atende hoje

| Direito | Atendimento atual | Lacuna |
|---------|-------------------|--------|
| Acesso/correção | Perfil permite editar nome, cidade e senha | E-mail/CPF não são editáveis pelo usuário |
| Eliminação | ROOT exclui usuário, com opção de manter ou apagar pontos | Não há autoatendimento |
| Anonimização | Exclusão com manutenção dos pontos usa conta técnica | — |
| Portabilidade | Não implementada | Exportação de dados |
| Informação | Esta documentação e a tela "Sobre" | Política de privacidade formal |

Recomenda-se publicar uma **Política de Privacidade** e um canal de contato do
encarregado (DPO).

---

## 7. Retenção e descarte

Não há rotina automática de expurgo. Recomendações:

| Dado | Retenção sugerida |
|------|-------------------|
| Pontos resolvidos | Manter histórico; expurgar imagens após prazo definido |
| Alertas expirados | Remover após N dias do término |
| Denúncias recusadas | Excluir após prazo curto, salvo obrigação legal |
| Comentários | Acompanhar o ciclo de vida do ponto |
| Logs | 6 a 12 meses, sem dados pessoais desnecessários |
| Backups | Ciclo definido, com descarte seguro |

Implemente um job agendado para expurgo e registre a operação.

---

## 8. Segurança de infraestrutura

- **HTTPS obrigatório** em produção, com HSTS no proxy.
- Banco acessível apenas na rede interna; usuário de aplicação sem superpoderes.
- Segredos (`JWT_SECRET`, `DB_PASSWORD`) fora do repositório.
- Backups criptografados e com acesso restrito.
- Princípio do menor privilégio para containers e banco.
- Atualizações regulares de dependências e da imagem base.
- Logs sem tokens, senhas ou CPF.
- `/docs` público expõe apenas metadados da API; desabilite em produção se não for
  necessário.

### Cabeçalhos recomendados no nginx

```nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; connect-src 'self'" always;
```

Ajuste a CSP conforme os domínios de mapa e vídeo usados.

---

## 9. Riscos conhecidos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Token em `localStorage` | XSS pode roubar sessão | CSP, sanitização, cookies HttpOnly no futuro |
| Imagens públicas | Exposição de conteúdo sensível | Retenção, EXIF, storage privado |
| Sem rate limiting | Spam e força bruta | Limite no proxy/gateway |
| Sem migrações | Schema divergente | Flyway/Liquibase |
| CPF coletado | Dado sensível sob a LGPD | Minimização, acesso restrito, base legal |
| Geolocalização precisa | Risco à privacidade | Usar apenas para validação e não persistir histórico do usuário |
| Sem política de privacidade | Não conformidade | Publicar documento e canal do titular |

---

## 10. Checklist de privacidade

- [ ] Política de privacidade publicada.
- [ ] Base legal e finalidade documentadas por dado.
- [ ] Canal do titular e do encarregado definidos.
- [ ] Retenção e expurgo automatizados.
- [ ] EXIF removido das imagens.
- [ ] Acesso administrativo auditado.
- [ ] Backups criptografados e testados.
- [ ] Logs sem dados pessoais.
- [ ] Revisão de dependências e patches.
- [ ] Teste de restauração de backup.
