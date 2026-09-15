import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { CardProjeto } from '../components/Cards';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

export function MeuEspaco() {
  const { perfil, excluirConta } = useSessao();
  const navegar = useNavigate();
  const meuId = perfil?.id ?? '';

  const projetos = useConsulta(
    () => (meuId ? repo.projetosDoParticipante(meuId) : Promise.resolve([])),
    [meuId],
  );
  const interesses = useConsulta(() => repo.meusInteresses(), []);

  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function apagar() {
    setExcluindo(true);
    try {
      await excluirConta();
      navegar('/');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <section className="faixa faixa--preto faixa--fina">
        <div className="faixa__interno">
          <h1>Meu<br />espaço</h1>
          <p className="miudo">Seus projetos, quem chegou junto e onde você chegou junto.</p>
          <div className="acoes">
            <Link className="botao botao--preto" to="/meu-perfil">
              <span className="seta" aria-hidden="true" />Editar meu perfil
            </Link>
            {perfil && (
              <Link className="botao botao--contorno" to={`/pessoas/${perfil.id}`}>
                Ver como a turma me vê
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="faixa faixa--vermelho">
        <div className="faixa__interno">
          <h2>Meus projetos</h2>
          {projetos.carregando && <Carregando quantidade={2} rotulo="Buscando os seus projetos" />}
          {projetos.erro && <Erro mensagem={projetos.erro} aoTentarDeNovo={projetos.recarregar} />}

          {!projetos.carregando && !projetos.erro && (projetos.dados ?? []).length === 0 && (
            <div className="cartaz cartaz--preto">
              <span className="seta seta--cartaz" aria-hidden="true" />
              <h3>Você ainda<br />não publicou nada</h3>
              <p>
                Sem projeto, ninguém sabe o que falta pra você. Começa por uma ideia —
                nem que seja uma linha.
              </p>
              <div className="acoes">
                <Link className="botao botao--preto" to="/projetos/novo">
                  <span className="seta" aria-hidden="true" />Publicar meu projeto
                </Link>
              </div>
            </div>
          )}

          {(projetos.dados ?? []).length > 0 && (
            <>
              <div className="grade">
                {projetos.dados!.map((p) => (
                  <div key={p.id}>
                    <CardProjeto projeto={p} />
                    <div className="acoes" style={{ marginTop: '0.5rem' }}>
                      <Link className="botao botao--preto botao--pequeno"
                            to={`/projetos/${p.id}/editar`}>Editar</Link>
                      {p.busca_pessoas && (
                        <Link className="botao botao--vermelho botao--pequeno"
                              to={`/projetos/${p.id}/quem-chegou-junto`}>Quem chegou junto</Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="acoes">
                <Link className="botao botao--vermelho" to="/projetos/novo">
                  <span className="seta" aria-hidden="true" />Publicar outro projeto
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Onde eu<br />cheguei junto</h2>
          {interesses.carregando && (
            <Carregando quantidade={2} rotulo="Buscando onde você chegou junto" />
          )}
          {interesses.erro && (
            <Erro mensagem={interesses.erro} aoTentarDeNovo={interesses.recarregar} />
          )}

          {!interesses.carregando && !interesses.erro && (interesses.dados ?? []).length === 0 && (
            <p>
              Você ainda não chegou junto em nada.{' '}
              <Link to="/projetos">Dá uma olhada no mural</Link> e filtra por algo que
              você sabe fazer.
            </p>
          )}

          <div className="empilhado">
            {(interesses.dados ?? []).map((i) => (
              <article className="card card--escuro" key={i.id}>
                <h3 className="card__titulo">
                  <span className="seta" aria-hidden="true" />
                  {i.projeto
                    ? <Link to={`/projetos/${i.projeto.id}`}>{i.projeto.nome}</Link>
                    : 'Projeto removido'}
                </h3>
                {i.projeto?.autor && (
                  <p className="card__meta">
                    de <Link to={`/pessoas/${i.projeto.autor.id}`}>{i.projeto.autor.nome}</Link>
                  </p>
                )}
                <p style={{ margin: '0 0 0.75rem' }}>
                  <span className="chip">{i.tipo_participacao}</span>
                </p>
                <p className="miudo">{i.mensagem}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faixa faixa--preto">
        <div className="faixa__interno" style={{ maxWidth: '36rem' }}>
          <h2>Sair da rede</h2>
          <p className="miudo">
            Apagar a conta apaga seu perfil, seus projetos, seus assuntos e os
            lugares onde você chegou junto. Não dá pra desfazer.
          </p>
          {!confirmando ? (
            <div className="acoes">
              <button type="button" className="botao botao--vermelho"
                      onClick={() => setConfirmando(true)}>
                <span className="seta" aria-hidden="true" />
                Apagar minha conta
              </button>
            </div>
          ) : (
            <div className="cartaz cartaz--vermelho">
              <span className="seta seta--cartaz" aria-hidden="true" />
              <h3>Tem certeza?</h3>
              <p>Tudo que você publicou some junto.</p>
              <div className="acoes">
                <button type="button" className="botao botao--preto"
                        onClick={apagar} disabled={excluindo}>
                  {excluindo ? 'Apagando…' : 'Sim, apaga tudo'}
                </button>
                <button type="button" className="botao botao--claro"
                        onClick={() => setConfirmando(false)} disabled={excluindo}>
                  Não, voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
