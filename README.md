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

**As fontes são servidas pelo próprio site** (`src/fontes/`, 172 KB nos
subconjuntos latin e latin-ext), não pelo CDN do Google. Tira uma dependência
de terceiro, economiza conexões no 4G e garante que a assinatura tipográfica
apareça mesmo em rede que bloqueie o Google Fonts. Trocar pela Shapiro 95 Super,
se a Escola B tiver a licença, são duas linhas em `src/styles/fontes.css`.

### Desvios conscientes da marca

Os dois que a spec já previu, mais um que apareceu na conferência:

1. **Botão amarelo leva texto `#111111`**, não branco (previsto na spec).
2. **Corpo a 16px**, não 12,8px (previsto na spec).
3. **Sobre vermelho, texto pequeno leva tinta preta.** `#F1F1F1` sobre `#ED3124`
   dá 3,67:1 e reprova em AA para texto normal. Só passa quando o rótulo conta
   como "texto grande" — o que vale para o botão padrão (19px em Archivo Black),
   mas não para botão pequeno, aviso de erro ou texto corrido dentro de uma
   faixa vermelha. Nesses, a tinta é preta (4,59:1). É a mesma lógica do desvio
   nº 1, aplicada onde a spec não tinha chegado.

---

## O que este MVP não faz

Fora de escopo por decisão da spec (seção 12): chat, feed/curtida/seguidor,
discussão avulsa, grupo de estudo, acervo de aulas, painel da coordenação,
métricas, moderação, notificação por e-mail, app nativo.

Além desses, **uma coisa ficou de fora por limitação e vale registrar**:

- **Upload de imagem.** Foto de perfil e capa de projeto entram como **link para
  uma imagem**, não como arquivo enviado. Subir arquivo exige um bucket do
  Supabase Storage, que não dá para provisionar junto com o código. Quando o
  projeto Supabase existir, é criar um bucket público `imagens`, trocar os dois
  campos de URL por um `<input type="file">` e chamar `storage.from('imagens')
  .upload(...)`. Nada no modelo de dados muda: as colunas já guardam uma URL.

## Em aberto na spec

Duas perguntas da seção 14 continuam sem resposta e não são de software:

- **Até quando isso precisa estar no ar.** Cada semana de construção custa uma
  aula de uso real.
- **O que acontece depois de 14/11** — acervo congelado ou continuidade.

E o risco número um segue sendo o mesmo que a spec apontou: **a plataforma nasce
vazia**. Por isso os estados vazios são as telas mais trabalhadas aqui — cada
lista sem nada diz o que fazer em seguida, com o botão da ação a um clique.
Mas isso é mitigação, não solução: a solução é divulgação no grupo do WhatsApp.
