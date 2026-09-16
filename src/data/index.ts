import { RepositorioLocal } from './local';
import { RepositorioSupabase, criarClienteSupabase } from './supabase';
import type { Repositorio } from './tipos';

/**
 * Escolha do adaptador. Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * preenchidos, o site fala com o Supabase de verdade; sem eles, cai no
 * adaptador local (dados no navegador de quem abre) e continua funcionando
 * inteiro. As telas nao sabem qual dos dois esta ativo.
 *
 * ANON_KEY guarda a chave PUBLISHABLE do Supabase. O nome da variavel ficou do
 * tempo em que o Supabase chamava essa chave de `anon`; renomear quebraria o
 * .env de quem ja configurou, e o valor e o mesmo. A outra chave do painel, a
 * Secret, nunca entra aqui: ela ignora a RLS.
 */
function escolher(): Repositorio {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (url && chave) return new RepositorioSupabase(criarClienteSupabase(url, chave));
  return new RepositorioLocal();
}

export const repo: Repositorio = escolher();

/**
 * Qual adaptador subiu e um recado tecnico quando for o local. Vai para o
 * console de proposito: e informacao para quem esta construindo o site, nao
 * para quem participa do curso — a interface nao fala de Supabase.
 */
if (repo.nome === 'local') {
  console.info(
    '[NÓIZ] Rodando com o adaptador local: os dados ficam no navegador ' +
    'de quem abre e ninguém vê a rede de mais ninguém. Preencha VITE_SUPABASE_URL ' +
    'e VITE_SUPABASE_ANON_KEY para a turma inteira compartilhar a mesma rede.',
  );
}
