# NÓIS

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

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/migrations/0001_esquema_inicial.sql`
   inteiro. Ele cria as tabelas, as constraints das regras de negócio e as
   políticas de RLS.
3. Em **Authentication → Providers → Email**, desligue "Confirm email" — o
   fluxo da spec leva a pessoa direto do cadastro ao formulário de perfil, sem
   passar por caixa de entrada.
4. Copie `.env.example` para `.env` e preencha:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. `npm run dev` de novo. O aviso de modo local some.

Com as duas variáveis preenchidas o site usa o Supabase; sem elas, cai no
adaptador local. As telas não sabem qual dos dois está ativo.

## Publicar

```bash
npm run build                        # URLs limpas: /projetos/algo
VITE_ROTEADOR=hash npm run build     # URLs com hash: /#/projetos/algo
```

`dist/` é estático e usa caminhos relativos, então funciona servido da raiz de
um domínio ou de uma subpasta.

Qual dos dois builds usar depende da hospedagem. O padrão dá URLs limpas mas
exige *fallback* de SPA (toda rota serve `index.html`), senão recarregar
`/projetos/algo` dá 404. Com `VITE_ROTEADOR=hash` as rotas ficam depois do `#`
e o site roda em qualquer hospedagem estática sem configurar nada — mais feio
na barra de endereço, à prova de bala num link que circula no WhatsApp.

---

## Verificar

```bash
npx playwright install chromium   # uma vez
npm run dev                       # em outro terminal
npm run verificar
```

Três suítes, todas contra o navegador de verdade em 390px:

| Comando | O que confere |
|---|---|
| `npm run verificar:jornada` | Os critérios de aceite das histórias H1–H6 e os requisitos funcionais que dependem de interação: validações, correspondência de habilidade, interesse único, assunto que atravessa projeto. |
| `npm run verificar:contraste` | Contraste AA (WCAG 1.4.3) em todo texto visível, incluindo estados vazio, de erro e sem sessão. |
| `npm run verificar:acessibilidade` | Alvos de toque de 44px, rótulo em todo controle, `alt` em toda imagem, um `h1` por página, link de pulo no primeiro Tab. |
| `npm run verificar:imagem` | O upload: compressão de um PNG de 12 MB, limite de 512x512 na foto e 1280px na capa, pré-visualização, remoção, arrastar e soltar, tipo recusado, persistência e compatibilidade com URL antiga. |
| `npm run verificar:exemplo` | O lote de demonstração: quantos registros de cada tipo, quais páginas de tema ficaram com conteúdo, se algum card estoura em 390px, se o selo EXEMPLO aparece em todo card do lote, se um perfil de exemplo consegue entrar (não pode) e se apagar o lote deixa intacto o que é de verdade. |
| `npm run verificar:ritmo` | As regras de cor por tipo de página. Na página-cartaz: nunca duas faixas da mesma cor coladas, no máximo uma faixa amarela por tela, preto como base da maior parte da área pintada. Na página-ferramenta: fundo preto único, nenhuma faixa pintando por conta própria. Nas duas: nenhum botão que suma na superfície atrás dele. |

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
  components/           layout, estados (vazio/carregando/erro), campos, cards
  pages/                uma por tela da seção 9 da spec
                        (o código fala "discussao"; a interface fala "assunto")
  styles/global.css     identidade visual
  styles/fontes.css     @font-face das fontes auto-hospedadas
  fontes/               os .woff2, processados pelo Vite (nome com hash)
supabase/migrations/    esquema + RLS
verificacao/            as três suítes acima
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

O tamanho dos títulos também muda por tipo de página. Na página-cartaz o `h1`
continua em `clamp(1.875rem, 8.6vw, 4.5rem)` — é a medida que faz ANCESTRALIDADE
caber em uma linha a 390px e é o que dá o soco na entrada. Na página-ferramenta
ele cai para `clamp(1.5rem, 4vw, 2.25rem)`: um `h1` de 8,6vw numa tela interna
toma a viewport inteira e faz o conteúdo abaixo dele parecer legenda.

O aviso de erro deixou de ser retângulo vermelho cheio em caixa alta. A borda
vermelha do campo já diz onde foi; o texto, na cor do acento, diz o que houve.
Num formulário com quatro erros, quatro retângulos vermelhos davam a impressão
de que a tela inteira tinha dado errado.

**As fontes são servidas pelo próprio site** (`src/fontes/`, 172 KB nos
subconjuntos latin e latin-ext), não pelo CDN do Google. Tira uma dependência
de terceiro, economiza conexões no 4G e garante que a assinatura tipográfica
apareça mesmo em rede que bloqueie o Google Fonts. Trocar pela Shapiro 95 Super,
se a Escola B tiver a licença, são duas linhas em `src/styles/fontes.css`.

### Dois tipos de página

A identidade do BATEKOO é de peça gráfica, e peça gráfica é vista de uma vez:
por isso um cartaz pode ser um bloco de cor inteiro. Um site não — é um lugar
onde se permanece, rola e preenche. As duas coisas não obedecem à mesma regra,
então o app declara qual é qual em `Layout.tsx` (`ROTAS_CARTAZ`) e o CSS trata
cada uma no seu bloco:

| | `.pagina--cartaz` | `.pagina--app` |
|---|---|---|
| onde | a entrada (`/`) | todo o resto |
| o que é | peça de comunicação | ferramenta |
| fundo | faixas alternadas de cor | preto contínuo, um só |
| onde a cor vive | no campo de fundo | dentro dos objetos: título, chip, seta, borda, botão, estado |

Na página-ferramenta a `.faixa` continua existindo como ritmo vertical, mas não
pinta: `background: transparent`. Os tokens de componente (`--card-fundo`,
`--tinta-link`, `--tinta-titulo`, `--acento`) passam a ter **um valor só na
página inteira**, em vez de serem redefinidos por cada faixa. Era essa
redefinição que fazia o mesmo card mudar de aparência três vezes na mesma tela.

O preto ganha degraus para isso funcionar — `--superficie`, `--linha`, `--tinta`
e companhia — que não são cinza de interface genérica: são níveis dentro do
`#111111` da marca, o que permite um card existir sem precisar ser um retângulo
amarelo.

### Superfície, borda e respiro (página-ferramenta)

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

### Proporção e ritmo (página-cartaz)

Na entrada, o preto é a base e precisa ocupar mais área pintada que qualquer
outra cor, medido pelo `verificar:ritmo`, que desconta da faixa os blocos com
fundo próprio — uma faixa amarela cheia de cards pretos pinta muito menos
amarelo do que a altura dela sugere. Cabeçalho e rodapé entram na conta de área;
na conta de alternância, não.

O amarelo é acento: no máximo uma faixa cheia por tela, às vezes nenhuma. As
faixas alternam preto → off-white → acento → preto, e duas da mesma cor nunca
se encostam.

Na página-ferramenta essas três regras não se aplicam — não há faixa pintada
para alternar. No lugar delas o `verificar:ritmo` cobra o oposto: nenhuma faixa
pinta fundo próprio, e o fundo da página é o preto da marca. O relatório lista
as ilhas de superfície que sobram em cada tela (card, cartaz, campo branco),
que é o material dos próximos passos.

O vermelho é a terceira cor e é o que quebra o binário amarelo/preto: títulos de
seção, botão secundário, ações destrutivas, setas de destaque e os números de
contagem.

Onde não há fotografia, os elementos gráficos da marca entram como quebra: setas
triangulares maciças e o globo em traço grosso sem preenchimento
(`src/components/Grafismo.tsx`). Os estados vazios ganham uma seta grande como
elemento visual central.

### Desvios conscientes da marca

Os dois que a spec já previu, mais um que apareceu na conferência:

1. **Botão amarelo leva texto `#111111`**, não branco (previsto na spec).
2. **Corpo a 16px**, não 12,8px (previsto na spec).
3. **Título de seção em faixa amarela fica preto, não vermelho.** O vermelho
   sobre o amarelo dá **2,90:1** — reprova até no limiar de texto grande (3:1).
   Vermelho como cor de título funciona sobre preto (4,56:1) e sobre off-white
   (3,67:1, válido na página-cartaz porque lá todo `h2` tem no mínimo 28px), e é
   onde ele está. Na faixa amarela, a marca de destaque antes do título é que
   fica vermelha — ela é decorativa e não responde por contraste de texto. Na
   página-ferramenta o `h2` encolheu e saiu da faixa de texto grande, mas lá o
   título é amarelo sobre preto (15,7:1) e a conta não aperta.
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

E o risco número um segue sendo o mesmo que a spec apontou: **a plataforma nasce
vazia**. Por isso os estados vazios são as telas mais trabalhadas aqui — cada
lista sem nada diz o que fazer em seguida, com o botão da ação a um clique.
Mas isso é mitigação, não solução: a solução é divulgação no grupo do WhatsApp.
