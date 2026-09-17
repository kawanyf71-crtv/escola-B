import type { PerfilSuspenso } from './dominio';
import { comArroba, ondeFica } from './redes';

/**
 * O começo adiantado: o que a lista da turma já sabe sobre alguém, escrito no
 * rascunho do formulário de perfil antes de a pessoa chegar nele.
 *
 * Vai pelo rascunho e não pelo estado da rota de propósito. O rascunho já
 * existe, já sobrevive a fechar o navegador e já é descartado quando o perfil é
 * publicado — enquanto estado de rota some num F5, que é justamente quando
 * alguém repensa o que escreveu. Um caminho a menos pra manter.
 */

/** A mesma chave que o formulário de perfil usa. Um lugar só. */
export function chaveDoRascunhoDePerfil(usuario: string): string {
  return `perfil/${usuario}`;
}

/** O que o adiantamento escreve. Tudo editável depois, nada obrigatório. */
export interface Adiantado {
  nome: string;
  cidade: string;
  ocupacao: string;
  instagram: string;
  /** O registro que a pessoa disse ser dela; vira reivindicação ao publicar. */
  suspenso_id: string;
}

function ler(usuario: string): Record<string, unknown> {
  try {
    const bruto = localStorage.getItem(`rascunho/${chaveDoRascunhoDePerfil(usuario)}`);
    return bruto ? (JSON.parse(bruto) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

/**
 * Preenche o rascunho sem passar por cima do que a pessoa já tinha escrito: o
 * que ela digitou vale mais do que o que a lista supõe.
 *
 * O LinkedIn do registro fica de fora de propósito. A lista guarda um apelido
 * (`ofe-martins`), não um endereço, e montar um link a partir dele seria um
 * palpite — o mesmo palpite que já custou caro no `fauxtino.com.br`.
 */
export function guardarAdiantado(usuario: string, perfil: PerfilSuspenso): void {
  const atual = ler(usuario);
  const novo = {
    ...atual,
    nome: texto(atual.nome) || perfil.nome || '',
    cidade: texto(atual.cidade) || ondeFica(perfil),
    ocupacao: texto(atual.ocupacao) || perfil.ocupacao || '',
    instagram: texto(atual.instagram)
      || (perfil.handles[0] ? comArroba(perfil.handles[0]) : ''),
    suspenso_id: perfil.id,
  };
  try {
    localStorage.setItem(
      `rascunho/${chaveDoRascunhoDePerfil(usuario)}`, JSON.stringify(novo),
    );
  } catch {
    // Armazenamento bloqueado: o formulário abre em branco, que é o pior caso
    // aceitável — a pessoa digita, como digitaria sem a lista.
  }
}
