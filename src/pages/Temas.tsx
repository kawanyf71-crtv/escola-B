import { Link } from 'react-router-dom';
import { TEMAS, slugTema } from '../lib/dominio';

export function Temas() {
  return (
    <>
      <section className="faixa faixa--preto faixa--fina">
        <div className="faixa__interno">
          <h1>Temas</h1>
          <p className="miudo" style={{ maxWidth: '34rem' }}>
            O segundo caminho até as pessoas. Cada tema junta os assuntos abertos,
            os projetos marcados com ele e quem disse que se move por isso.
          </p>
        </div>
      </section>

      <section className="faixa faixa--amarelo">
        <div className="faixa__interno">
          <ul className="lista-limpa grade grade--3">
            {TEMAS.map((t) => (
              <li key={t}>
                <Link className="card card--escuro" to={`/temas/${slugTema(t)}`}>
                  <span className="card__titulo" style={{ marginBottom: 0 }}>
                    <span className="seta seta--amarela" aria-hidden="true" />
                    {t}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
