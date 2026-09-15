import { Link, useParams } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { CardDiscussao, CardPessoa, CardProjeto } from '../components/Cards';
import { temaPorSlug } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

export function Tema() {
  const { slug = '' } = useParams();
  const tema = temaPorSlug(slug);

  // Os três blocos carregam em paralelo e cada um trata o próprio vazio:
  // um bloco sem nada não esvazia a página inteira (spec seção 9).
  const discussoes = useConsulta(
    () => (tema ? repo.listarDiscussoes(tema) : Promise.resolve([])),
    [tema],
  );
  const projetos = useConsulta(
    () => (tema ? repo.projetosPorTema(tema) : Promise.resolve([])),
    [tema],
  );
  const pessoas = useConsulta(
    () => (tema ? repo.participantesPorTema(tema) : Promise.resolve([])),
    [tema],
  );

  if (!tema) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <div className="cartaz cartaz--vermelho">
            <h2>Tema não existe</h2>
            <p>A lista de temas é fixa. Dá uma olhada nos que existem.</p>
            <div className="acoes">
              <Link className="botao botao--preto" to="/temas">
                <span className="seta" aria-hidden="true" />Ver os temas
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <Link className="migalha" to="/temas">
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            Temas
          </Link>
          <h1>{tema}</h1>
          <p className="miudo">Tudo que existe na rede em torno deste assunto.</p>
        </div>
      </section>

      <section className="faixa faixa--amarelo">
        <div className="faixa__interno">
          <h2>Assuntos<br />abertos</h2>
          {discussoes.carregando && <Carregando quantidade={2} rotulo="Buscando os assuntos" />}
          {discussoes.erro && (
            <Erro mensagem={discussoes.erro} aoTentarDeNovo={discussoes.recarregar} />
          )}
          {!discussoes.carregando && !discussoes.erro && (discussoes.dados ?? []).length === 0 && (
            <div className="card card--escuro">
              <h3 className="card__titulo">
                <span className="seta seta--amarela" aria-hidden="true" />Ninguém puxou isso ainda
              </h3>
              <p className="miudo">
                Abre uma conversa e chama quem pensa nisso. Toda conversa aqui nasce
                de um projeto — publica o seu e puxa a primeira.
              </p>
              <div className="acoes">
                <Link className="botao botao--amarelo botao--pequeno" to="/projetos/novo">
                  <span className="seta" aria-hidden="true" />Publicar meu projeto
                </Link>
              </div>
            </div>
          )}
          {(discussoes.dados ?? []).length > 0 && (
            <div className="grade">
              {discussoes.dados!.map((d) => <CardDiscussao key={d.id} discussao={d} />)}
            </div>
          )}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Projetos<br />neste tema</h2>
          {projetos.carregando && <Carregando quantidade={2} rotulo="Buscando os projetos" />}
          {projetos.erro && <Erro mensagem={projetos.erro} aoTentarDeNovo={projetos.recarregar} />}
          {!projetos.carregando && !projetos.erro && (projetos.dados ?? []).length === 0 && (
            <div className="cartaz">
              <h3>Nenhum projeto<br />marcou este tema</h3>
              <p className="miudo">
                Se o seu tem a ver com isso, marca o tema ao publicar — é assim que
                ele aparece aqui.
              </p>
            </div>
          )}
          {(projetos.dados ?? []).length > 0 && (
            <div className="grade">
              {projetos.dados!.map((p) => <CardProjeto key={p.id} projeto={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="faixa faixa--vermelho">
        <div className="faixa__interno">
          <h2>Quem se<br />interessa</h2>
          {pessoas.carregando && <Carregando quantidade={2} rotulo="Buscando a turma" />}
          {pessoas.erro && <Erro mensagem={pessoas.erro} aoTentarDeNovo={pessoas.recarregar} />}
          {!pessoas.carregando && !pessoas.erro && (pessoas.dados ?? []).length === 0 && (
            <div className="card">
              <h3 className="card__titulo">
                <span className="seta" aria-hidden="true" />Ninguém marcou este tema ainda
              </h3>
              <p className="miudo">
                Marca ele no seu perfil e deixa a porta aberta: quem vier depois vai
                te achar por aqui.
              </p>
              <div className="acoes">
                <Link className="botao botao--vermelho botao--pequeno" to="/meu-perfil">
                  <span className="seta" aria-hidden="true" />Editar meu perfil
                </Link>
              </div>
            </div>
          )}
          {(pessoas.dados ?? []).length > 0 && (
            <div className="grade">
              {pessoas.dados!.map((p) => <CardPessoa key={p.id} pessoa={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
