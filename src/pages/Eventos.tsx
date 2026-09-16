import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Cartaz, Erro } from '../components/Estados';
import { CardEvento } from '../components/Cards';
import {
  AREAS, ENTRADAS_EVENTO, TEMAS,
  type Area, type EntradaEvento, type Tema, type Uf,
} from '../lib/dominio';
import { JANELAS, mesDe, type Janela } from '../lib/datas';
import type { EventoComAutor } from '../data/tipos';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

/**
 * Filtro do mural: retângulo de canto reto com seta triangular, no espírito de
 * uma bilheteria mas com a tipografia daqui. Nunca pílula.
 *
 * A borda usa --linha-campo e não --linha porque um select é componente de
 * interface: a WCAG pede 3:1 entre o que o identifica e o fundo, e --linha dá
 * 1,39:1 sobre o preto da página. É a mesma razão que já vale nos campos de
 * formulário, e o verificar:ritmo cobra.
 */
function Filtro<T extends string>({
  id, rotulo, valor, aoMudar, opcoes, vazio,
}: {
  id: string;
  rotulo: string;
  valor: T | '';
  aoMudar: (novo: T | '') => void;
  opcoes: readonly T[];
  vazio: string;
}) {
  return (
    <div className={valor ? 'filtro-mural filtro-mural--ativo' : 'filtro-mural'}>
      <label className="rotulo" htmlFor={id}>{rotulo}</label>
      <div className="filtro-mural__caixa">
        <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value as T | '')}>
          <option value="">{vazio}</option>
          {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="seta seta--baixo" aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * A lista é agrupada por mês, e o cabeçalho de cada grupo é o que dá o ritmo de
 * bilheteria sem precisar trocar o fundo da página.
 */
function PorMes({ eventos, passado }: { eventos: EventoComAutor[]; passado: boolean }) {
  const grupos: { chave: string; rotulo: string; itens: EventoComAutor[] }[] = [];
  for (const e of eventos) {
    const { chave, rotulo } = mesDe(e.data_inicio);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.chave === chave) ultimo.itens.push(e);
    else grupos.push({ chave, rotulo, itens: [e] });
  }
  return (
    <>
      {grupos.map((g) => (
        <section className="mes" key={g.chave}>
          <h3 className="mes__titulo">{g.rotulo}</h3>
          <div className="grade grade--eventos">
            {g.itens.map((e) => <CardEvento key={e.id} evento={e} passado={passado} />)}
          </div>
        </section>
      ))}
    </>
  );
}

export function Eventos() {
  const [estado, setEstado] = useState<Uf | ''>('');
  const [cidade, setCidade] = useState('');
  const [area, setArea] = useState<Area | ''>('');
  const [tema, setTema] = useState<Tema | ''>('');
  const [janela, setJanela] = useState<Janela | ''>('');
  const [entrada, setEntrada] = useState<EntradaEvento | ''>('');
  const [vendoPassados, setVendoPassados] = useState(false);

  const filtrando = Boolean(estado || cidade || area || tema || janela || entrada);

  const eventos = useConsulta(
    () => repo.listarEventos({ estado, cidade, area, tema, janela, entrada }),
    [estado, cidade, area, tema, janela, entrada],
  );
  const locais = useConsulta(() => repo.locaisDeEventos(), []);
  // Só busca o que já rolou quando alguém pede: é o caso raro.
  const passados = useConsulta(
    () => (vendoPassados ? repo.listarEventos({ passados: true }) : Promise.resolve([])),
    [vendoPassados],
  );

  const ufs = (locais.dados ?? []).map((l) => l.estado);
  // A cidade é populada conforme o estado escolhido; sem estado, todas as que
  // existem, pra que o filtro de cidade não fique inútil antes de escolher UF.
  const cidades = estado
    ? (locais.dados ?? []).find((l) => l.estado === estado)?.cidades ?? []
    : [...new Set((locais.dados ?? []).flatMap((l) => l.cidades))]
      .sort((a, z) => a.localeCompare(z, 'pt-BR'));

  function limpar() {
    setEstado(''); setCidade(''); setArea(''); setTema(''); setJanela(''); setEntrada('');
  }

  function trocarEstado(novo: Uf | '') {
    setEstado(novo);
    setCidade('');  // A cidade escolhida quase nunca existe no novo estado.
  }

  const total = eventos.dados?.length ?? 0;

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h1>Mural de eventos</h1>
          <p className="miudo">
            O que tá rolando nas cidades da turma. Publica o seu, vai no dos outros.
          </p>
          <div className="acoes">
            <Link className="botao botao--amarelo" to="/eventos/novo">
              <span className="seta" aria-hidden="true" />Publicar um evento
            </Link>
          </div>
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h2 className="visualmente-oculto">Filtros</h2>
          <div className="filtros-mural">
            <Filtro id="ev-estado" rotulo="Estado" valor={estado} aoMudar={trocarEstado}
                    opcoes={ufs} vazio="Todos" />
            <Filtro id="ev-cidade" rotulo="Cidade" valor={cidade} aoMudar={setCidade}
                    opcoes={cidades} vazio="Todas" />
            <Filtro id="ev-area" rotulo="Área" valor={area} aoMudar={setArea}
                    opcoes={AREAS} vazio="Todas" />
            <Filtro id="ev-tema" rotulo="Tema" valor={tema} aoMudar={setTema}
                    opcoes={TEMAS} vazio="Todos" />
            <Filtro id="ev-quando" rotulo="Quando" valor={janela} aoMudar={setJanela}
                    opcoes={JANELAS} vazio="Tudo" />
            <Filtro id="ev-entrada" rotulo="Entrada" valor={entrada} aoMudar={setEntrada}
                    opcoes={ENTRADAS_EVENTO} vazio="Tudo" />
          </div>
          <div className="filtros__rodape">
            <p className="contagem contagem--amarela" aria-live="polite">
              {eventos.carregando
                ? 'Buscando os eventos…'
                : total === 1 ? '1 evento chegando' : `${total} eventos chegando`}
            </p>
            {filtrando && (
              <button type="button" className="botao botao--preto botao--pequeno"
                      onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          {eventos.carregando && <Carregando rotulo="Buscando os eventos" />}

          {!eventos.carregando && eventos.erro && (
            <Erro mensagem={eventos.erro} aoTentarDeNovo={eventos.recarregar} />
          )}

          {!eventos.carregando && !eventos.erro && total === 0 && filtrando && (
            <div className="cartaz cartaz--vermelho">
              <span className="seta seta--cartaz" aria-hidden="true" />
              <h3>Não tem nada<br />assim por aqui</h3>
              <p>Tira um filtro e tenta de novo.</p>
              <div className="acoes">
                <button type="button" className="botao botao--preto" onClick={limpar}>
                  <span className="seta" aria-hidden="true" />
                  Limpar filtros
                </button>
              </div>
            </div>
          )}

          {!eventos.carregando && !eventos.erro && total === 0 && !filtrando && (
            <Cartaz
              titulo="Ainda não tem nada no mural"
              cor="vermelho"
              acao={{ texto: 'Publicar o primeiro', para: '/eventos/novo' }}
            >
              <p>
                Publica o primeiro. Pode ser o lançamento de alguém, uma roda, uma
                oficina, um show na sua cidade — não precisa ser seu.
              </p>
            </Cartaz>
          )}

          {!eventos.carregando && !eventos.erro && total > 0 && (
            <PorMes eventos={eventos.dados!} passado={false} />
          )}
        </div>
      </section>

      {/* Evento vencido no topo mata um mural em três semanas. O que já rolou
          sai da listagem e fica atrás de um link, em ordem decrescente. */}
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <button
            type="button"
            className="botao botao--contorno botao--pequeno"
            aria-expanded={vendoPassados}
            aria-controls="ja-rolou"
            onClick={() => setVendoPassados((v) => !v)}
          >
            {vendoPassados ? 'Esconder o que já rolou' : 'Ver o que já rolou'}
          </button>

          <div id="ja-rolou" hidden={!vendoPassados} style={{ marginTop: '1.5rem' }}>
            {passados.carregando && <Carregando rotulo="Buscando o que já rolou" />}
            {!passados.carregando && (passados.dados ?? []).length === 0 && (
              <p className="miudo">Nada aqui ainda — nenhum evento do mural já passou.</p>
            )}
            {!passados.carregando && (passados.dados ?? []).length > 0 && (
              <PorMes eventos={passados.dados!} passado />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
