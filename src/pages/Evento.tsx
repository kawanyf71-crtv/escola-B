import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { chipDeEntrada } from '../components/Cards';
import { slugTema } from '../lib/dominio';
import { porExtenso, horaPorExtenso } from '../lib/datas';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

export function Evento() {
  const { id = '' } = useParams();
  const { perfil } = useSessao();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  const consulta = useConsulta(() => repo.obterEvento(id), [id]);

  if (consulta.carregando) {
    return (
      <section className="faixa">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Buscando o evento" /></div>
      </section>
    );
  }

  if (consulta.erro) {
    return (
      <section className="faixa">
        <div className="faixa__interno">
          <Erro mensagem={consulta.erro} aoTentarDeNovo={consulta.recarregar} />
        </div>
      </section>
    );
  }

  const e = consulta.dados;
  if (!e) {
    return (
      <section className="faixa">
        <div className="faixa__interno">
          <div className="cartaz cartaz--vermelho">
            <span className="seta seta--cartaz" aria-hidden="true" />
            <h2>Esse evento<br />não existe mais</h2>
            <div className="acoes">
              <Link className="botao botao--preto" to="/eventos">
                <span className="seta" aria-hidden="true" />Voltar pro mural
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const souAutora = perfil?.id === e.autor_id;
  const entrada = chipDeEntrada(e.entrada);
  const onde = e.formato === 'Online' ? 'Online' : `${e.cidade}, ${e.estado}`;

  async function apagar() {
    setApagando(true);
    setFalha(null);
    try {
      await repo.excluirEvento(id);
      navegar('/eventos');
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não deu pra apagar.');
      setApagando(false);
    }
  }

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <Link className="migalha" to="/eventos">
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            Voltar pro mural
          </Link>
          <h1>{e.titulo}</h1>
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <img className="card__capa card__capa--grande" src={e.banner}
               alt={`Cartaz de ${e.titulo}`} />
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          <h2>Quando e onde</h2>
          <dl className="ficha">
            <div>
              <dt className="rotulo">Data</dt>
              <dd>
                {porExtenso(e.data_inicio)}
                {e.data_fim && <> <br />até {porExtenso(e.data_fim)}</>}
              </dd>
            </div>
            {e.horario && (
              <div>
                <dt className="rotulo">Horário</dt>
                <dd>{horaPorExtenso(e.horario)}</dd>
              </div>
            )}
            <div>
              <dt className="rotulo">Formato</dt>
              <dd>{e.formato}</dd>
            </div>
            <div>
              <dt className="rotulo">Onde</dt>
              <dd>{onde}</dd>
            </div>
            <div>
              <dt className="rotulo">Entrada</dt>
              <dd>{entrada ?? e.entrada}</dd>
            </div>
          </dl>

          <span className="rotulo" style={{ marginTop: '1.5rem' }}>Áreas</span>
          <ul className="chips" aria-label="Áreas do evento">
            {e.areas.map((a) => <li key={a}><span className="chip">{a}</span></li>)}
          </ul>

          {e.temas.length > 0 && (
            <>
              <span className="rotulo" style={{ marginTop: '1rem' }}>Temas</span>
              <ul className="chips" aria-label="Temas do evento">
                {e.temas.map((t) => (
                  <li key={t}>
                    <Link className="chip chip--inverso" to={`/temas/${slugTema(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          <div className="acoes">
            <a className="botao botao--amarelo botao--bloco-no-celular"
               href={e.link} target="_blank" rel="noopener noreferrer">
              <span className="seta" aria-hidden="true" />Ir para o evento
            </a>
          </div>
          {/* O mural não vende nem organiza: manda pra fora e diz de quem é a
              responsabilidade do outro lado. */}
          <p className="miudo" style={{ marginTop: '0.75rem', color: 'var(--tinta-fraca)' }}>
            Este link leva para fora daqui. Quem publicou é quem responde pelo evento.
          </p>
          <p className="card__meta" style={{ marginTop: '1rem' }}>
            {e.autor
              ? <>Publicado por <Link to={`/pessoas/${e.autor.id}`}>{e.autor.nome}</Link></>
              : 'Publicado na rede'}
          </p>
        </div>
      </section>

      {souAutora && (
        <section className="faixa faixa--fina">
          <div className="faixa__interno">
            <h2>Este evento é seu</h2>
            {falha && <p className="aviso" role="alert">{falha}</p>}
            {!confirmando ? (
              <div className="acoes">
                <Link className="botao botao--preto botao--pequeno" to={`/eventos/${e.id}/editar`}>
                  Editar
                </Link>
                <button type="button" className="botao botao--vermelho botao--pequeno"
                        onClick={() => setConfirmando(true)}>
                  Apagar
                </button>
              </div>
            ) : (
              <div className="cartaz cartaz--vermelho">
                <h3>Apagar este evento?</h3>
                <p>Ele sai do mural na hora. Não dá pra desfazer.</p>
                <div className="acoes">
                  <button type="button" className="botao botao--vermelho" onClick={apagar}
                          disabled={apagando}>
                    {apagando ? 'Apagando…' : 'Apagar mesmo'}
                  </button>
                  <button type="button" className="botao botao--contorno"
                          onClick={() => setConfirmando(false)} disabled={apagando}>
                    Deixa pra lá
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
