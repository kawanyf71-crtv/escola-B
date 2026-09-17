import type { PerfilSuspenso, Uf } from '../lib/dominio';
import bruto from './redes.json';

/**
 * A lista de @ que a turma foi deixando no grupo, do jeito que ela chegou.
 *
 * Os dados moram em `redes.json` e não aqui: é o mesmo arquivo que
 * `scripts/gerar-redes-sql.mjs` lê pra escrever a migração 0005, então a lista
 * do navegador e a lista do banco não têm como divergir. Mexeu no JSON, rode
 * `npm run sql`.
 *
 * Os handles são os que ela mandou, sem correção: um @ escrito errado aqui é
 * um @ escrito errado no grupo, e quem sabe qual é o certo é a dona dele. Os
 * casos em dúvida viajam no campo `conferir`, que nunca aparece na tela.
 */
export type RedeDaTurma = Omit<PerfilSuspenso, 'id' | 'reivindicado_por' | 'removido'>;

interface Registro {
  nome: string | null;
  uf: string | null;
  local?: string;
  handles: string[];
  ocupacao?: string;
  linkedin?: string;
  nao_linkar?: string[];
  conferir?: string;
}

export const REDES_DA_TURMA: RedeDaTurma[] = (bruto as Registro[]).map((r) => ({
  nome: r.nome,
  uf: (r.uf as Uf | null) ?? null,
  local: r.local ?? null,
  handles: r.handles,
  ocupacao: r.ocupacao ?? null,
  linkedin: r.linkedin ?? null,
  nao_linkar: r.nao_linkar ?? [],
  conferir: r.conferir ?? null,
}));

/**
 * Chave estável de um registro, usada só pelo adaptador local pra saber o que
 * já semeou. É o primeiro handle; os dois registros que chegaram sem @ nenhum
 * caem no nome.
 */
export function chaveDaRede(r: RedeDaTurma): string {
  return r.handles[0] ?? `nome:${(r.nome ?? '').toLowerCase()}`;
}
