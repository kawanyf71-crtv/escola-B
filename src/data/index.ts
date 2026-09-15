import { RepositorioLocal } from './local';
import { RepositorioSupabase, criarClienteSupabase } from './supabase';
import type { Repositorio } from './tipos';

/**
 * Escolha do adaptador. Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * preenchidos, o site fala com o Supabase de verdade; sem eles, cai no
 * adaptador local (dados no navegador de quem abre) e continua funcionando
 * inteiro. As telas nao sabem qual dos dois esta ativo.
 */
function escolher(): Repositorio {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (url && chave) return new RepositorioSupabase(criarClienteSupabase(url, chave));
  return new RepositorioLocal();
}

export const repo: Repositorio = escolher();
export const modoLocal = repo.nome === 'local';
