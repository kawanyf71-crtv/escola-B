import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Estado vazio em linguagem de cartaz (spec secao 9): cor chapada no bloco
 * inteiro, tipografia grande empilhada, seta apontando para a acao. Nunca
 * uma tela em branco — todo vazio diz o que fazer em seguida.
 */
export function Cartaz({
  titulo, children, acao, cor = 'amarelo',
}: {
  titulo: string;
  children?: ReactNode;
  acao?: { texto: string; para: string } | null;
  cor?: 'amarelo' | 'vermelho' | 'preto';
}) {
  const classe = cor === 'amarelo' ? 'cartaz' : `cartaz cartaz--${cor}`;
  return (
    <div className={classe}>
      <h2>{titulo}</h2>
      {children}
      {acao && (
        <div className="acoes">
          <Link className="botao botao--preto" to={acao.para}>
            <span className="seta" aria-hidden="true" />
            {acao.texto}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Vazio causado por filtro: sugere afrouxar, nunca some com a pagina (H2). */
export function VazioDeFiltro({ aoLimpar }: { aoLimpar: () => void }) {
  return (
    <div className="cartaz cartaz--vermelho">
      <h3>Ninguém com essa combinação</h3>
      <p>Os filtros estão apertados demais. Tire um deles e olhe de novo.</p>
      <div className="acoes">
        <button type="button" className="botao botao--preto" onClick={aoLimpar}>
          <span className="seta" aria-hidden="true" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

export function Carregando({ quantidade = 3, rotulo = 'Carregando' }: {
  quantidade?: number;
  rotulo?: string;
}) {
  return (
    <div className="grade" aria-busy="true" aria-live="polite">
      <span className="visualmente-oculto">{rotulo}…</span>
      {Array.from({ length: quantidade }, (_, i) => (
        <div className="esqueleto" key={i} aria-hidden="true">
          <div className="esqueleto__barra esqueleto__barra--titulo" />
          <div className="esqueleto__barra" />
          <div className="esqueleto__barra esqueleto__barra--curta" />
        </div>
      ))}
    </div>
  );
}

export function Erro({ mensagem, aoTentarDeNovo }: {
  mensagem: string;
  aoTentarDeNovo?: () => void;
}) {
  return (
    <div className="cartaz cartaz--vermelho" role="alert">
      <h3>Não deu certo</h3>
      <p>{mensagem}</p>
      {aoTentarDeNovo && (
        <div className="acoes">
          <button type="button" className="botao botao--preto" onClick={aoTentarDeNovo}>
            <span className="seta" aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
