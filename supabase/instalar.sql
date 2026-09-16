-- NÓIZ — instalação do banco, tudo num arquivo só
--
-- ARQUIVO GERADO. Não edite aqui: mexa nas migrações em supabase/migrations/ e
-- rode `npm run sql`. As migrações são a fonte; este é o atalho pra quem está
-- no SQL Editor do Supabase e quer colar uma coisa só.
--
-- Como usar: copie ESTE arquivo inteiro, cole no SQL Editor e aperte Run.
-- Roda uma vez, num banco novo. As 4 migrações, nesta ordem:
--   0001_esquema_inicial.sql
--   0002_assunto_sem_projeto.sql
--   0003_bucket_de_imagens.sql
--   0004_mural_de_eventos.sql


-- --------------------------------------------------------------------------
-- 0001_esquema_inicial.sql
-- --------------------------------------------------------------------------

-- NÓIZ — esquema inicial (MVP)
-- Regras da spec aplicadas como constraint sempre que o banco consegue
-- garanti-las, para que nao dependam so do formulario.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- listas fixas
-- RN-002 e RN-003: as listas vivem em UM lugar. O front le as mesmas
-- constantes em src/lib/dominio.ts; aqui elas viram dominio de verdade.

create domain area_valida as text check (value in (
  'Música','Audiovisual','Teatro','Dança','Literatura','Artes Visuais',
  'Cultura Popular','Educação','Pesquisa','Eventos','Comunicação','Outro'
));

create domain tema_valido as text check (value in (
  'Cultura negra','Cultura afro-brasileira','LGBTQIA+','Juventude','Periferias',
  'Ancestralidade','Memória','Identidade','Educação','Direitos humanos','Outro'
));

-- RN-002: a MESMA lista serve habilidade oferecida e conhecimento procurado.
create domain habilidade_valida as text check (value in (
  'Produção','Comunicação','Design','Audiovisual','Fotografia','Música',
  'Curadoria','Pesquisa','Gestão','Captação de recursos','Outro'
));

create domain estagio_valido as text check (value in (
  'Ideia','Em desenvolvimento','Em produção','Em execução','Já aconteceu'
));

create domain tipo_participacao_valido as text check (value in (
  'Trabalho remunerado','Trabalho voluntário','Colaboração','Colaboração intelectual'
));

create domain disponibilidade_valida as text check (value in (
  'Remunerado','Voluntário','Colaboração','Colaboração intelectual'
));

create domain modalidade_valida as text check (value in (
  'Presencial','Online','Híbrido','Não definido'
));

-- ---------------------------------------------------------------- participantes

create table participantes (
  id                     uuid primary key references auth.users (id) on delete cascade,
  nome                   text not null check (length(btrim(nome)) > 0),
  email                  text not null,
  foto                   text,
  cidade                 text not null check (length(btrim(cidade)) > 0),
  ocupacao               text not null check (length(btrim(ocupacao)) > 0),
  mini_bio               text not null check (length(btrim(mini_bio)) > 0),
  areas                  area_valida[] not null default '{}',
  habilidades_oferecidas habilidade_valida[] not null default '{}',
  temas_interesse        tema_valido[] not null default '{}',
  disponibilidade        disponibilidade_valida[] not null default '{}',
  instagram              text,
  linkedin               text,
  site                   text,
  criado_em              timestamptz not null default now(),
  -- RF-003: perfil so existe com ao menos uma area e uma habilidade oferecida.
  constraint perfil_tem_area       check (coalesce(array_length(areas, 1), 0) >= 1),
  constraint perfil_tem_habilidade check (coalesce(array_length(habilidades_oferecidas, 1), 0) >= 1)
);

create index participantes_habilidades_idx on participantes using gin (habilidades_oferecidas);
create index participantes_areas_idx       on participantes using gin (areas);
create index participantes_temas_idx       on participantes using gin (temas_interesse);
create index participantes_cidade_idx      on participantes (cidade);

-- ---------------------------------------------------------------- projetos

create table projetos (
  id                       uuid primary key default gen_random_uuid(),
  autor_id                 uuid not null references participantes (id) on delete cascade,
  nome                     text not null check (length(btrim(nome)) > 0),
  o_que_e                  text not null check (length(btrim(o_que_e)) > 0),
  areas                    area_valida[] not null default '{}',
  sobre                    text not null check (length(btrim(sobre)) > 0),
  estagio                  estagio_valido not null,
  temas                    tema_valido[] not null default '{}',
  quando                   text,
  onde_cidade              text,
  onde_modalidade          modalidade_valida,
  ja_existiu               boolean not null default false,
  ja_existiu_links         text,
  imagem                   text,
  busca_pessoas            boolean not null,
  tipo_participacao        tipo_participacao_valido[] not null default '{}',
  conhecimentos_procurados habilidade_valida[] not null default '{}',
  o_que_precisa            text,
  estado                   text not null default 'publicado'
                             check (estado in ('rascunho','publicado','despublicado')),
  criado_em                timestamptz not null default now(),
  constraint projeto_tem_area check (coalesce(array_length(areas, 1), 0) >= 1),
  -- RF-006 / RN-007: busca_pessoas = sim exige tipo e conhecimentos.
  constraint busca_pessoas_completo check (
    not busca_pessoas
    or (coalesce(array_length(tipo_participacao, 1), 0) >= 1
        and coalesce(array_length(conhecimentos_procurados, 1), 0) >= 1)
  )
);

create index projetos_autor_idx         on projetos (autor_id);
create index projetos_estado_idx        on projetos (estado, criado_em desc);
create index projetos_areas_idx         on projetos using gin (areas);
create index projetos_temas_idx         on projetos using gin (temas);
create index projetos_conhecimentos_idx on projetos using gin (conhecimentos_procurados);

-- ---------------------------------------------------------------- discussoes

create table discussoes (
  -- RN-005: `tema` e coluna unica, nao array. Um tema por discussao.
  -- projeto_origem_id nasceu NOT NULL; a migracao 0002 tornou o vinculo
  -- opcional. Um banco novo aplica as duas em ordem e chega no mesmo lugar.
  id                uuid primary key default gen_random_uuid(),
  titulo            text not null check (length(btrim(titulo)) > 0),
  tema              tema_valido not null,
  descricao         text not null check (length(btrim(descricao)) > 0),
  projeto_origem_id uuid not null references projetos (id) on delete cascade,
  autor_id          uuid not null references participantes (id) on delete cascade,
  criado_em         timestamptz not null default now()
);

create index discussoes_tema_idx    on discussoes (tema, criado_em desc);
create index discussoes_projeto_idx on discussoes (projeto_origem_id);

create table participacoes_discussao (
  discussao_id    uuid not null references discussoes (id) on delete cascade,
  participante_id uuid not null references participantes (id) on delete cascade,
  criado_em       timestamptz not null default now(),
  primary key (discussao_id, participante_id)
);

create table comentarios (
  id           uuid primary key default gen_random_uuid(),
  discussao_id uuid not null references discussoes (id) on delete cascade,
  autor_id     uuid not null references participantes (id) on delete cascade,
  texto        text not null check (length(btrim(texto)) > 0),
  criado_em    timestamptz not null default now()
);

create index comentarios_discussao_idx on comentarios (discussao_id, criado_em);

-- ---------------------------------------------------------------- interesses

create table interesses (
  id                uuid primary key default gen_random_uuid(),
  projeto_id        uuid not null references projetos (id) on delete cascade,
  participante_id   uuid not null references participantes (id) on delete cascade,
  tipo_participacao tipo_participacao_valido not null,
  mensagem          text not null check (length(btrim(mensagem)) > 0),
  estado            text not null default 'enviado' check (estado in ('enviado','visto')),
  criado_em         timestamptz not null default now(),
  -- RN-008: um interesse por par pessoa/projeto. Cancelar apaga a linha,
  -- entao manifestar de novo volta a ser possivel.
  constraint interesse_unico unique (projeto_id, participante_id)
);

create index interesses_projeto_idx      on interesses (projeto_id, criado_em desc);
create index interesses_participante_idx on interesses (participante_id, criado_em desc);

-- ---------------------------------------------------------------- RLS
-- RN-009: todo participante logado ve tudo. Cada um escreve so o que e seu.
-- "Logado" aqui significa ter perfil publicado — quem criou conta e ainda nao
-- preencheu o perfil nao le o diretorio (RF-002 leva essa pessoa ao formulario).

alter table participantes           enable row level security;
alter table projetos                enable row level security;
alter table discussoes              enable row level security;
alter table participacoes_discussao enable row level security;
alter table comentarios             enable row level security;
alter table interesses              enable row level security;

create function tem_perfil() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from participantes where id = auth.uid());
$$;

-- participantes
create policy participantes_leitura on participantes
  for select to authenticated using (id = auth.uid() or tem_perfil());
create policy participantes_insercao on participantes
  for insert to authenticated with check (id = auth.uid());
create policy participantes_atualizacao on participantes
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy participantes_remocao on participantes
  for delete to authenticated using (id = auth.uid());

-- projetos: rascunho e despublicado so aparecem para a autora.
create policy projetos_leitura on projetos
  for select to authenticated
  using (autor_id = auth.uid() or (estado = 'publicado' and tem_perfil()));
create policy projetos_insercao on projetos
  for insert to authenticated with check (autor_id = auth.uid());
create policy projetos_atualizacao on projetos
  for update to authenticated using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy projetos_remocao on projetos
  for delete to authenticated using (autor_id = auth.uid());

-- discussoes: so a autora do projeto abre discussao nele (RF-011).
create policy discussoes_leitura on discussoes
  for select to authenticated using (tem_perfil());
create policy discussoes_insercao on discussoes
  for insert to authenticated with check (
    autor_id = auth.uid()
    and exists (select 1 from projetos p where p.id = projeto_origem_id and p.autor_id = auth.uid())
  );
create policy discussoes_atualizacao on discussoes
  for update to authenticated using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy discussoes_remocao on discussoes
  for delete to authenticated using (autor_id = auth.uid());

-- RN-006: qualquer participante logado entra em qualquer discussao.
create policy participacoes_leitura on participacoes_discussao
  for select to authenticated using (tem_perfil());
create policy participacoes_insercao on participacoes_discussao
  for insert to authenticated with check (participante_id = auth.uid());
create policy participacoes_remocao on participacoes_discussao
  for delete to authenticated using (participante_id = auth.uid());

create policy comentarios_leitura on comentarios
  for select to authenticated using (tem_perfil());
create policy comentarios_insercao on comentarios
  for insert to authenticated with check (autor_id = auth.uid());
create policy comentarios_remocao on comentarios
  for delete to authenticated using (autor_id = auth.uid());

-- RF-010: a autora do projeto ve os interessados; cada pessoa ve os seus.
create policy interesses_leitura on interesses
  for select to authenticated using (
    participante_id = auth.uid()
    or exists (select 1 from projetos p where p.id = projeto_id and p.autor_id = auth.uid())
  );
create policy interesses_insercao on interesses
  for insert to authenticated with check (
    participante_id = auth.uid()
    and exists (
      select 1 from projetos p
      where p.id = projeto_id and p.busca_pessoas and p.autor_id <> auth.uid()
    )
  );
create policy interesses_remocao on interesses
  for delete to authenticated using (participante_id = auth.uid());
-- Autora do projeto marca como visto; a candidata nao mexe no proprio estado.
create policy interesses_atualizacao on interesses
  for update to authenticated using (
    exists (select 1 from projetos p where p.id = projeto_id and p.autor_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- 0002_assunto_sem_projeto.sql
-- --------------------------------------------------------------------------

-- NÓIZ — assunto pode nascer solto, sem projeto de origem
--
-- Reverte a regra RN-004 da spec ("toda discussão nasce de um projeto"). O
-- vínculo continua existindo e continua dando contexto; só deixa de ser
-- obrigatório.
--
-- Nada é apagado: as linhas existentes já têm projeto_origem_id preenchido e
-- seguem válidas, porque a coluna apenas deixou de exigir valor.

alter table discussoes alter column projeto_origem_id drop not null;

-- Leitura: um assunto solto é visível para qualquer participante. Um assunto
-- ligado a um projeto só aparece se o projeto também aparecer para quem lê —
-- senão o link levaria a uma página que a pessoa não pode abrir, e o assunto
-- se disfarçaria de solto. A política anterior não checava isso.
drop policy if exists discussoes_leitura on discussoes;
create policy discussoes_leitura on discussoes
  for select to authenticated using (
    tem_perfil()
    and (
      projeto_origem_id is null
      or exists (select 1 from projetos p where p.id = projeto_origem_id)
    )
  );

-- Inserção: ligar a um projeto continua exigindo que o projeto seja de quem
-- está puxando o assunto. Sem projeto, basta ser a autora.
drop policy if exists discussoes_insercao on discussoes;
create policy discussoes_insercao on discussoes
  for insert to authenticated with check (
    autor_id = auth.uid()
    and (
      projeto_origem_id is null
      or exists (
        select 1 from projetos p
        where p.id = projeto_origem_id and p.autor_id = auth.uid()
      )
    )
  );

create index if not exists discussoes_soltas_idx
  on discussoes (criado_em desc) where projeto_origem_id is null;

-- --------------------------------------------------------------------------
-- 0003_bucket_de_imagens.sql
-- --------------------------------------------------------------------------

-- NÓIZ — bucket das imagens de perfil e de capa
--
-- O registro nunca guarda os bytes da imagem: guarda só a URL pública. Os
-- arquivos vivem aqui. A compressão continua acontecendo no navegador antes do
-- envio (src/lib/imagem.ts) — o bucket não é desculpa pra subir foto de 5 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens', 'imagens', true,
  1048576,                                        -- 1 MB, folgado pros 400 KB do front
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura: o bucket é público, então a URL abre sem sessão. É o que permite
-- mostrar a foto de alguém num card sem passar por autenticação a cada imagem.
drop policy if exists imagens_leitura on storage.objects;
create policy imagens_leitura on storage.objects
  for select to public using (bucket_id = 'imagens');

-- Escrita: cada pessoa só mexe na pasta que leva o próprio id. O caminho é
-- `<perfis|projetos>/<uid>/<arquivo>.jpg`, montado em src/data/supabase.ts.
drop policy if exists imagens_envio on storage.objects;
create policy imagens_envio on storage.objects
  for insert to authenticated with check (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] in ('perfis', 'projetos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists imagens_troca on storage.objects;
create policy imagens_troca on storage.objects
  for update to authenticated using (
    bucket_id = 'imagens' and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists imagens_remocao on storage.objects;
create policy imagens_remocao on storage.objects
  for delete to authenticated using (
    bucket_id = 'imagens' and (storage.foldername(name))[2] = auth.uid()::text
  );

-- --------------------------------------------------------------------------
-- 0004_mural_de_eventos.sql
-- --------------------------------------------------------------------------

-- NÓIZ — mural de eventos
--
-- O mural mostra e manda pra fora: nao vende, nao emite ingresso, nao processa
-- pagamento. Por isso nao ha tabela de ingresso, de pedido nem de check-in —
-- o unico caminho pra fora e a coluna `link`.

-- ---------------------------------------------------------------- listas fixas
-- As mesmas de src/lib/dominio.ts. Evento nao tem "Nao definido" de formato:
-- ou e presencial, ou online, ou os dois.

create domain formato_evento_valido as text check (value in (
  'Presencial','Online','Híbrido'
));

create domain entrada_evento_valida as text check (value in (
  'Gratuito','Pago','Não informado'
));

create domain uf_valida as text check (value in (
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
  'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
));

-- ------------------------------------------------------------------- eventos

create table eventos (
  id           uuid primary key default gen_random_uuid(),
  autor_id     uuid not null references participantes (id) on delete cascade,
  -- Obrigatorio, ao contrario da capa de projeto: sem cartaz nao ha mural.
  banner       text not null check (length(btrim(banner)) > 0),
  titulo       text not null check (length(btrim(titulo)) > 0),
  -- `date`, nao `timestamptz`: um evento no dia 28 e dia 28 em qualquer fuso.
  data_inicio  date not null,
  data_fim     date,
  horario      time,
  link         text not null check (link ~* '^https?://'),
  formato      formato_evento_valido not null,
  estado       uf_valida,
  cidade       text,
  entrada      entrada_evento_valida not null,
  areas        area_valida[] not null default '{}',
  temas        tema_valido[] not null default '{}',
  criado_em    timestamptz not null default now(),

  -- O dia em que o evento deixa de estar por vir. Coluna gerada porque
  -- PostgREST nao compara duas colunas entre si: sem ela, "o que ja rolou"
  -- viraria filtro no cliente, e o mural traria o banco inteiro pra decidir.
  ultimo_dia   date generated always as (coalesce(data_fim, data_inicio)) stored,

  constraint evento_tem_area check (coalesce(array_length(areas, 1), 0) >= 1),
  constraint evento_termina_depois_de_comecar
    check (data_fim is null or data_fim >= data_inicio),
  -- Online nao tem lugar; presencial e hibrido tem. A regra fica aqui e nao so
  -- no formulario, senao um evento presencial sem cidade entra pela API.
  constraint evento_lugar_conforme_formato check (
    (formato = 'Online'  and estado is null and cidade is null)
    or
    (formato <> 'Online' and estado is not null
     and cidade is not null and length(btrim(cidade)) > 0)
  )
);

create index eventos_ultimo_dia_idx on eventos (ultimo_dia);
create index eventos_data_inicio_idx on eventos (data_inicio);
create index eventos_estado_idx      on eventos (estado);
create index eventos_areas_idx       on eventos using gin (areas);
create index eventos_temas_idx       on eventos using gin (temas);

-- ----------------------------------------------------------------------- RLS

alter table eventos enable row level security;

-- Le quem tem perfil publicado; publica, edita e apaga so quem e a autora.
create policy eventos_leitura on eventos
  for select to authenticated using (tem_perfil());
create policy eventos_insercao on eventos
  for insert to authenticated with check (autor_id = auth.uid() and tem_perfil());
create policy eventos_atualizacao on eventos
  for update to authenticated using (autor_id = auth.uid()) with check (autor_id = auth.uid());
create policy eventos_remocao on eventos
  for delete to authenticated using (autor_id = auth.uid());

-- -------------------------------------------------- banner no bucket de imagens
-- O banner do evento vai pra mesma pasta de imagens, sob `eventos/<uid>/`. A
-- politica de envio lista as pastas permitidas uma a uma, entao precisa ganhar
-- a nova — sem isto o upload do banner e recusado pelo Storage.

drop policy if exists imagens_envio on storage.objects;
create policy imagens_envio on storage.objects
  for insert to authenticated with check (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] in ('perfis', 'projetos', 'eventos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );
