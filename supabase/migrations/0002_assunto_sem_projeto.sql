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
