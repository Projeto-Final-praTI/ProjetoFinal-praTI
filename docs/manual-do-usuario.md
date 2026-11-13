# Manual do usuário

Guia de uso da ZELO para visitantes, cidadãos e equipes municipais.

---

## 1. Acesso

Abra a URL da aplicação no navegador (desktop ou celular). O mapa é a tela
principal e carrega os pontos críticos próximos.

- **Visitante:** consulta mapa, pontos, alertas e a central de desaparecidos.
- **Cidadão autenticado:** registra pontos, comenta, confirma e denuncia.
- **Fiscal/Gestor:** atualiza status, modera denúncias e opera a própria cidade.
- **Root:** administra todo o território.

Para se cadastrar: **Entrar → Cadastre-se**. Informe nome, e-mail, CPF (somente
dígitos), senha (mínimo 6 caracteres) e cidade (opcional).

---

## 2. Mapa

| Ação | Como fazer |
|------|------------|
| Ver detalhe de um ponto | Clique no marcador ou na lista lateral |
| Aproximar/afastar | Rolagem do mouse ou botões do mapa |
| Ver sua localização | Botão de localização (usa GPS do navegador) |
| Agrupar marcadores | Automático em regiões com muitos pontos |
| Filtrar por período | Arraste as duas pontas da linha do tempo |
| Fechar um painel | Botão fechar ou "voltar" do navegador |

Sem permissão de localização, o app usa uma posição padrão e continua funcional.

> O filtro temporal esconde pontos **resolvidos** quando a janela termina no
> presente. Para vê-los, rebobine o fim para antes da resolução.

---

## 3. Registrar um ponto crítico

1. Faça login.
2. Toque em **Registrar ponto** (ou equivalente no menu).
3. Clique no local exato do problema no mapa.
4. Preencha:
   - **Título** curto e objetivo;
   - **Categoria** (buraco, ponte quebrada, alagamento, queda de árvore,
     deslizamento, outros);
   - **Descrição** do que aconteceu;
   - **Fotos** — de 1 a 5 imagens, até 10 MB cada.
5. Envie.

Regras importantes:

- Você precisa estar a **até 500 metros** do local. Caso contrário, o envio é
  recusado com a distância calculada.
- A cidade é preenchida automaticamente quando possível. Se o serviço de
  geocodificação falhar, o ponto é salvo sem cidade.
- O ponto nasce com status **Aberto**.

### Boas práticas

- Fotografe o problema de perto e com referência do local.
- Não inclua pessoas identificáveis sem necessidade.
- Descreva riscos imediatos (ex.: risco de queda, fiação exposta).

---

## 4. Acompanhar e colaborar

No detalhe de um ponto você pode:

| Ação | Requisito | Efeito |
|------|-----------|--------|
| Confirmar | Login | Soma 1 ao apoio; só vale uma vez por usuário |
| Comentar | Login | Publica informação na ocorrência |
| Ver linha do tempo | Público | Mostra status, autor, data e nota |
| Excluir | Autor, gestor da cidade ou root | Remove o ponto |

A confirmação é **idempotente**: clicar de novo não duplica o apoio.

---

## 5. Alertas

### 5.1 Alertas climáticos

São gerados automaticamente a partir da previsão do tempo para a região
consultada:

| Cor | Significado |
|-----|-------------|
| 🟡 Amarelo | Atenção — chuva acumulada, frio/geada |
| 🟠 Laranja | Perigo — chuva forte, calor, ventos intensos |
| 🔴 Vermelho | Perigo extremo — chuva extrema, calor extremo, ventos fortes |

O banner prioriza os alertas mais críticos.

### 5.2 Alertas oficiais

Publicados por gestores/root com duração e alcance definidos. Expiram
automaticamente e podem ser removidos antes do prazo.

---

## 6. Pessoas desaparecidas

### 6.1 Consultar

Abra **Desaparecidos** no cabeçalho. A central tem três abas:

- **Alertas ativos** — denúncias aprovadas e não expiradas na sua região.
- **Denunciar** — envio de nova denúncia.
- **Moderação** — visível para fiscal/gestor/root.

### 6.2 Denunciar

1. Faça login e abra **Desaparecidos → Denunciar**.
2. Informe nome da pessoa, tipo (desaparecimento ou sequestro), descrição,
   última informação conhecida, contato, cidade e localização.
3. Anexe uma **foto obrigatória**.
4. Envie.

A denúncia nasce como **Pendente**. Se a localização for informada, é disparado
um **pré-alerta imediato de 1 km por 10 minutos**, antes da moderação.

### 6.3 Acompanhar

Abra um alerta ativo para ver detalhes e o chat de avistamentos. O chat atualiza
automaticamente enquanto o painel está aberto. Você pode enviar texto e,
opcionalmente, uma imagem.

### 6.4 Moderar (fiscal/gestor/root)

1. Abra **Desaparecidos → Moderação**.
2. Analise a denúncia e a foto.
3. **Aprovar** define duração (5 min a 7 dias) e alcance:
   - **Local:** raio de 1 a 200 km (padrão 50 km);
   - **Global:** somente root.
4. **Recusar** exige um motivo.

Somente denúncias aprovadas e não expiradas aparecem publicamente.

> Em situação de risco imediato, acione as autoridades pelos canais oficiais. A
> ZELO é um apoio comunitário e não substitui o serviço de emergência.

---

## 7. Perfil

Em **Perfil** você pode:

- alterar o nome;
- definir ou limpar a cidade de atuação;
- trocar a senha (informando a senha atual).

A cidade é usada para o escopo de fiscal/gestor. Cidadãos comuns não precisam
preenchê-la.

---

## 8. Painel administrativo

Disponível para **gestor** e **root** em `/admin`.

### Gestor

- ver pontos e usuários da própria cidade;
- promover/rebaixar cidadãos (`USER` ⇄ `FISCAL`);
- publicar e remover alertas locais;
- moderar desaparecidos da cidade.

### Root

- tudo do gestor, em todas as cidades;
- alterar qualquer cargo;
- ver estatísticas globais;
- excluir usuários, optando por manter os pontos (autoria anonimizada) ou
  apagá-los;
- publicar alertas globais.

### Limitações de segurança

- Gestor não altera o próprio cargo nem cargos de gestor/root.
- Gestor sem cidade não consegue operar.
- A exclusão de usuário com pontos mantidos transfere a autoria para uma conta
  técnica.

---

## 9. Perguntas frequentes

**Preciso de cadastro para ver o mapa?**
Não. Consulta é pública; ações de escrita exigem login.

**Por que não consigo registrar um ponto?**
Verifique se você está a até 500 m do local e se anexou pelo menos uma foto.

**Por que meu ponto está sem cidade?**
A geocodificação pode ter falhado. O ponto continua válido; um gestor/root pode
gerenciá-lo.

**Posso confirmar o mesmo ponto várias vezes?**
Não. Cada usuário confirma uma vez; cliques extras são ignorados.

**Por que pontos resolvidos somem do mapa?**
O filtro temporal vai até o presente e oculta resolvidos. Rebobine o fim da
linha do tempo para vê-los.

**O alerta de desaparecido que enviei já está público?**
Não. Ele passa por moderação. O pré-alerta de 1 km/10 min é a exceção imediata.

**Esqueci a senha.**
Não há recuperação automática nesta versão. Procure um administrador.

**O mapa não mostra minha localização.**
Autorize o GPS no navegador. Sem permissão, o app usa uma posição padrão.

---

## 10. Privacidade

- Seu CPF e sua senha nunca são exibidos pela API.
- Fotos e comentários são públicos.
- Evite publicar dados sensíveis desnecessários.
- Consulte [seguranca-e-lgpd.md](seguranca-e-lgpd.md) para saber como os dados são
  tratados.
