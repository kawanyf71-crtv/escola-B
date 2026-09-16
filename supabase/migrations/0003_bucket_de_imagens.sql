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
