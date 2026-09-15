import type { ReactNode } from 'react';

export interface PropsCampo {
  id: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  obrigatorio?: boolean;
  children: ReactNode;
}

export function Campo({ id, rotulo, dica, erro, obrigatorio, children }: PropsCampo) {
  return (
    <div className={erro ? 'campo campo--erro' : 'campo'}>
      <label className="rotulo" htmlFor={id}>
        {rotulo}
        {obrigatorio && <span aria-hidden="true"> *</span>}
        {obrigatorio && <span className="visualmente-oculto"> (obrigatório)</span>}
      </label>
      {dica && <p className="campo__dica" id={`${id}-dica`}>{dica}</p>}
      {children}
      {erro && <strong className="erro-campo" id={`${id}-erro`}>{erro}</strong>}
    </div>
  );
}

/** Conjunto de escolhas multiplas renderizado como chips clicaveis. */
export function GrupoOpcoes<T extends string>({
  legenda, dica, opcoes, valor, aoMudar, erro, obrigatorio, nome,
}: {
  legenda: string;
  dica?: string;
  opcoes: readonly T[];
  valor: T[];
  aoMudar: (novo: T[]) => void;
  erro?: string;
  obrigatorio?: boolean;
  nome: string;
}) {
  function alternar(opcao: T) {
    aoMudar(valor.includes(opcao) ? valor.filter((v) => v !== opcao) : [...valor, opcao]);
  }
  return (
    <div className={erro ? 'campo campo--erro' : 'campo'}>
      <fieldset className="opcoes" style={{ display: 'block' }}>
        <legend className="rotulo">
          {legenda}
          {obrigatorio && <span aria-hidden="true"> *</span>}
          {obrigatorio && <span className="visualmente-oculto"> (obrigatório)</span>}
        </legend>
        {dica && <p className="campo__dica">{dica}</p>}
        <div className="opcoes">
          {opcoes.map((opcao) => (
            <label className="opcao" key={opcao}>
              <input
                type="checkbox"
                name={nome}
                value={opcao}
                checked={valor.includes(opcao)}
                onChange={() => alternar(opcao)}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {erro && <strong className="erro-campo">{erro}</strong>}
    </div>
  );
}

export function EscolhaUnica<T extends string>({
  legenda, opcoes, valor, aoMudar, erro, obrigatorio, nome, dica,
}: {
  legenda: string;
  opcoes: readonly T[];
  valor: T | '';
  aoMudar: (novo: T) => void;
  erro?: string;
  obrigatorio?: boolean;
  nome: string;
  dica?: string;
}) {
  return (
    <div className={erro ? 'campo campo--erro' : 'campo'}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="rotulo">
          {legenda}
          {obrigatorio && <span aria-hidden="true"> *</span>}
        </legend>
        {dica && <p className="campo__dica">{dica}</p>}
        <div className="opcoes">
          {opcoes.map((opcao) => (
            <label className="opcao" key={opcao}>
              <input
                type="radio"
                name={nome}
                value={opcao}
                checked={valor === opcao}
                onChange={() => aoMudar(opcao)}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {erro && <strong className="erro-campo">{erro}</strong>}
    </div>
  );
}

export function SeletorSimNao({
  legenda, dica, valor, aoMudar, nome, textoSim = 'Sim', textoNao = 'Não',
}: {
  legenda: string;
  dica?: string;
  valor: boolean;
  aoMudar: (novo: boolean) => void;
  nome: string;
  textoSim?: string;
  textoNao?: string;
}) {
  return (
    <div className="campo">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="rotulo">{legenda}</legend>
        {dica && <p className="campo__dica">{dica}</p>}
        <div className="interruptor">
          {[
            { texto: textoSim, v: true },
            { texto: textoNao, v: false },
          ].map(({ texto, v }) => (
            <label className="opcao" key={texto}>
              <input
                type="radio"
                name={nome}
                checked={valor === v}
                onChange={() => aoMudar(v)}
              />
              <span>{texto}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
