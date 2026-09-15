import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Campo, EscolhaUnica } from '../components/Campos';
import { Carregando, Erro } from '../components/Estados';
import { CardDiscussao } from '../components/Cards';
import { TEMAS, correspondencia, slugTema, type Tema, type TipoParticipacao } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

export function Projeto() {
  const { id = '' } = useParams();
  const { perfil } = useSessao();
  const navegar = useNavigate();

  const projeto = useConsulta(() => repo.obterProjeto(id), [id]);
  const discussoes = useConsulta(() => repo.discussoesDoProjeto(id), [id]);
  const meuInteresse = useConsulta(() => repo.meuInteresseNoProjeto(id), [id]);

  const [abrindoDiscussao, setAbrindoDiscussao] = useState(false);

  if (projeto.carregando) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Buscando o projeto" /></div>
      </section>
    );
  }
  if (projeto.erro) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <Erro mensagem={projeto.erro} aoTentarDeNovo={projeto.recarregar} />
        </div>
      </section>
    );
  }

  const p = projeto.dados;
  if (!p) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <div className="cartaz cartaz--vermelho">
            <h2>Esse projeto<br />não existe mais</h2>
            <p>Quem publicou pode ter tirado ele do mural.</p>
            <div className="acoes">
              <Link className="botao botao--preto" to="/projetos">
                <span className="seta" aria-hidden="true" />Voltar ao mural
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const souAutora = perfil?.id === p.autor_id;
  const encaixe = correspondencia(perfil?.habilidades_oferecidas, p.conhecimentos_procurados);
  const mostraCorrespondencia = encaixe.length > 0 && !souAutora;
  // Num projeto do lote a porta fica aberta pra que a tela de quem chegou junto
  // possa ser avaliada — a autora dele é um perfil fictício, sem acesso.
  const podeVerQuemChegou = souAutora || p.demo === true;
  // Sem a faixa amarela no meio, a capa encostaria no "Sobre", que é claro.
  const faixaDaCapa = mostraCorrespondencia ? 'faixa--claro' : 'faixa--vermelho';

  async function alterarEstado(estado: 'publicado' | 'despublicado') {
    await repo.definirEstadoProjeto(id, estado);
    projeto.recarregar();
  }

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <Link className="migalha" to="/projetos">
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            Voltar ao mural
          </Link>
          {p.estado !== 'publicado' && (
            <p style={{ margin: '0.5rem 0' }}>
              <span className="chip chip--alerta">
                {p.estado === 'rascunho' ? 'Rascunho — só você vê' : 'Fora do mural'}
              </span>
            </p>
          )}
          <h1>{p.nome}</h1>
          <p style={{ maxWidth: '36rem', marginTop: '1rem' }}>{p.o_que_e}</p>
          <p className="rotulo" style={{ color: 'var(--amarelo)', marginTop: '1rem' }}>
            {p.estagio}
            {p.onde_cidade ? ` · ${p.onde_cidade}` : ''}
            {p.onde_modalidade ? ` · ${p.onde_modalidade}` : ''}
            {p.quando ? ` · ${p.quando}` : ''}
          </p>
          {p.autor && (
            <p style={{ marginTop: '0.5rem' }}>
              Por <Link to={`/pessoas/${p.autor.id}`}>{p.autor.nome}</Link>, {p.autor.ocupacao}
            </p>
          )}
          {!souAutora && podeVerQuemChegou && p.busca_pessoas && (
            <div className="acoes">
              <Link className="botao botao--contorno" to={`/projetos/${p.id}/quem-chegou-junto`}>
                Ver quem chegou junto
              </Link>
            </div>
          )}

          {souAutora && (
            <div className="acoes">
              <Link className="botao botao--amarelo" to={`/projetos/${p.id}/editar`}>
                <span className="seta" aria-hidden="true" />Editar
              </Link>
              {p.busca_pessoas && (
                <Link className="botao botao--contorno" to={`/projetos/${p.id}/quem-chegou-junto`}>
                  Ver quem chegou junto
                </Link>
              )}
              <button type="button" className="botao botao--contorno"
                      onClick={() => alterarEstado(
                        p.estado === 'publicado' ? 'despublicado' : 'publicado',
                      )}>
                {p.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
              </button>
            </div>
          )}
        </div>
      </section>

      {p.imagem && (
        <section className={`faixa ${faixaDaCapa} faixa--fina`}>
          <div className="faixa__interno">
            <img className="card__capa" src={p.imagem} alt={`Capa de ${p.nome}`}
                 style={{ aspectRatio: '21 / 9' }} />
          </div>
        </section>
      )}

      {/* RF-008: o destaque de correspondência é o coração do produto. */}
      {mostraCorrespondencia && (
        <section className="faixa faixa--amarelo faixa--encaixe">
          <div className="faixa__interno">
            {/* Sem quebras forçadas: elas empurravam o título para quatro linhas
                e faziam o bloco ocupar 38% da tela a 390px. */}
            <h2>Você tem exatamente o que este projeto tá procurando</h2>
            <p className="destaque">
              Não é coincidência. Foi pra isso que este lugar foi feito.
            </p>
            <ul className="chips">
              {encaixe.map((h) => (
                <li key={h}><span className="chip chip--inverso">{h}</span></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="faixa faixa--claro">
        <div className="faixa__interno empilhado">
          <div>
            <h2>Sobre</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{p.sobre}</p>
          </div>
          <div>
            <span className="rotulo">Áreas</span>
            <ul className="chips">
              {p.areas.map((a) => <li key={a}><span className="chip">{a}</span></li>)}
            </ul>
          </div>
          {p.temas.length > 0 && (
            <div>
              <span className="rotulo">Temas</span>
              <ul className="chips">
                {p.temas.map((t) => (
                  <li key={t}><Link className="chip" to={`/temas/${slugTema(t)}`}>{t}</Link></li>
                ))}
              </ul>
            </div>
          )}
          {p.ja_existiu && p.ja_existiu_links && (
            <div>
              <span className="rotulo">Já rolou antes</span>
              <p className="miudo" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {p.ja_existiu_links}
              </p>
            </div>
          )}
        </div>
      </section>

      <BlocoProcura
        projeto={p} souAutora={souAutora} podeVer={podeVerQuemChegou}
        interesse={meuInteresse}
        aoRegistrar={() => { meuInteresse.recarregar(); }}
        navegar={navegar}
      />

      {/* RF-012: todas as discussões vinculadas ao projeto. */}
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Assuntos<br />deste projeto</h2>
          {discussoes.carregando && <Carregando quantidade={1} rotulo="Buscando os assuntos" />}
          {discussoes.erro && (
            <Erro mensagem={discussoes.erro} aoTentarDeNovo={discussoes.recarregar} />
          )}
          {!discussoes.carregando && !discussoes.erro && (discussoes.dados ?? []).length === 0 && (
            <p>
              Ninguém puxou assunto a partir deste projeto ainda.
              {souAutora && ' Puxa um e chama quem pensa nisso.'}
            </p>
          )}
          {(discussoes.dados ?? []).length > 0 && (
            <div className="grade">
              {discussoes.dados!.map((d) => <CardDiscussao key={d.id} discussao={d} />)}
            </div>
          )}

          {souAutora && !abrindoDiscussao && (
            <div className="acoes">
              <button type="button" className="botao botao--amarelo"
                      onClick={() => setAbrindoDiscussao(true)}>
                <span className="seta" aria-hidden="true" />Puxar um assunto
              </button>
            </div>
          )}
          {souAutora && abrindoDiscussao && (
            <NovaDiscussaoNoProjeto
              projetoId={p.id}
              aoCancelar={() => setAbrindoDiscussao(false)}
              aoCriar={() => { setAbrindoDiscussao(false); discussoes.recarregar(); }}
            />
          )}
        </div>
      </section>
    </>
  );
}

function BlocoProcura({
  projeto, souAutora, podeVer, interesse, aoRegistrar, navegar,
}: {
  projeto: NonNullable<Awaited<ReturnType<typeof repo.obterProjeto>>>;
  souAutora: boolean;
  podeVer: boolean;
  interesse: ReturnType<typeof useConsulta<Awaited<ReturnType<typeof repo.meuInteresseNoProjeto>>>>;
  aoRegistrar: () => void;
  navegar: ReturnType<typeof useNavigate>;
}) {
  const [tipo, setTipo] = useState<TipoParticipacao | ''>('');
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // "Não busca pessoas": sem botão, só o contato de quem publicou (spec seção 9).
  if (!projeto.busca_pessoas) {
    return (
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <h2>Não tá<br />procurando gente<br />agora</h2>
          <p style={{ maxWidth: '32rem' }}>
            Se quiser falar sobre o projeto mesmo assim, o contato de quem publicou
            está no perfil.
          </p>
          {projeto.autor && (
            <div className="acoes">
              <Link className="botao botao--preto" to={`/pessoas/${projeto.autor.id}`}>
                <span className="seta" aria-hidden="true" />
                Ver perfil de {projeto.autor.nome.split(' ')[0]}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!tipo) novos.tipo = 'Marca como você topa entrar.';
    if (!mensagem.trim()) novos.mensagem = 'Conta em duas linhas o que você traz.';
    setErros(novos);
    setFalha(null);
    if (Object.keys(novos).length > 0) return;
    setEnviando(true);
    try {
      await repo.manifestarInteresse(projeto.id, tipo as TipoParticipacao, mensagem.trim());
      setMensagem('');
      setTipo('');
      aoRegistrar();
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não deu pra registrar.');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    setEnviando(true);
    try {
      await repo.cancelarInteresse(projeto.id);
      aoRegistrar();
    } finally {
      setEnviando(false);
    }
  }

  const jaManifestei = interesse.dados !== null;

  return (
    <section className="faixa faixa--preto">
      <div className="faixa__interno">
        <h2>Quem este<br />projeto procura</h2>
        <ul className="chips" aria-label="Quem o projeto procura">
          {projeto.conhecimentos_procurados.map((c) => (
            <li key={c}><span className="chip chip--inverso">{c}</span></li>
          ))}
        </ul>
        <p style={{ marginTop: '1rem' }}>
          <span className="rotulo">Como seria participar</span>
        </p>
        <ul className="chips">
          {projeto.tipo_participacao.map((t) => (
            <li key={t}><span className="chip chip--claro">{t}</span></li>
          ))}
        </ul>
        {projeto.o_que_precisa && (
          <p style={{ marginTop: '1.25rem', maxWidth: '34rem' }}>{projeto.o_que_precisa}</p>
        )}

        {podeVer && (
          <div className="acoes">
            <Link className="botao botao--preto" to={`/projetos/${projeto.id}/quem-chegou-junto`}>
              <span className="seta" aria-hidden="true" />Ver quem chegou junto
            </Link>
          </div>
        )}

        {!souAutora && interesse.carregando && <p style={{ marginTop: '1.5rem' }}>Só um segundo…</p>}

        {/* RN-008 / H4: um interesse por pessoa; ao voltar, o botão diz que já foi. */}
        {!souAutora && !interesse.carregando && jaManifestei && (
          <div style={{ marginTop: '1.5rem' }}>
            <p className="sucesso">
              <span className="seta" aria-hidden="true" />
              Você já chegou junto aqui
            </p>
            <p className="miudo" style={{ marginTop: '0.75rem' }}>
              Sua mensagem e seu perfil já estão com quem publicou o projeto.
              A conversa segue pelo WhatsApp ou Instagram.
            </p>
            <div className="acoes">
              <button type="button" className="botao botao--preto" disabled>
                Você já chegou junto
              </button>
              <button type="button" className="botao botao--contorno"
                      onClick={cancelar} disabled={enviando}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!souAutora && !interesse.carregando && !jaManifestei && (
          <form onSubmit={enviar} noValidate style={{ marginTop: '1.5rem', maxWidth: '34rem' }}>
            <h3>Quero chegar junto</h3>
            {falha && <p className="aviso" role="alert">{falha}</p>}
            <EscolhaUnica
              nome="tipo" legenda="Como você topa entrar"
              opcoes={projeto.tipo_participacao} valor={tipo}
              aoMudar={(v) => setTipo(v)} erro={erros.tipo} obrigatorio
            />
            <Campo id="mensagem" rotulo="Conta em duas linhas o que você traz"
                   erro={erros.mensagem} obrigatorio
                   dica="Não precisa vender nada. É só dizer quem você é e o que sabe fazer.">
              <textarea id="mensagem" value={mensagem} maxLength={500}
                        onChange={(e) => setMensagem(e.target.value)} />
            </Campo>
            <button className="botao botao--preto botao--bloco" type="submit" disabled={enviando}>
              <span className="seta" aria-hidden="true" />
              {enviando ? 'Enviando…' : 'Quero chegar junto'}
            </button>
            <p className="miudo" style={{ marginTop: '0.75rem' }}>
              Quem publicou vai ver seu perfil completo e esta mensagem.{' '}
              <button type="button" className="migalha"
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer',
                               textDecoration: 'underline', color: 'inherit' }}
                      onClick={() => navegar('/meu-perfil')}>
                Revisar meu perfil
              </button>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function NovaDiscussaoNoProjeto({
  projetoId, aoCriar, aoCancelar,
}: {
  projetoId: string;
  aoCriar: () => void;
  aoCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tema, setTema] = useState<Tema | ''>('');
  const [descricao, setDescricao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!titulo.trim()) novos.titulo = 'Dá um título ao assunto.';
    if (!tema) novos.tema = 'Marca um tema — só um.';
    if (!descricao.trim()) novos.descricao = 'Escreve o que você quer conversar.';
    setErros(novos);
    setFalha(null);
    if (Object.keys(novos).length > 0) return;
    setEnviando(true);
    try {
      await repo.criarDiscussao(
        { titulo: titulo.trim(), tema: tema as Tema, descricao: descricao.trim() },
        projetoId,
      );
      aoCriar();
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não deu pra puxar o assunto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate style={{ marginTop: '1.5rem', maxWidth: '34rem' }}>
      <h3>Puxar um assunto</h3>
      {falha && <p className="aviso" role="alert">{falha}</p>}
      <Campo id="nd-titulo" rotulo="Título do assunto" erro={erros.titulo} obrigatorio>
        <input id="nd-titulo" type="text" value={titulo}
               onChange={(e) => setTitulo(e.target.value)} />
      </Campo>
      <EscolhaUnica nome="nd-tema" legenda="Tema da conversa" opcoes={TEMAS} valor={tema}
                    aoMudar={(v) => setTema(v)} erro={erros.tema} obrigatorio
                    dica="Um só. É ele que junta seu assunto com os outros." />
      <Campo id="nd-descricao" rotulo="O que você quer conversar"
             erro={erros.descricao} obrigatorio>
        <textarea id="nd-descricao" value={descricao}
                  onChange={(e) => setDescricao(e.target.value)} />
      </Campo>
      <div className="acoes">
        <button className="botao botao--amarelo" type="submit" disabled={enviando}>
          <span className="seta" aria-hidden="true" />
          {enviando ? 'Puxando…' : 'Puxar assunto'}
        </button>
        <button className="botao botao--contorno" type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
