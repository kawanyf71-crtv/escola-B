import { Link, useParams } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { CardDiscussao, CardProjeto, Foto } from '../components/Cards';
import { slugTema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

function linkInstagram(valor: string): string {
  if (/^https?:\/\//i.test(valor)) return valor;
  return `https://instagram.com/${valor.replace(/^@/, '')}`;
}

export function Perfil() {
  const { id = '' } = useParams();
  const { perfil: meu } = useSessao();

  const pessoa = useConsulta(() => repo.obterParticipante(id), [id]);
  const projetos = useConsulta(() => repo.projetosDoParticipante(id), [id]);
  const discussoes = useConsulta(() => repo.discussoesDoParticipante(id), [id]);

  const souEu = meu?.id === id;

  if (pessoa.carregando) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Buscando o perfil" /></div>
      </section>
    );
  }

  if (pessoa.erro) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <Erro mensagem={pessoa.erro} aoTentarDeNovo={pessoa.recarregar} />
        </div>
      </section>
    );
  }

  const p = pessoa.dados;
  if (!p) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <div className="cartaz cartaz--vermelho">
            <h2>Esse perfil<br />não existe mais</h2>
            <div className="acoes">
              <Link className="botao botao--preto" to="/pessoas">
                <span className="seta" aria-hidden="true" />Voltar pra turma
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Só o que está publicado aparece para quem não é a dona do perfil.
  const projetosVisiveis = (projetos.dados ?? []).filter(
    (proj) => souEu || proj.estado === 'publicado',
  );

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <Link className="migalha" to="/pessoas">
            <span className="seta" aria-hidden="true"
                  style={{ transform: 'scaleX(-1)' }} />
            Voltar pra turma
          </Link>
          <div className="pessoa-linha" style={{ marginTop: '0.5rem' }}>
            <Foto pessoa={p} grande />
            <div style={{ minWidth: 0 }}>
              <h1>{p.nome}</h1>
              <p className="rotulo" style={{ color: 'var(--amarelo)' }}>
                {p.ocupacao} · {p.cidade}
              </p>
            </div>
          </div>
          <p style={{ marginTop: '1.25rem', maxWidth: '36rem' }}>{p.mini_bio}</p>
          {souEu && (
            <div className="acoes">
              <Link className="botao botao--amarelo" to="/meu-perfil">
                <span className="seta" aria-hidden="true" />Editar meu perfil
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno empilhado">
          <div>
            <h2>Sabe fazer</h2>
            <ul className="chips">
              {p.habilidades_oferecidas.map((h) => (
                <li key={h}><span className="chip chip--inverso">{h}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <span className="rotulo">Áreas</span>
            <ul className="chips">
              {p.areas.map((a) => <li key={a}><span className="chip chip--inverso">{a}</span></li>)}
            </ul>
          </div>
          {p.temas_interesse.length > 0 && (
            <div>
              <span className="rotulo">O que te move</span>
              <ul className="chips">
                {p.temas_interesse.map((t) => (
                  <li key={t}>
                    <Link className="chip chip--inverso" to={`/temas/${slugTema(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p.disponibilidade.length > 0 && (
            <div>
              <span className="rotulo">Topa participar como</span>
              <ul className="chips">
                {p.disponibilidade.map((d) => (
                  <li key={d}><span className="chip chip--inverso">{d}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {(p.instagram || p.linkedin || p.site) && (
        <section className="faixa faixa--vermelho faixa--fina">
          <div className="faixa__interno">
            <h2>Chamar</h2>
            <p className="miudo">
              A conversa acontece fora daqui. Estes são os canais que ficaram abertos.
            </p>
            <div className="acoes">
              {p.instagram && (
                <a className="botao botao--preto" href={linkInstagram(p.instagram)}
                   target="_blank" rel="noreferrer noopener">
                  <span className="seta" aria-hidden="true" />Instagram
                </a>
              )}
              {p.linkedin && (
                <a className="botao botao--preto" href={p.linkedin}
                   target="_blank" rel="noreferrer noopener">
                  <span className="seta" aria-hidden="true" />LinkedIn
                </a>
              )}
              {p.site && (
                <a className="botao botao--preto" href={p.site}
                   target="_blank" rel="noreferrer noopener">
                  <span className="seta" aria-hidden="true" />Site
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <h2>Projetos</h2>
          {projetos.carregando && <Carregando quantidade={2} rotulo="Buscando os projetos" />}
          {projetos.erro && <Erro mensagem={projetos.erro} aoTentarDeNovo={projetos.recarregar} />}
          {!projetos.carregando && !projetos.erro && projetosVisiveis.length === 0 && (
            <div className="cartaz">
              <h3>Nenhum projeto publicado ainda</h3>
              <p>
                {souEu
                  ? 'Publica o seu — nem que seja uma ideia. É o projeto que diz o que falta.'
                  : 'Ainda não publicou nenhum projeto.'}
              </p>
              {souEu && (
                <div className="acoes">
                  <Link className="botao botao--preto" to="/projetos/novo">
                    <span className="seta" aria-hidden="true" />Publicar meu projeto
                  </Link>
                </div>
              )}
            </div>
          )}
          {projetosVisiveis.length > 0 && (
            <div className="grade">
              {projetosVisiveis.map((proj) => <CardProjeto key={proj.id} projeto={proj} />)}
            </div>
          )}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Assuntos</h2>
          {discussoes.carregando && <Carregando quantidade={2} rotulo="Buscando os assuntos" />}
          {discussoes.erro && (
            <Erro mensagem={discussoes.erro} aoTentarDeNovo={discussoes.recarregar} />
          )}
          {!discussoes.carregando && !discussoes.erro && (discussoes.dados ?? []).length === 0 && (
            <p>Ainda não entrou em nenhuma conversa por aqui.</p>
          )}
          {(discussoes.dados ?? []).length > 0 && (
            <div className="grade">
              {discussoes.dados!.map((d) => <CardDiscussao key={d.id} discussao={d} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
