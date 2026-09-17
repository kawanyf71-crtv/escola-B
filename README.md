# NÓIZ

Site responsivo onde a turma do curso de produção cultural negra da Escola B
declara **o que sabe fazer**, publica projetos declarando **o que precisa**, e
puxa **assuntos por tema** que atravessam projetos diferentes.

Feito por uma aluna da turma, pra turma. **A plataforma não é da Escola B** — a
Escola B é o contexto de quem está aqui, não a dona disto. Em todo texto de
interface, a menção à escola descreve a turma ("turma do curso da Escola B") e
nunca a propriedade do produto.

MVP construído a partir de `spec-rede-escola-b.md` (v3, 15/09/2026).

---

## Rodar

```bash
npm install
npm run dev          # http://localhost:5173
```

Abre funcionando, sem configurar nada. Nesse modo os dados ficam no
`localStorage` do navegador de quem abre — serve para desenvolver e para
demonstrar, **não** para a turma usar de verdade, porque cada pessoa veria uma
rede só dela. O rodapé avisa isso enquanto o modo estiver ligado.

## Ligar o Supabase (necessário para a turma usar)

### 1. Criar o projeto

Em [supabase.com](https://supabase.com), **New project**. Escolha a região
**South America (São Paulo)** — o banco fica mais perto de quem vai usar.
Guarde a senha do banco que ele pede; ela não é usada pelo site, mas é a única
forma de recuperar acesso direto ao Postgres depois.

### 2. Criar o banco

Abra **`supabase/instalar.sql`**, copie o arquivo inteiro, cole no **SQL Editor**
do Supabase e aperte **Run**. Uma vez só, num banco vazio.

> Copie o **conteúdo do arquivo**, não o nome dele. Se o editor reclamar de
> `trailing junk after numeric literal`, foi isso: ele recebeu texto que não é
> SQL.

O `instalar.sql` é gerado (`npm run sql`) e emenda as cinco migrações na ordem:

| migração | o que faz |
|---|---|
| `0001_esquema_inicial.sql` | tabelas, constraints das regras de negócio, políticas de RLS |
| `0002_assunto_sem_projeto.sql` | torna o projeto de origem do assunto opcional |
| `0003_bucket_de_imagens.sql` | bucket `imagens` e políticas do Storage |
| `0004_mural_de_eventos.sql` | tabela `eventos`, RLS, e a pasta `eventos` no bucket |
| `0005_perfis_suspensos.sql` | tabela `perfis_suspensos` com os 139 @ da turma, RLS e a função de saída |

Num banco que já existe, rode só a migração que falta — as de `migrations/`
continuam sendo a fonte, e cada uma depende da anterior. Fora de ordem dá erro
de dependência, o que é bom: o banco recusa em vez de ficar meio criado.

### 3. Desligar a confirmação de e-mail

**Authentication → Providers → Email**, desligue **Confirm email**. O fluxo leva
a pessoa direto do cadastro ao formulário de perfil (RF-002); com a confirmação
ligada, ela cadastra, cai numa tela de espera e some.

### 4. Pegar as chaves

**Project Settings → API**. Copie o **Project URL** e a **Publishable key**
(`sb_publishable_...`). Ela é feita pra ir no navegador: quem protege os dados é
a RLS, não o segredo da chave.

**Nunca** use a **Secret key** (`sb_secret_...`) aqui. Ela ignora a RLS inteira
— no navegador, qualquer pessoa com o site aberto leria e apagaria tudo.

> O Supabase renomeou as chaves. Publishable é a antiga **anon / public**;
> Secret é a antiga **service_role**. Projetos mais velhos ainda mostram os
> nomes antigos, e as duas formas funcionam igual aqui.

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`npm run dev` de novo: o aviso de modo local some. Com as duas variáveis
preenchidas o site usa o Supabase; sem elas, cai no adaptador local. As telas não
sabem qual dos dois está ativo.

> O lote de demonstração **não existe** no Supabase, e os botões dele somem
> sozinhos. Cada perfil do lote precisaria de um usuário de autenticação de
> verdade, e perfis fictícios não têm.

## Publicar na Vercel

### 1. Importar o repositório

Em [vercel.com](https://vercel.com), **Add New → Project**, escolha este
repositório. A Vercel detecta Vite sozinha: *build* `npm run build`, saída
`dist`. Não precisa mexer.

### 2. Pôr as variáveis

Em **Settings → Environment Variables**, as mesmas duas do `.env`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Marque os três ambientes (Production, Preview, Development). Elas são lidas **no
build**, não em tempo de execução: mudar uma variável exige um *redeploy* pra
valer.

### 3. Deploy

**Conectar o repositório não constrói nada.** A Vercel espera o próximo push na
branch de produção, então logo depois de importar a tela fica em "No Production
Deployment" — não é erro, é só que ainda não houve commit. O banner da Overview
diz qual branch ela está esperando; se for a certa, está tudo no lugar.

Pra destravar, três caminhos: fazer um commit qualquer na branch, usar
**Deployments → Create Deployment**, ou **Redeploy** num deploy que já exista.

O `vercel.json` do repositório já traz o *fallback* de SPA — sem ele, abrir
`/eventos` direto ou recarregar a página daria 404, porque o roteamento é do
React e não do servidor. Ele tem duas chaves e mais nada: o schema da Vercel
rejeita propriedade que não conhece, e o build falha antes de começar. Por isso
a explicação da regra mora aqui e não lá dentro.

### Conferir se o Supabase entrou no build

Abra o site publicado, aperte **F12** e olhe o **Console**. A mensagem
`[NÓIZ] Rodando com o adaptador local` significa que as variáveis não chegaram
no build — elas são lidas **no build**, não em tempo de execução, então adicionar
depois exige um **Redeploy** pra valer. Console silencioso: Supabase ligado.

O `vite.config.ts` também se acerta sozinho: o caminho dos arquivos é relativo
por padrão, mas a Vercel exporta `VERCEL=1` durante o build e ele troca para
absoluto. Sem isso, `./assets/x.js` sairia de dentro de `/eventos/abc` e a página
abriria em branco em qualquer rota que não fosse a raiz.

### 4. Voltar no Supabase

Com o domínio em mãos, **Authentication → URL Configuration**: ponha o endereço
da Vercel em **Site URL**. Não é obrigatório pro login por senha, mas é o que
mantém a porta certa caso um dia entre recuperação de senha ou link por e-mail.

### Publicar em outro lugar

```bash
npm run build                        # URLs limpas: /projetos/algo
VITE_ROTEADOR=hash npm run build     # URLs com hash: /#/projetos/algo
```

`dist/` é estático e, fora da Vercel, usa caminhos relativos — funciona servido
da raiz de um domínio ou de uma subpasta.

O padrão dá URLs limpas mas exige *fallback* de SPA. Com `VITE_ROTEADOR=hash` as
rotas ficam depois do `#` e o site roda em qualquer hospedagem estática sem
configurar nada: mais feio na barra de endereço, à prova de bala num link que
circula no WhatsApp. É esse o build da prévia.

---

## Verificar

```bash
npx playwright install chromium   # uma vez
npm run dev                       # em outro terminal
npm run verificar
```

Seis suítes, todas contra o navegador de verdade em 390px:

| Comando | O que confere |
|---|---|
| `npm run verificar:jornada` | Os critérios de aceite das histórias H1–H6 e os requisitos funcionais que dependem de interação: validações, correspondência de habilidade, interesse único, assunto que atravessa projeto, e a navegação do celular (a barra leva de uma seção a outra, diz onde se está, e o menu guarda só o que é secundário). |
| `npm run verificar:contraste` | Contraste AA (WCAG 1.4.3) em todo texto visível, incluindo estados vazio, de erro e sem sessão. |
| `npm run verificar:acessibilidade` | Alvos de toque de 44px, rótulo em todo controle, `alt` em toda imagem, um `h1` por página, link de pulo no primeiro Tab. |
| `npm run verificar:imagem` | O upload: compressão de um PNG de 12 MB, limite de 512x512 na foto e 1280px na capa, pré-visualização, remoção, arrastar e soltar, tipo recusado, persistência e compatibilidade com URL antiga. |
| `npm run verificar:exemplo` | O lote de demonstração: quantos registros de cada tipo, quais páginas de tema ficaram com conteúdo, se algum card estoura em 390px, se o selo EXEMPLO aparece em todo card do lote, se um perfil de exemplo consegue entrar (não pode) e se apagar o lote deixa intacto o que é de verdade. |
| `npm run verificar:ritmo` | Fundo preto único em toda tela e nenhuma faixa pintando por conta própria, mais o critério 1.4.11 da WCAG nos dois sentidos: nenhum botão que suma na superfície atrás dele, e nenhum campo ou chip de opção sem 3:1 entre o que o identifica e o fundo. O menu de tela cheia entra na conta — é a única superfície que só existe depois de um clique, e por isso a única que passava sem ser medida. |

Variáveis que as suítes aceitam:

- `PLAYWRIGHT_CHROMIUM` — caminho de um Chromium já instalado.
- `BASE_URL` — onde o site está (padrão `http://localhost:5173`).
- `ROTEADOR=hash` — confere o build estático, cujas rotas ficam depois do `#`.

Para conferir o build antes de publicar:

```bash
VITE_ROTEADOR=hash npm run build
npx serve dist                       # ou qualquer servidor estático
BASE_URL=http://localhost:3000 ROTEADOR=hash npm run verificar
```

---

## Como está organizado

```
src/
  lib/dominio.ts        listas fixas + tipos. FONTE ÚNICA das taxonomias.
  data/tipos.ts         o contrato que as telas consomem
  data/local.ts         adaptador localStorage (padrão)
  data/supabase.ts      adaptador Supabase
  data/index.ts         escolhe um dos dois pelas variáveis de ambiente
  data/redes.json       os 139 @ da turma — fonte do adaptador local E da 0005
  data/redes.ts         tipa o JSON acima; não guarda dado nenhum
  components/           layout, estados (vazio/carregando/erro), campos, cards
  pages/                uma por tela da seção 9 da spec
                        (o código fala "discussao"; a interface fala "assunto")
  styles/global.css     identidade visual
  styles/fontes.css     @font-face das fontes auto-hospedadas
  fontes/               os .woff2, processados pelo Vite (nome com hash)
supabase/migrations/    esquema + RLS
scripts/                gera instalar.sql e a migração 0005 (npm run sql)
verificacao/            as seis suítes acima
```

**A camada de dados fica atrás de uma interface** (`src/data/tipos.ts`) com dois
adaptadores. Foi essa decisão que permitiu entregar um MVP que abre hoje sem
infraestrutura e sobe para produção sem reescrever tela nenhuma.

### As regras que não podem quebrar

`RN-002` e `RN-003` — habilidade oferecida, conhecimento procurado, tema de
perfil, tema de projeto e tema de discussão leem os **mesmos arrays** de
`src/lib/dominio.ts`. Se essas listas divergirem, o cruzamento para de
funcionar e a página de tema deixa de existir. No banco elas viram `DOMAIN` do
Postgres, então o servidor também recusa um valor fora da lista.

`RN-005` (um tema por assunto), `RN-007` (seis obrigatórios para publicar) e
`RN-008` (um interesse por par pessoa/projeto) estão como *constraint* na
migração, não só no formulário.

**`RN-004` foi revertida.** A spec dizia que todo assunto nasce de um projeto,
para dar contexto à conversa e evitar fórum genérico. Hoje o vínculo é
**opcional**: dá para puxar assunto solto por `/assuntos/novo`, e quem tem
projeto publicado pode ligar o assunto a um deles. A migração `0002` só removeu
o `NOT NULL` — as linhas antigas seguem com o projeto que tinham.

Uma consequência que vale saber: um assunto ligado a um projeto **não
publicado** não aparece nas listas. Sem essa regra ele apareceria com a origem
em branco, disfarçado de solto. A regra vive na política de RLS da migração
`0002`, e não em cada adaptador, para os dois concordarem.

---

## Mural de eventos

Cadastro rápido onde a turma divulga o que tá rolando na cidade dela. Organiza e
exibe como uma bilheteria, mas **não vende, não emite ingresso e não processa
pagamento**: mostra o evento e manda pro link de quem organiza. Não há tabela de
ingresso, de pedido nem de check-in — o único caminho pra fora é a coluna `link`.

- `/eventos` — o mural. Filtros de estado, cidade, área, tema, quando e entrada;
  ordenação sempre por data de início crescente, sem alternativa; lista agrupada
  por mês, com o cabeçalho de cada grupo em amarelo sobre uma régua curta
  vermelha. É isso que dá o ritmo de bilheteria sem precisar trocar o fundo.
- `/eventos/novo` e `/eventos/:id/editar` — o formulário.
- `/eventos/:id` — a página do evento, com o botão de saída.

**O que já rolou sai da listagem sozinho.** Evento vencido no topo mata um mural
em três semanas. O corte é `coalesce(data_fim, data_inicio) < hoje`, e no
Postgres isso mora numa coluna gerada (`ultimo_dia`) porque o PostgREST não
compara duas colunas entre si — sem ela, o filtro viraria trabalho do cliente e o
mural traria o banco inteiro pra decidir. Os passados ficam atrás de um link no
fim da página, em ordem decrescente e com o banner esmaecido.

Datas são `date`, não `timestamptz`: um evento no dia 28 é dia 28 em qualquer
fuso. Por isso `src/lib/datas.ts` nunca usa `new Date(texto)` — o construtor lê
`"2026-11-28"` como meia-noite UTC e, no Brasil, devolve o dia 27.

O link é aceito colado sem esquema e recebe `https://` automaticamente, em vez de
ser recusado por isso. Quando o formato é Online, estado e cidade somem da tela e
deixam de ser exigidos — regra que está também como `check` no banco, senão um
evento presencial sem cidade entraria pela API.

Publicar exige perfil publicado, como todo o resto da rede.

O lote de demonstração traz cinco eventos, quatro por vir e um passado — é o que
permite conferir o mural e a seção "Já rolou" de uma vez. Os cartazes são SVG
gerado nas cores da marca, como as capas de projeto, mas com uma composição
própria (barras empilhadas): com a mesma imagem dos projetos, mural e mural de
projetos virariam a mesma coisa numa rolagem rápida.

**O que este mural não faz:** venda, ingresso, check-in, lista de presença,
contagem de interessados, mapa, recorrência, moderação, notificação e descrição
longa. O cadastro é curto de propósito — quem quiser detalhe clica no link.

## As redes da turma

A lista de @ que a turma foi deixando no grupo. Um **perfil suspenso** é um @ com
lugar guardado: não é conta, não é perfil, e não aparece no diretório de Gente —
vive só em `/gente/redes` e na busca do começo do cadastro.

São **139 registros**, do jeito que ela mandou: **6 sem nome** (aí o @ vira o
rótulo), **9 sem UF**, **2 sem @ nenhum**, 19 UFs, 153 handles sem uma repetição.
Nenhum handle foi corrigido, inventado ou completado — quem sabe qual é o @
certo é a dona dele.

- `/gente/redes` — a lista, uma pessoa por linha. Busca por nome ou @ (sem
  acento e sem caixa, com ou sem arroba), filtro só das UFs que existem, chip
  **JÁ TÁ AQUI** com link pro perfil de quem já chegou.
- `/comecar` — a etapa nova do cadastro, antes do formulário. Quem se acha na
  lista clica em **SOU EU** e o formulário abre com nome, cidade/UF, ocupação e
  Instagram já preenchidos, sob uma placa amarela que explica por quê. Quem não
  se acha vai pro formulário em branco com um clique, no botão que fica sempre
  visível.
- **Meu espaço** ganhou *"não era eu"*, que devolve o @ pra lista.

**A reivindicação só acontece quando o perfil é publicado.** Quem desiste no meio
não reivindica nada: o registro fica no rascunho do formulário (`suspenso_id`) e
some junto com ele. Uma pessoa segura um @ só — no Postgres é um `unique` na
coluna, e é por isso que o adaptador solta o anterior antes de pegar o novo.

**A página é aberta, sem login.** É a única tela de dentro do site que é: quem
está na lista, por definição, ainda não tem conta aqui, e precisa conseguir achar
o próprio @ — inclusive pra pedir pra sair. A lista foi montada sem ninguém pedir
pra entrar, então sair dela precisa ser mais fácil do que entrar: um link no fim
da página, o @ digitado, e o registro some na hora, sem login e sem aprovação de
ninguém.

Isso custou uma função no banco, e não foi escolha de gosto. O Postgres exige que
a linha **depois** de um `update` continue visível pela política de `select`, e a
política esconde justamente o que foi removido: um `update` direto seria
recusado. `sair_da_lista()` roda com os poderes de quem a criou, é a única porta
que escreve `removido`, e escreve só isso — `anon` não tem permissão de escrita
em coluna nenhuma da tabela. O `revoke` que abre a seção de RLS também não é
decoração: o Supabase já concede tudo em toda tabela nova de `public`, e sem
tirar primeiro a permissão por coluna não restringiria nada.

**Um handle não vira link:** `fauxtino.com.br` parece endereço de site, não
usuário do Instagram. O registro fica, o texto aparece, a âncora não — e a marca
está **no dado** (`nao_linkar`), não num palpite por formato: `aya.morart` e
`gia.quirino` também têm ponto e são @ legítimos.

Os dados moram em `src/data/redes.json` e são a fonte dos dois lados:
`src/data/redes.ts` os lê pro adaptador local e `scripts/gerar-redes-sql.mjs`
escreve a migração 0005 a partir do mesmo arquivo (`npm run sql`). Duas cópias
divergiriam; esta não tem como.

**O que esta lista não faz:** verificação de identidade de qualquer tipo,
importação de foto, bio ou seguidores do Instagram, convite por e-mail ou DM. E
perfil suspenso não entra no diretório de Gente. Quem diz que é a pessoa, é a
pessoa — a lista é de @ público de um grupo de curso, não de documento.

## Dados de exemplo

`Meu espaço` traz, numa área discreta no fim da página, os botões **Carregar
dados de exemplo** e **Apagar dados de exemplo**. O lote tem 4 pessoas, 4
projetos, 4 assuntos, 6 comentários, 4 interesses e 10 participações em
conversa, todos fictícios e marcados com `demo: true`. Cada card deles mostra o
selo **EXEMPLO**.

Três coisas que o lote garante:

- **Os perfis não fazem login.** O lote não cria conta nenhuma — são registros
  de leitura.
- **Apagar só apaga o que é de exemplo.** O filtro é o campo `demo`, e o que
  você criou de verdade não é tocado.
- **As imagens são SVG em data URI** (`src/data/imagensExemplo.ts`), geradas com
  as cores e os elementos da marca. Nenhuma URL externa, nenhuma foto de pessoa
  real. Um SVG dentro de `<img>` não alcança o `@font-face` da página, então as
  iniciais dos avatares caem numa pilha de fontes pesadas do sistema em vez da
  Archivo Black.

**Só funciona no modo local.** No Supabase, `participantes.id` referencia
`auth.users`, então cada perfil fictício exigiria um usuário de autenticação de
verdade. Os botões nem aparecem quando o Supabase está ligado.

Uma brecha deliberada, e só no adaptador local: **a lista de quem chegou junto
de um projeto do lote é visitável por qualquer pessoa logada**. Os projetos do
lote pertencem a perfis fictícios que ninguém acessa, e sem isso essa tela
ficaria impossível de avaliar. No Supabase a política de RLS continua exigindo
que quem lê seja a autora do projeto.

---

## Imagens

Foto de perfil e capa de projeto são **upload de arquivo** — clique ou arrastar
e soltar, JPG, PNG ou WEBP, com pré-visualização antes de salvar. Um componente
só (`src/components/CampoImagem.tsx`) serve os dois casos, mudando a proporção
(1:1 e 16:9) e a regra de tamanho.

**A compressão no navegador não é otimização, é o que impede a aplicação de
quebrar.** No modo local tudo vive no localStorage, que tem poucos megabytes de
cota: uma foto de celular sem comprimir estoura a cota e derruba a sessão
inteira de quem subiu — perfil, projetos e conversas junto. `src/lib/imagem.ts`
redimensiona em canvas (512x512 na foto, 1280px de largura na capa), exporta
JPEG a 0,8 e desce a qualidade em degraus até caber em 400 KB. Se nem assim
couber, a pessoa é avisada em vez de perder o trabalho. Na verificação, um PNG
de 12,4 MB vira 37 KB.

Onde a imagem mora é decisão do repositório, não da tela: com o Supabase
ligado ela sobe para o bucket `imagens` (criado pela migração `0003`) e o
registro guarda só a URL pública; sem ele, o registro guarda a data URL
comprimida. Cada pessoa só escreve na pasta que leva o próprio id.

Registros antigos que guardavam um endereço colado continuam funcionando — o
campo é uma string, e uma URL `http` é exibida igual.

---

## Copy

A copy segue `copy-rede-escola-b.md` (v2, 15/09/2026). Duas regras que não
podem escorregar quando alguém mexer num texto:

- **A pessoa gramatical é "a gente".** Quem escreve está dentro da turma, não é
  uma marca falando com um usuário. "Você conhece quantas?" é campanha; "A gente
  se vê toda terça" é alguém falando com um colega.
- **Gênero neutro por reformulação** em 100% das strings: "quem publicou", "quem
  abriu", "a gente", "você". Feminino genérico também seria defensável, mas aí
  precisa ser em toda a interface — meia dúzia solta lê como descuido.

Fora: gíria como tempero, emoji, exclamação e discurso motivacional de ONG
("transformar vidas", "empoderar").

A interface diz **assunto**; o código e o banco dizem **discussao**. Isso é
deliberado: renomear tabela, tipo e métodos não mudaria nada para quem usa e
invalidaria a migração já escrita.

O teste da copy não é automatizável: abrir no celular e ler em voz alta. Se
soar como alguém falando com um colega, está certo. Se soar como locução,
voltou a ser publicidade.

---

## Identidade visual

Segue a seção 15 da spec: faixas de cor chapada de largura total, `border-radius`
zero (exceção de 3px em botão), zero sombra, zero gradiente, zero blur, títulos
em Archivo Black caixa alta com entrelinha 1.0, corpo em Inter a 16px, setas
triangulares maciças como pontuação, chips de canto reto.

### Tipografia: quem grita e quem fala

Archivo Black é fonte de peso máximo, feita para título. Estava em título,
rótulo, chip, botão, contagem, opção, navegação e mensagem de erro — e quando
está em tudo, cada elemento grita no mesmo volume. Uma página onde tudo grita lê
como cartaz, não como ferramenta.

Hoje ela vale em seis lugares, e só neles: `h1`, `h2`, `h3`, `.contagem`,
`.marca`, `.botao`, `.selo-exemplo` e `.card__titulo`. Todo o resto da interface
— rótulo de campo, chip, opção, migalha, navegação, erro, sucesso — é Inter 600,
caixa alta onde já era, com `letter-spacing` para a caixa alta respirar no peso
menor. A assinatura da marca (entrelinha 1.0, `letter-spacing` normal) fica
intacta onde a Archivo Black ficou.

O `h1` é `clamp(1.5rem, 4vw, 2.25rem)` em toda tela. O de 8,6vw que existia
antes era medida de cartaz: numa tela ele toma a viewport inteira e faz o
conteúdo abaixo dele parecer legenda.

O aviso de erro deixou de ser retângulo vermelho cheio em caixa alta. A borda
vermelha do campo já diz onde foi; o texto, na cor do acento, diz o que houve.
Num formulário com quatro erros, quatro retângulos vermelhos davam a impressão
de que a tela inteira tinha dado errado.

**As fontes são servidas pelo próprio site** (`src/fontes/`, 172 KB nos
subconjuntos latin e latin-ext), não pelo CDN do Google. Tira uma dependência
de terceiro, economiza conexões no 4G e garante que a assinatura tipográfica
apareça mesmo em rede que bloqueie o Google Fonts. Trocar pela Shapiro 95 Super,
se a Escola B tiver a licença, são duas linhas em `src/styles/fontes.css`.

### Uma linguagem só

A identidade do BATEKOO é de peça gráfica, e peça gráfica é vista de uma vez:
por isso um cartaz pode ser um bloco de cor inteiro. Um site não — é um lugar
onde se permanece, rola e preenche.

Por um tempo o app teve dois tipos de página, e a entrada guardava as faixas
alternadas de cor. Não se sustentou: a pessoa entrava por uma linguagem e usava
outra, e as telas de acesso ficavam no meio do caminho — metade cartaz, metade
produto, com o título num eixo e o formulário em outro. Hoje é uma linguagem só,
do primeiro acesso ao formulário de perfil.

O fundo é `--preto` contínuo, do topo ao rodapé, em toda rota. A `.faixa`
continua existindo, mas como ritmo vertical: não pinta nada. Os modificadores de
cor dela (`--preto`, `--claro`, `--amarelo`, `--vermelho`) saíram do CSS e do
markup, e com eles todas as redefinições de token por faixa — era isso que fazia
o mesmo card mudar de aparência três vezes na mesma tela.

Os tokens de componente (`--card-fundo`, `--tinta-link`, `--tinta-titulo`,
`--acento`) têm **um valor só, válido na página inteira**, declarados em
`.pagina`. O preto ganha degraus para isso funcionar — `--superficie`,
`--linha`, `--tinta` e companhia —, que não são cinza de interface genérica: são
níveis dentro do `#111111` da marca, o que permite um card existir sem precisar
ser um retângulo amarelo.

Onde havia bloco de cor cheia, a cor passou para a borda. O `.cartaz` virou
superfície com uma barra de 4px na esquerda — amarela destaca, vermelha alerta,
cinza é neutra —, a mesma barra que o comentário já usava. O menu de tela cheia
deixou de ser uma tela amarela. E o chip secundário (`.chip--inverso`), que era
preto com tinta amarela para funcionar sobre faixa clara, virou chip de
contorno: preenchido é destaque, contorno é secundário, a mesma lógica dos
botões.

Um bloco estreito — formulário, texto de leitura — alinha pela esquerda com o
resto da página em vez de se centralizar. Quando cada faixa era um retângulo de
cor, a troca de eixo passava por mudança de registro; sobre fundo contínuo ela
lê como desalinho, com o título num eixo e o campo em outro.


### Superfície, borda e respiro

A borda de 4px foi desenhada para faixa de cor chapada, onde ela é o que separa
o card do campo atrás. Sobre fundo contínuo ela faz o contrário: cada elemento
vira uma caixa fechada e a tela lê como uma pilha de caixas. Então a borda afina
e quem separa passa a ser a superfície — card em `--superficie` com 1px, campo
de formulário em `--superficie-2`, ambos sobre o `--preto` da página.

O único bloco que continua pesando é o de correspondência de habilidade
(RF-008): deixou de ser retângulo amarelo cheio e virou card de borda amarela
de 4px. É o momento mais importante do produto — quando a pessoa descobre que
tem o que o projeto procura — e é o único que pode gritar.

A moldura de 7px preta fica: é assinatura da marca e é o que dá textura. Sobre
fundo escuro ela ganharia contorno nenhum e sumiria, então recebe um contorno
externo de 1px `--linha`. Contorno, não moldura clara — a borda clara em volta
do rosto já foi testada e chamava mais atenção que o rosto.

Espaçamento em escala única (`--e1` a `--e5`), porque parte da sensação de bloco
vem de espaço igual entre tudo: quando o vão dentro e fora dos elementos é o
mesmo, nada se agrupa. Dentro de card e entre cards, `--e2`; entre blocos de
conteúdo, `--e3`; entre seções, `--e4`.

E a separação entre seções, que era troca de fundo, passa a ser uma régua de 3px
vermelha de 4rem acima do título amarelo da seção. Curta de propósito: régua da
largura toda corta a página de novo; régua de 4rem agrupa o que vem embaixo.

### Duas entradas, a mesma abertura

A abertura (`src/components/Abertura.tsx`) roda em dois lugares: em `/`, para
quem chega de fora, e em `/inicio`, a home de quem já entrou. O texto é o mesmo
nos dois — é o que a plataforma é — e só os botões mudam: quem está de fora
precisa criar conta, quem está dentro precisa de um caminho pra dentro do que já
existe.

A `/inicio` continua depois da abertura com três seções que só existem lá:

- **Como isso nasceu**, que abre dizendo que o site não é da Escola B nem do
  BATEKOO, e sim um projeto independente de uma aluna da turma.
- **Quem construiu**, uma mini bio com a foto à esquerda e o texto à direita —
  no celular as duas colunas viram uma, com a foto em cima. O primeiro
  parágrafo fica à vista e o resto atrás de um botão (`aria-expanded` +
  `aria-controls`, o mesmo par que o menu já usa). O botão fica depois do
  texto: assim abrir não empurra pra fora da tela o que a pessoa acabou de
  clicar.

  A foto é procurada no build, não pedida ao servidor: `import.meta.glob` em
  `src/pages/Inicio.tsx` varre `src/fotos/kawany.{jpg,jpeg,png,webp}`. Sem
  arquivo, o `glob` devolve vazio, a página nem tenta carregar nada — sem 404
  no console, sem imagem quebrada — e o espaço fica com a inicial dentro da
  moldura, do mesmo jeito que um perfil sem foto. Basta pôr o arquivo no lugar
  pra ela aparecer; instruções em `src/fotos/LEIA-ME.md`.
- **O selo** "Pensado e sentido por humanos e desenvolvido por IA", com o
  relato do vibe coding e um botão discreto de WhatsApp.

A marca no cabeçalho leva pra `/inicio` quando há sessão, e pra `/` quando não
há. O login continua caindo em `/pessoas` — a home é onde se volta, não onde se
chega.

### Navegação contínua

No celular, a navegação era um botão que abria um menu amarelo em tela cheia:
para trocar de seção a pessoa saía da página e voltava sem referência de onde
estava — mais um corte, agora no tempo em vez do espaço.

Agora existe uma barra fixa no rodapé, abaixo de 55rem, com quatro itens: Gente,
Projetos, Eventos e Assuntos. Quatro porque acima disso cada alvo fica menor que
o dedo. Meu espaço saiu da barra quando o mural entrou e virou o avatar no canto
do cabeçalho, que é onde se procura a própria conta; Início e Temas ficam no
menu, e a home também está na marca. Cada item é seta da marca mais rótulo; o item ativo fica amarelo e
sublinhado — sublinhado porque cor sozinha não pode ser o único indicador
visual (WCAG 1.4.1), e é a mesma marcação que a navegação do desktop já usava.

O que sobrou — Início, Temas e Sair — ficou no menu de tela cheia, que deixa de ser a
navegação e passa a ser só o que se usa de vez em quando, atrás de um botão de
contorno no cabeçalho em vez de um retângulo amarelo. O cabeçalho afina junto:
no celular ele é só a marca à esquerda e esse botão à direita.

A migalha de volta em amarelo, logo abaixo do cabeçalho, é o outro fio de
continuidade — está em todas as telas de detalhe (perfil, projeto, assunto,
tema, quem chegou junto).

No desktop nada disso aparece: a barra some, a navegação horizontal completa
continua no cabeçalho.

### Desvios conscientes da marca

Os dois que a spec já previu, mais os que apareceram na conferência:

1. **Botão amarelo leva texto `#111111`**, não branco (previsto na spec).
2. **Corpo a 16px**, não 12,8px (previsto na spec).
3. **Título de seção em faixa amarela fica preto, não vermelho.** O vermelho
   sobre o amarelo dá **2,90:1** — reprova até no limiar de texto grande (3:1).
   Isso deixou de ser um caso vivo quando as faixas pararam de pintar: não há
   mais superfície amarela do tamanho de uma seção. O título é amarelo sobre
   preto (15,7:1) e o vermelho ficou onde ele passa — a régua curta acima do
   título, o botão, o aviso de erro, os números de contagem.
4. **Sobre vermelho, a tinta é preta.** `#F1F1F1` sobre `#ED3124` dá 3,67:1 e
   reprova em AA para texto normal. O botão já foi a exceção — a 19px em Archivo
   Black ele contava como "texto grande" e o off-white passava no limiar de 3:1.
   Quando o botão caiu para 16px essa folga acabou, então a regra virou uma só:
   sobre vermelho, tinta preta (4,56:1), em botão, botão pequeno, aviso de erro
   e texto corrido. É a mesma lógica do desvio nº 1, aplicada onde a spec não
   tinha chegado.

5. **A borda do campo de formulário é `#6A6A6A`, não `--linha`.** Um campo de
   texto é componente de interface, e a WCAG pede 3:1 entre o que o identifica e
   a superfície atrás (critério 1.4.11). Sobre o preto da página, `--linha`
   (`#2E2E2E`) dá **1,39:1** e o preenchimento `--superficie-2` dá **1,16:1** —
   nenhum dos dois identifica o campo como campo. `--linha-campo` (`#6A6A6A`) dá
   3,49:1, e o amarelo do foco se distingue dele por 3,78:1. O
   `verificar:ritmo` cobra isso em todo campo e todo chip de opção, do mesmo
   jeito que já cobrava dos botões.

6. **O botão "confira as redes da turma aqui" tem contorno `--linha-campo`, não
   `--linha`.** O pedido dizia `--linha`, que é a cor dos filetes. Pelo motivo
   do desvio anterior, um contorno de botão é a fronteira de um componente e não
   um filete: `--linha` daria 1,39:1 e o botão existiria só pelo rótulo. A cor
   continua cinza neutra — o que ela precisava era não disputar com o vermelho,
   e não disputa.

7. **Cada `@` da lista é um alvo de 44px.** Eles parecem texto corrido e não
   são: são destinos, e a auditoria pegou 245 links de 21px de altura. A linha
   da lista cresceu por causa disso, e é o certo — dedo não acerta 21px.

---

## O que este MVP não faz

Fora de escopo por decisão da spec (seção 12): chat, feed/curtida/seguidor,
discussão avulsa, grupo de estudo, acervo de aulas, painel da coordenação,
métricas, moderação, notificação por e-mail, app nativo.

Nada mais ficou de fora por limitação técnica.

## Em aberto na spec

Duas perguntas da seção 14 continuam sem resposta e não são de software:

- **Até quando isso precisa estar no ar.** Cada semana de construção custa uma
  aula de uso real.
- **O que acontece depois de 14/11** — acervo congelado ou continuidade.

### Em aberto na lista da turma

Quatro coisas dependem de uma resposta dela, e nenhuma delas é código:

- **`fauxtino.com.br`** — qual é o @ certo. Enquanto não vier, o registro fica e
  o texto aparece sem link.
- **`____amnh`** (em Ofe Martins) e **`cabeluda_` / `cabeluda__`** (em Bia Tech)
  — de quem é, e qual dos dois. Estão no campo `conferir` de cada registro, que
  nunca aparece na interface.
- **Erick Reifanny e Carolina Ramos chegaram sem @.** Aparecem na lista pelo
  nome, sem link nenhum. Na origem, o `@jahiamani` aparecia na linha da Carolina
  **e** na do Jahi Amani; ficou com o Jahi.
- **O registro da própria Kawany** entrou como qualquer outro, sem dono. Foi
  decisão de não presumir: se ela quiser, é um clique em "sou eu" no cadastro, e
  se não quiser estar lá, é o mesmo link de saída que vale pra turma toda.

E o campo `linkedin` (29 registros têm) é guardado e **não é usado**. A lista
tem o apelido (`ofe-martins`), não o endereço, e montar `linkedin.com/in/<x>` a
partir dele seria o mesmo palpite que o `fauxtino.com.br` já mostrou custar
caro. Basta ela confirmar que são caminhos de perfil pra virar link.

E o risco número um segue sendo o mesmo que a spec apontou: **a plataforma nasce
vazia**. Por isso os estados vazios são as telas mais trabalhadas aqui — cada
lista sem nada diz o que fazer em seguida, com o botão da ação a um clique.
Mas isso é mitigação, não solução: a solução é divulgação no grupo do WhatsApp.
