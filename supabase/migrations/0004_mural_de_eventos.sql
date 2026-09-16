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
