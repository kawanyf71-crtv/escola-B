import { Link } from 'react-router-dom';

const CAMINHOS = [
  {
    titulo: 'Pessoas',
    texto: 'Cada participante declara o que faz e quais habilidades oferece. ' +
      'Você descobre quem faz o que falta no seu projeto.',
  },
  {
    titulo: 'Projetos',
    texto: 'Cada projeto diz em que estágio está e que conhecimentos procura — ' +
      'na mesma lista das habilidades do perfil. Dá para saber na hora se você serve.',
  },
  {
    titulo: 'Temas',
    texto: 'Discussões abertas a partir dos projetos, agrupadas por assunto. ' +
      'Dá para chegar a uma pessoa pelo interesse, não só pela vaga.',
  },
];

export function Entrada() {
  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <p className="rotulo" style={{ color: 'var(--amarelo)' }}>
            Curso de produção cultural negra · Escola B
          </p>
          <h1>
            Você já<br />se viu.<br />
            <span style={{ color: 'var(--amarelo)' }}>Agora se<br />encontre.</span>
          </h1>
          <p style={{ maxWidth: '34rem', marginTop: '1.25rem' }}>
            Um lugar onde a turma declara o que oferece, publica o que está tocando
            e diz o que está procurando. A conversa continua no WhatsApp — aqui
            você descobre o pretexto para começá-la.
          </p>
          <div className="acoes">
            <Link className="botao botao--amarelo" to="/criar-conta">
              <span className="seta" aria-hidden="true" />
              Criar meu perfil
            </Link>
            <Link className="botao botao--contorno" to="/entrar">Já tenho conta</Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--amarelo">
        <div className="faixa__interno">
          <h2>Três caminhos<br />até uma pessoa</h2>
          <div className="divisor" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <span className="seta" key={i} />)}
          </div>
          <div className="grade grade--3">
            {CAMINHOS.map((c) => (
              <article className="card" key={c.titulo}>
                <h3 className="card__titulo">
                  <span className="seta" aria-hidden="true" />
                  {c.titulo}
                </h3>
                <p className="miudo">{c.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faixa faixa--vermelho">
        <div className="faixa__interno">
          <h2>O que isto não é</h2>
          <p style={{ maxWidth: '38rem' }}>
            Não é rede social: não tem feed, curtida nem seguidor. Não é mensageiro:
            a conversa migra para o WhatsApp ou o Instagram. Não é algoritmo de match —
            o sistema torna a necessidade visível, quem decide é você.
          </p>
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Comece pelo<br />seu perfil</h2>
          <p style={{ maxWidth: '34rem' }}>
            Leva menos de quatro minutos no celular. Nome, o que você faz, sua cidade,
            duas ou três frases sobre você e as habilidades que você oferece.
          </p>
          <div className="acoes">
            <Link className="botao botao--vermelho" to="/criar-conta">
              <span className="seta" aria-hidden="true" />
              Criar meu perfil
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
