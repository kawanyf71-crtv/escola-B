# Rede Escola B

Site responsivo onde os participantes do curso de produção cultural negra da
Escola B declaram **o que oferecem**, publicam projetos declarando **o que
precisam**, e abrem **discussões por tema** que atravessam projetos diferentes.

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
npm run build        # gera dist/
```

`dist/` é estático. Em qualquer hospedagem, configure o *fallback* de SPA
(toda rota serve `index.html`), senão recarregar `/projetos/algo` dá 404.

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
| `npm run verificar:jornada` | Os critérios de aceite das histórias H1–H6 e os requisitos funcionais que dependem de interação: validações, correspondência de habilidade, interesse único, discussão que atravessa projeto. |
| `npm run verificar:contraste` | Contraste AA (WCAG 1.4.3) em todo texto visível, incluindo estados vazio, de erro e sem sessão. |
| `npm run verificar:acessibilidade` | Alvos de toque de 44px, rótulo em todo controle, `alt` em toda imagem, um `h1` por página, link de pulo no primeiro Tab. |

Rodando com um Chromium já instalado:
`PLAYWRIGHT_CHROMIUM=/caminho/para/chrome npm run verificar`.

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
  styles/global.css     identidade visual
  styles/fontes.css     @font-face das fontes auto-hospedadas
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

`RN-004` (toda discussão nasce de um projeto), `RN-005` (um tema por discussão),
`RN-007` (seis obrigatórios para publicar) e `RN-008` (um interesse por par
pessoa/projeto) estão como *constraint* na migração, não só no formulário.

---

## Identidade visual

Segue a seção 15 da spec: faixas de cor chapada de largura total, `border-radius`
zero (exceção de 3px em botão), zero sombra, zero gradiente, zero blur, títulos
em Archivo Black caixa alta com entrelinha 1.0, corpo em Inter a 16px, setas
triangulares maciças como pontuação, chips de canto reto.

**As fontes são servidas pelo próprio site** (`public/fontes/`, 172 KB nos
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
