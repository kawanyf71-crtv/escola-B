import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Cartaz, Erro, VazioDeFiltro } from '../components/Estados';
import { CardProjeto } from '../components/Cards';
import {
  AREAS, ESTAGIOS, HABILIDADES, TEMAS,
  type Area, type Habilidade, type Tema,
} from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

export function Projetos() {
  const [area, setArea] = useState<Area | ''>('');
  const [estagio, setEstagio] = useState<string>('');
  const [tema, setTema] = useState<Tema | ''>('');
  const [cidade, setCidade] = useState('');
  const [conhecimento, setConhecimento] = useState<Habilidade | ''>('');

  const filtrando = Boolean(area || estagio || tema || cidade || conhecimento);

  const projetos = useConsulta(
    () => repo.listarProjetos({ area, estagio, tema, cidade, conhecimento }),
    [area, estagio, tema, cidade, conhecimento],
  );
  const cidades = useConsulta(() => repo.cidadesConhecidas(), []);

  function limpar() {
    setArea(''); setEstagio(''); setTema(''); setCidade(''); setConhecimento('');
  }

  const total = projetos.dados?.length ?? 0;

  return (
    <>
      <section className="faixa faixa--preto faixa--fina">
        <div className="faixa__interno">
          <h1>Projetos</h1>
          <p className="miudo">O que a turma tá tocando — e quem cada projeto procura.</p>
          <div className="acoes">
            <Link className="botao botao--amarelo" to="/projetos/novo">
              <span className="seta" aria-hidden="true" />Publicar meu projeto
            </Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--claro faixa--fina">
        <div className="faixa__interno">
          <h2 className="visualmente-oculto">Filtros</h2>
          <div className="filtros">
            <div>
              <label className="rotulo" htmlFor="p-conhecimento">Procura quem sabe</label>
              <select id="p-conhecimento" value={conhecimento}
                      onChange={(e) => setConhecimento(e.target.value as Habilidade | '')}>
                <option value="">Tanto faz</option>
                {HABILIDADES.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="p-area">Área</label>
              <select id="p-area" value={area}
                      onChange={(e) => setArea(e.target.value as Area | '')}>
                <option value="">Todas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="p-estagio">Em que pé está</label>
              <select id="p-estagio" value={estagio}
                      onChange={(e) => setEstagio(e.target.value)}>
                <option value="">Todos</option>
                {ESTAGIOS.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="p-tema">Tema</label>
              <select id="p-tema" value={tema}
                      onChange={(e) => setTema(e.target.value as Tema | '')}>
                <option value="">Todos</option>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="p-cidade">Cidade</label>
              <select id="p-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)}>
                <option value="">Todas</option>
                {(cidades.dados ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="filtros__rodape">
            <p className="contagem" aria-live="polite">
              {projetos.carregando
                ? 'Buscando os projetos…'
                : total === 1 ? '1 projeto no mural' : `${total} projetos no mural`}
            </p>
            {filtrando && (
              <button type="button" className="botao botao--preto botao--pequeno" onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          {projetos.carregando && <Carregando rotulo="Buscando os projetos" />}

          {!projetos.carregando && projetos.erro && (
            <Erro mensagem={projetos.erro} aoTentarDeNovo={projetos.recarregar} />
          )}

          {!projetos.carregando && !projetos.erro && total === 0 && filtrando && (
            <VazioDeFiltro aoLimpar={limpar} />
          )}

          {!projetos.carregando && !projetos.erro && total === 0 && !filtrando && (
            <Cartaz
              titulo="Nenhum projeto ainda. Toda cena começa assim."
              cor="vermelho"
              acao={{ texto: 'Publicar o primeiro projeto', para: '/projetos/novo' }}
            >
              <p>
                Alguém tem que ser o primeiro. Pode ser uma ideia que ainda mora só
                na sua cabeça — é publicando que ela encontra gente.
              </p>
            </Cartaz>
          )}

          {!projetos.carregando && !projetos.erro && total > 0 && (
            <div className="grade">
              {projetos.dados!.map((p) => <CardProjeto key={p.id} projeto={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
