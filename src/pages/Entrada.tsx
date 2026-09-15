import { Link } from 'react-router-dom';
import { FileiraDeSetas, Globo } from '../components/Grafismo';

const BLOCOS = [
  {
    titulo: 'Gente',
    texto: 'Cada uma de nós chega com uma história e um ofício. Aqui você conta o seu ' +
      '— e acha quem tem o que falta no que você tá construindo.',
  },
  {
    titulo: 'Projetos',
    texto: 'Ninguém faz sozinho. Cada projeto diz em que pé está e quem precisa chegar ' +
      'junto. Dá pra ler e saber na hora se é com você.',
  },
  {
    titulo: 'Assuntos',
    texto: 'O que a gente pensa junto rende mais do que o que a gente pensa sozinho. ' +
      'Qualquer pessoa puxa um assunto, e a conversa fica aberta pra quem quiser entrar.',
  },
];

export function Entrada() {
  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          {/* A Escola B aparece descrevendo QUEM está aqui — a turma do curso —,
              nunca como dona da plataforma. Quem a fez é uma aluna, e isso está
              dito no rodapé. */}
          <p className="rotulo" style={{ color: 'var(--amarelo)' }}>
            Turma do curso de produção cultural negra da Escola B
          </p>
          <h1>
            A gente se vê<br />toda terça.<br />
            <span style={{ color: 'var(--amarelo)' }}>Mas ainda não<br />se encontrou.</span>
          </h1>
          <p style={{ maxWidth: '34rem', marginTop: '1.25rem' }}>
            Somos mais de 800 pessoas fazendo cultura em cantos diferentes do Brasil,
            e cada uma carrega um pedaço do que falta pra outra.
          </p>
          <p style={{ maxWidth: '34rem' }}>
            Este lugar existe pra uma coisa só: transformar quem assiste junto em
            quem faz junto.
          </p>
          <div className="acoes">
            <Link className="botao botao--amarelo" to="/criar-conta">
              <span className="seta" aria-hidden="true" />
              Começar pelo meu perfil
            </Link>
            <Link className="botao botao--contorno" to="/entrar">Já tenho conta</Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Três caminhos<br />até uma pessoa</h2>
          <FileiraDeSetas />
          <div className="grade grade--3">
            {BLOCOS.map((b) => (
              <article className="card" key={b.titulo}>
                <h3 className="card__titulo">
                  <span className="seta" aria-hidden="true" />
                  {b.titulo}
                </h3>
                <p className="miudo">{b.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faixa faixa--vermelho">
        <div className="faixa__interno">
          {/* Sem fotografia, a faixa seria só placa de cor: o globo em traço
              grosso é o elemento da marca que dá textura no lugar da imagem. */}
          <Globo className="grafismo-solto" />
          <h2>
            Uma pessoa sozinha<br />tira um projeto<br />do papel.
          </h2>
          <p style={{ maxWidth: '36rem' }}>
            Oitocentas mudam o que entra em cartaz, o que ganha edital, o que vira
            referência.
          </p>
          <div className="acoes">
            <Link className="botao botao--preto" to="/criar-conta">
              <span className="seta" aria-hidden="true" />
              Começar pelo meu perfil
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
