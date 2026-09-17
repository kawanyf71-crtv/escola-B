import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Cartaz, Erro, VazioDeFiltro } from '../components/Estados';
import { CardPessoa } from '../components/Cards';
import { AREAS, HABILIDADES, TEMAS, type Area, type Habilidade, type Tema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

const SEM_FILTRO = { habilidade: '', area: '', tema: '', cidade: '' } as const;

export function Pessoas() {
  const [habilidade, setHabilidade] = useState<Habilidade | ''>(SEM_FILTRO.habilidade);
  const [area, setArea] = useState<Area | ''>(SEM_FILTRO.area);
  const [tema, setTema] = useState<Tema | ''>(SEM_FILTRO.tema);
  const [cidade, setCidade] = useState<string>(SEM_FILTRO.cidade);

  const filtrando = Boolean(habilidade || area || tema || cidade);

  const pessoas = useConsulta(
    () => repo.listarParticipantes({ habilidade, area, tema, cidade }),
    [habilidade, area, tema, cidade],
  );
  const cidades = useConsulta(() => repo.cidadesConhecidas(), []);

  function limpar() {
    setHabilidade(''); setArea(''); setTema(''); setCidade('');
  }

  const total = pessoas.dados?.length ?? 0;
  const listaCidades = useMemo(() => cidades.dados ?? [], [cidades.dados]);

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h1>Gente</h1>
          <p className="miudo">
            Quem tá no curso, o que cada uma faz e o que sabe fazer.
          </p>
          <div className="acoes">
            <Link className="botao botao--neutro" to="/gente/redes">
              <span className="seta" aria-hidden="true" />
              Confira as redes da turma aqui
            </Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h2 className="visualmente-oculto">Filtros</h2>
          <div className="filtros">
            <div>
              <label className="rotulo" htmlFor="f-habilidade">Sabe fazer</label>
              <select id="f-habilidade" value={habilidade}
                      onChange={(e) => setHabilidade(e.target.value as Habilidade | '')}>
                <option value="">Todas</option>
                {HABILIDADES.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="f-area">Área</label>
              <select id="f-area" value={area}
                      onChange={(e) => setArea(e.target.value as Area | '')}>
                <option value="">Todas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="f-tema">O que move</label>
              <select id="f-tema" value={tema}
                      onChange={(e) => setTema(e.target.value as Tema | '')}>
                <option value="">Todos</option>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="rotulo" htmlFor="f-cidade">Cidade</label>
              <select id="f-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)}>
                <option value="">Todas</option>
                {listaCidades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="filtros__rodape">
            <p className="contagem" aria-live="polite">
              {pessoas.carregando
                ? 'Buscando a turma…'
                : total === 1 ? '1 pessoa na roda' : `${total} pessoas na roda`}
            </p>
            {filtrando && (
              <button type="button" className="botao botao--preto botao--pequeno" onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          {pessoas.carregando && <Carregando rotulo="Buscando a turma" />}

          {!pessoas.carregando && pessoas.erro && (
            <Erro mensagem={pessoas.erro} aoTentarDeNovo={pessoas.recarregar} />
          )}

          {!pessoas.carregando && !pessoas.erro && total === 0 && filtrando && (
            <VazioDeFiltro aoLimpar={limpar} />
          )}

          {!pessoas.carregando && !pessoas.erro && total === 0 && !filtrando && (
            <Cartaz
              titulo="A gente começa agora"
              acao={{ texto: 'Publicar meu projeto', para: '/projetos/novo' }}
            >
              <p>
                Você é das primeiras a chegar. Publica o seu e chama a turma no
                grupo — essa rede só existe se a gente construir.
              </p>
            </Cartaz>
          )}

          {!pessoas.carregando && !pessoas.erro && total > 0 && (
            <div className="grade">
              {pessoas.dados!.map((p) => <CardPessoa key={p.id} pessoa={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
