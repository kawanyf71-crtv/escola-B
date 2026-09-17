import type { PerfilSuspenso } from './dominio';

/**
 * O que a tela precisa saber sobre um @ da lista. Guardado sem arroba e em
 * minúsculas; quem escreve a arroba é a interface, sempre.
 */

export function comArroba(handle: string): string {
  return `@${handle}`;
}

/** O @ como a pessoa digitou: com arroba, com link colado, com espaço, em caixa alta. */
export function limparHandle(digitado: string): string {
  return digitado
    .trim().toLowerCase()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^@+/, '')
    .replace(/\/+$/, '');
}

export function linkDoInstagram(handle: string): string {
  return `https://instagram.com/${handle}`;
}

/**
 * Nem todo handle vira link: `fauxtino.com.br` parece endereço de site e não
 * usuário do Instagram, e mandar alguém pra um link errado é pior do que não
 * mandar. O registro diz quais ficam como texto — não há adivinhação por
 * formato, senão `aya.morart` e `gia.quirino`, que são @ legítimos, cairiam
 * na mesma regra.
 */
export function viraLink(perfil: PerfilSuspenso, handle: string): boolean {
  return !perfil.nao_linkar.includes(handle);
}

/** Sem nome, o @ principal é o rótulo. Sem os dois, sobra o traço. */
export function rotuloDaRede(perfil: PerfilSuspenso): string {
  if (perfil.nome?.trim()) return perfil.nome;
  return perfil.handles[0] ? comArroba(perfil.handles[0]) : '—';
}

/** "Belo Horizonte, MG", "Recôncavo, BA", "SP" ou nada. */
export function ondeFica(perfil: PerfilSuspenso): string {
  return [perfil.local, perfil.uf].filter(Boolean).join(', ');
}

function achatar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Busca por nome ou por @, sem acento e sem caixa. Aceita o que a pessoa
 * digitar com arroba na frente, que é como todo mundo escreve.
 */
export function combina(perfil: PerfilSuspenso, termo: string): boolean {
  const alvo = achatar(termo.trim().replace(/^@+/, ''));
  if (!alvo) return true;
  const campos = [perfil.nome ?? '', perfil.ocupacao ?? '', perfil.local ?? '', ...perfil.handles];
  return campos.some((c) => achatar(c).includes(alvo));
}
