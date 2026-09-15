import { Link, useParams } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { Foto } from '../components/Cards';
import { correspondencia, slugTema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

export function Interessados() {
  const { id = '' } = useParams();
  const projeto = useConsulta(() => repo.obterProjeto(id), [id]);
  const lista = useConsulta(() => repo.interessadosNoProjeto(id), [id]);

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <Link className="migalha" to={`/projetos/${id}`}>
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            {projeto.dados?.nome ?? 'Projeto'}
          </Link>
          <h1>Essa gente quer<br />construir<br />com você</h1>
          <p className="miudo">
            O perfil e a mensagem de cada pessoa que chegou junto. Daqui você chama
            no WhatsApp ou no Instagram.
          </p>
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          {lista.carregando && <Carregando quantidade={2} rotulo="Buscando quem chegou junto" />}
          {lista.erro && <Erro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />}

          {!lista.carregando && !lista.erro && (lista.dados ?? []).length === 0 && (
            <div className="cartaz">
              <h2>Ninguém<br />chegou ainda</h2>
              <p>
                Vale conferir se o "quem você procura" tá bem escolhido — é por ele
                que alguém descobre que é com você.
              </p>
              <div className="acoes">
                <Link className="botao botao--preto" to={`/projetos/${id}/editar`}>
                  <span className="seta" aria-hidden="true" />Rever quem o projeto procura
                </Link>
              </div>
            </div>
          )}

          <div className="empilhado">
            {(lista.dados ?? []).map((item) => {
              const pessoa = item.participante;
              const encaixe = correspondencia(
                pessoa?.habilidades_oferecidas,
                projeto.dados?.conhecimentos_procurados,
              );
              return (
                <article className="card" key={item.id}>
                  <div className="pessoa-linha">
                    {pessoa && <Foto pessoa={pessoa} />}
                    <div style={{ minWidth: 0 }}>
                      <h2 className="card__titulo">
                        <span className="seta" aria-hidden="true" />
                        {pessoa
                          ? <Link to={`/pessoas/${pessoa.id}`}>{pessoa.nome}</Link>
                          : 'Participante'}
                      </h2>
                      {pessoa && (
                        <p className="card__meta">{pessoa.ocupacao} · {pessoa.cidade}</p>
                      )}
                      <p style={{ margin: 0 }}>
                        <span className="chip chip--inverso">{item.tipo_participacao}</span>
                      </p>
                    </div>
                  </div>

                  <p style={{ marginTop: '1rem' }}>{item.mensagem}</p>

                  {pessoa && (
                    <>
                      {encaixe.length > 0 && (
                        <div className="correspondencia" style={{ marginTop: '1rem' }}>
                          <span className="rotulo">Bate com quem você procura</span>
                          <ul className="chips">
                            {encaixe.map((h) => (
                              <li key={h}><span className="chip chip--inverso">{h}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p style={{ marginTop: '1rem' }}>{pessoa.mini_bio}</p>

                      <span className="rotulo" style={{ marginTop: '0.75rem' }}>Sabe fazer</span>
                      <ul className="chips">
                        {pessoa.habilidades_oferecidas.map((h) => (
                          <li key={h}><span className="chip">{h}</span></li>
                        ))}
                      </ul>

                      {pessoa.temas_interesse.length > 0 && (
                        <>
                          <span className="rotulo" style={{ marginTop: '0.75rem' }}>O que move</span>
                          <ul className="chips">
                            {pessoa.temas_interesse.map((t) => (
                              <li key={t}>
                                <Link className="chip" to={`/temas/${slugTema(t)}`}>{t}</Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {pessoa.disponibilidade.length > 0 && (
                        <>
                          <span className="rotulo" style={{ marginTop: '0.75rem' }}>
                            Topa participar como
                          </span>
                          <ul className="chips">
                            {pessoa.disponibilidade.map((d) => (
                              <li key={d}><span className="chip">{d}</span></li>
                            ))}
                          </ul>
                        </>
                      )}

                      <div className="acoes">
                        <Link className="botao botao--vermelho botao--pequeno"
                              to={`/pessoas/${pessoa.id}`}>
                          <span className="seta" aria-hidden="true" />Ver perfil e contatos
                        </Link>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
