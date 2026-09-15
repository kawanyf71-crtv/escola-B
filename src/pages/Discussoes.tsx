import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Cartaz, Erro, VazioDeFiltro } from '../components/Estados';
import { CardDiscussao } from '../components/Cards';
import { TEMAS, type Tema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

export function Discussoes() {
  const [tema, setTema] = useState<Tema | ''>('');
  const discussoes = useConsulta(() => repo.listarDiscussoes(tema), [tema]);
  const total = discussoes.dados?.length ?? 0;

  return (
    <>
      <section className="faixa faixa--preto faixa--fina">
        <div className="faixa__interno">
          <h1>Assuntos</h1>
          <p className="miudo" style={{ maxWidth: '34rem' }}>
            O que a gente pensa junto rende mais. Toda conversa aqui fica aberta pra
            qualquer pessoa da turma entrar.
          </p>
          <div className="acoes">
            <Link className="botao botao--amarelo" to="/assuntos/novo">
              <span className="seta" aria-hidden="true" />Puxar um assunto
            </Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--claro faixa--fina">
        <div className="faixa__interno">
          <div className="filtros" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <label className="rotulo" htmlFor="d-tema">Tema</label>
              <select id="d-tema" value={tema}
                      onChange={(e) => setTema(e.target.value as Tema | '')}>
                <option value="">Todos os temas</option>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="filtros__rodape">
            <p className="contagem" aria-live="polite">
              {discussoes.carregando
                ? 'Buscando os assuntos…'
                : total === 1 ? '1 assunto aberto' : `${total} assuntos abertos`}
            </p>
            {tema && (
              <button type="button" className="botao botao--preto botao--pequeno"
                      onClick={() => setTema('')}>
                Ver todos os temas
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          {discussoes.carregando && <Carregando rotulo="Buscando os assuntos" />}
          {!discussoes.carregando && discussoes.erro && (
            <Erro mensagem={discussoes.erro} aoTentarDeNovo={discussoes.recarregar} />
          )}

          {!discussoes.carregando && !discussoes.erro && total === 0 && tema && (
            <VazioDeFiltro aoLimpar={() => setTema('')} />
          )}

          {!discussoes.carregando && !discussoes.erro && total === 0 && !tema && (
            <Cartaz
              titulo="Ainda ninguém puxou conversa"
              acao={{ texto: 'Puxar um assunto', para: '/assuntos/novo' }}
            >
              <p>
                Puxa o primeiro assunto. Tem gente aqui pensando nisso e ainda não
                sabe que você existe.
              </p>
              <p className="miudo">
                Dá pra <Link to="/temas">olhar os temas</Link> antes de decidir.
              </p>
            </Cartaz>
          )}

          {total > 0 && (
            <div className="grade">
              {discussoes.dados!.map((d) => <CardDiscussao key={d.id} discussao={d} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
