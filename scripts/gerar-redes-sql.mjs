/**
 * Gera `supabase/migrations/0005_perfis_suspensos.sql` a partir de
 * `src/data/redes.json`.
 *
 * O JSON é a fonte: é o mesmo arquivo que `src/data/redes.ts` importa pro
 * adaptador local. Sem este script, a lista do navegador e a lista do banco
 * seriam duas cópias da mesma coisa — e duas cópias divergem.
 *
 *   npm run sql
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
const ENTRADA = join(RAIZ, 'src', 'data', 'redes.json');
const SAIDA = join(RAIZ, 'supabase', 'migrations', '0005_perfis_suspensos.sql');

const registros = JSON.parse(readFileSync(ENTRADA, 'utf8'));

// `ordem` é o único campo que este script inventa: é o que faz a lista sair do
// banco na mesma ordem em que ela chegou do grupo.
const comOrdem = registros.map((r, i) => ({
  ordem: i + 1,
  nome: r.nome ?? null,
  uf: r.uf ?? null,
  local: r.local ?? null,
  handles: r.handles ?? [],
  ocupacao: r.ocupacao ?? null,
  linkedin: r.linkedin ?? null,
  nao_linkar: r.nao_linkar ?? [],
  conferir: r.conferir ?? null,
}));

const semNome = comOrdem.filter((r) => !r.nome).length;
const semUf = comOrdem.filter((r) => !r.uf).length;

const json = comOrdem.map((r) => ` ${JSON.stringify(r)}`).join(',\n');

const sql = `-- NÓIZ — as redes da turma (perfis suspensos)
--
-- ARQUIVO GERADO. Não edite aqui: mexa em src/data/redes.json e rode
-- \`npm run sql\`. O mesmo JSON alimenta o adaptador local, então a lista do
-- navegador e a lista do banco são sempre a mesma lista.
--
-- Um perfil suspenso é um @ com lugar guardado: não é conta e não é perfil.
-- Este cadastro não verifica identidade de ninguém, não importa nada do
-- Instagram e não manda convite. Quem diz que é a pessoa, é a pessoa.
--
-- São ${comOrdem.length} registros — ${semNome} sem nome e ${semUf} sem UF, do jeito que
-- chegaram do grupo. Os handles não foram corrigidos nem completados: quem
-- sabe qual é o @ certo é a dona dele.

create table perfis_suspensos (
  id               uuid primary key default gen_random_uuid(),
  -- A ordem em que a lista chegou. Sem ela o PostgREST devolve o que quiser.
  ordem            int not null,
  -- Null de verdade: algumas entradas só têm o @, e aí o @ vira o rótulo.
  nome             text,
  uf               uf_valida,
  -- Aspas porque \`local\` é palavra da linguagem; a coluna continua \`local\`
  -- pra API e pro cliente.
  "local"          text,
  -- Sem @ e em minúsculas. Duas entradas chegaram sem @ nenhum: por isso a
  -- lista pode ser vazia, e por isso não há \`check\` de tamanho mínimo aqui.
  handles          text[] not null default '{}',
  ocupacao         text,
  linkedin         text,
  -- Handles que a interface mostra como texto, sem virar link.
  nao_linkar       text[] not null default '{}',
  -- Nota de quem montou a lista. Nunca aparece na interface.
  conferir         text,
  -- Uma pessoa segura um @ só, daí o unique. \`on delete set null\` devolve o
  -- registro pra lista quando alguém apaga a conta.
  reivindicado_por uuid unique references participantes (id) on delete set null,
  removido         boolean not null default false,
  criado_em        timestamptz not null default now()
);

create unique index perfis_suspensos_ordem_idx on perfis_suspensos (ordem);
create index perfis_suspensos_handles_idx on perfis_suspensos using gin (handles);

-- --------------------------------------------------------------------- dados

insert into perfis_suspensos
  (ordem, nome, uf, "local", handles, ocupacao, linkedin, nao_linkar, conferir)
select r.ordem, r.nome, r.uf, r."local", coalesce(r.handles, '{}'),
       r.ocupacao, r.linkedin, coalesce(r.nao_linkar, '{}'), r.conferir
from jsonb_to_recordset($redes$[
${json}
]$redes$::jsonb) as r(
  ordem int, nome text, uf text, "local" text, handles text[],
  ocupacao text, linkedin text, nao_linkar text[], conferir text
);

-- ----------------------------------------------------------------------- RLS

alter table perfis_suspensos enable row level security;

-- O \`revoke\` não é decoração: o Supabase já concede tudo em toda tabela nova
-- de \`public\` para \`anon\` e \`authenticated\`. Sem tirar primeiro, a permissão
-- por coluna abaixo não restringiria coisa nenhuma.
revoke all on perfis_suspensos from anon, authenticated;
grant select on perfis_suspensos to anon, authenticated;
grant update (reivindicado_por) on perfis_suspensos to authenticated;

-- Quem pediu pra sair some daqui pra frente, pra todo mundo, sem exceção.
create policy suspensos_leitura on perfis_suspensos
  for select to anon, authenticated using (removido = false);

-- Logado mexe em registro sem dono ou no próprio: reivindica ("sou eu") ou
-- devolve ("não era eu"). O \`using\` é o que impede tomar o @ de outra pessoa,
-- e a permissão por coluna impede reescrever nome e handle.
create policy suspensos_reivindicacao on perfis_suspensos
  for update to authenticated
  using (removido = false
         and (reivindicado_por is null or reivindicado_por = auth.uid()))
  with check (reivindicado_por is null or reivindicado_por = auth.uid());

-- ------------------------------------------------------- sair da lista
--
-- Quem está na lista, por definição, ainda não tem conta aqui: exigir login
-- pra sair seria exigir entrar pra poder sair. Mas marcar \`removido\` por
-- UPDATE direto não funciona, e não é detalhe de gosto: o Postgres exige que a
-- linha DEPOIS do update continue visível pela política de SELECT, e a política
-- acima esconde justamente o que foi removido. Ou a lista some de verdade, ou o
-- update passa — não os dois.
--
-- Daí esta função. Ela roda com os poderes de quem a criou (\`security
-- definer\`), então não esbarra na própria política, e é a ÚNICA porta que
-- escreve \`removido\`: \`anon\` não tem permissão de update em coluna nenhuma.
-- Uma porta só, de uma folha só — marca a saída e não faz mais nada.

create function sair_da_lista(p_handle text) returns boolean
  language plpgsql security definer set search_path = public as $fn$
declare
  alvo text := regexp_replace(lower(btrim(p_handle)), '^@+', '');
  achou int;
begin
  if alvo = '' then return false; end if;
  update perfis_suspensos
     set removido = true
   where removido = false and alvo = any (handles);
  get diagnostics achou = row_count;
  return achou > 0;
end;
$fn$;

-- Sem o revoke, toda função nasce executável por qualquer um.
revoke all on function sair_da_lista(text) from public;
grant execute on function sair_da_lista(text) to anon, authenticated;
`;

writeFileSync(SAIDA, sql);
console.log(
  `0005_perfis_suspensos.sql: ${comOrdem.length} registros ` +
  `(${semNome} sem nome, ${semUf} sem UF)`,
);
