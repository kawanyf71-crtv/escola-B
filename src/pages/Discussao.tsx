import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Campo } from '../components/Campos';
import { Carregando, Erro } from '../components/Estados';
import { CardPessoaCompacto } from '../components/Cards';
import { slugTema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

function quando(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function Discussao() {
  const { id = '' } = useParams();
  const { perfil } = useSessao();
  const navegar = useNavigate();

  const discussao = useConsulta(() => repo.obterDiscussao(id), [id]);
  const participantes = useConsulta(() => repo.participantesDaDiscussao(id), [id]);
  const comentarios = useConsulta(() => repo.comentarios(id), [id]);

  const [texto, setTexto] = useState('');
  const [erroCampo, setErroCampo] = useState<string | undefined>();
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);

  if (discussao.carregando) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Buscando o assunto" /></div>
      </section>
    );
  }
  if (discussao.erro) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <Erro mensagem={discussao.erro} aoTentarDeNovo={discussao.recarregar} />
        </div>
      </section>
    );
  }

  const d = discussao.dados;
  if (!d) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <div className="cartaz cartaz--vermelho">
            <h2>Esse assunto<br />não existe mais</h2>
            <div className="acoes">
              <Link className="botao botao--preto" to="/assuntos">
                <span className="seta" aria-hidden="true" />Ver todos os assuntos
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const souAutora = perfil?.id === d.autor_id;
  const listaParticipantes = participantes.dados ?? [];
  const jaEstou = perfil ? listaParticipantes.some((p) => p.id === perfil.id) : false;
  const listaComentarios = comentarios.dados ?? [];

  /** RN-006: entrar não depende de ter relação com o projeto de origem. */
  async function participar() {
    setEnviando(true);
    setFalha(null);
    try {
      await repo.entrarNaDiscussao(id);
      participantes.recarregar();
      discussao.recarregar();
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não deu pra entrar na conversa.');
    } finally {
      setEnviando(false);
    }
  }

  /** RF-017: quem abriu apaga o proprio assunto, tenha ele projeto ou nao. */
  async function apagar() {
    setEnviando(true);
    setFalha(null);
    try {
      await repo.excluirDiscussao(id);
      navegar('/assuntos');
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não deu pra apagar.');
      setEnviando(false);
    }
  }

  async function comentar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setErroCampo('Escreve alguma coisa antes de mandar.');
      return;
    }
    setErroCampo(undefined);
    setFalha(null);
    setEnviando(true);
    try {
      await repo.comentar(id, texto.trim());
      setTexto('');
      comentarios.recarregar();
      participantes.recarregar();
      discussao.recarregar();
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não deu pra mandar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <Link className="migalha" to="/assuntos">
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            Ver todos os assuntos
          </Link>
          <p style={{ margin: '0.5rem 0' }}>
            <Link className="chip" to={`/temas/${slugTema(d.tema)}`}>{d.tema}</Link>
          </p>
          <h1>{d.titulo}</h1>
          <p style={{ maxWidth: '36rem', marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            {d.descricao}
          </p>
          <p className="miudo" style={{ marginTop: '1rem' }}>
            {d.autor && <>Puxado por <Link to={`/pessoas/${d.autor.id}`}>{d.autor.nome}</Link></>}
            {d.projeto && (
              <> · a partir de{' '}
                <Link to={`/projetos/${d.projeto.id}`}>{d.projeto.nome}</Link>
              </>
            )}
          </p>
          {!jaEstou && (
            <div className="acoes">
              <button type="button" className="botao botao--amarelo"
                      onClick={participar} disabled={enviando}>
                <span className="seta" aria-hidden="true" />
                {enviando ? 'Entrando…' : 'Participar'}
              </button>
            </div>
          )}
          {jaEstou && (
            <p className="sucesso" style={{ marginTop: '1.25rem', display: 'inline-block' }}>
              <span className="seta" aria-hidden="true" />Você tá nessa
            </p>
          )}
          {souAutora && !confirmandoApagar && (
            <div className="acoes">
              <button type="button" className="botao botao--contorno"
                      onClick={() => setConfirmandoApagar(true)}>
                Apagar este assunto
              </button>
            </div>
          )}
          {souAutora && confirmandoApagar && (
            <div className="cartaz cartaz--vermelho" style={{ marginTop: '1.25rem' }}>
              <h3>Apagar o assunto?</h3>
              <p>A conversa inteira some junto. Não dá pra desfazer.</p>
              <div className="acoes">
                <button type="button" className="botao botao--preto"
                        onClick={apagar} disabled={enviando}>
                  {enviando ? 'Apagando…' : 'Sim, apaga'}
                </button>
                <button type="button" className="botao botao--claro"
                        onClick={() => setConfirmandoApagar(false)} disabled={enviando}>
                  Não, voltar
                </button>
              </div>
            </div>
          )}

          {falha && <p className="aviso" role="alert" style={{ marginTop: '1rem' }}>{falha}</p>}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <h2>Conversa</h2>

          {comentarios.carregando && <Carregando quantidade={2} rotulo="Buscando a conversa" />}
          {comentarios.erro && (
            <Erro mensagem={comentarios.erro} aoTentarDeNovo={comentarios.recarregar} />
          )}

          {/* Estado "sem respostas": convite a ser a primeira voz, não página morta. */}
          {!comentarios.carregando && !comentarios.erro && listaComentarios.length === 0 && (
            <div className="cartaz">
              <h3>Seja a<br />primeira voz</h3>
              <p>
                Ninguém respondeu ainda. Uma frase já basta pra conversa existir — e
                quem chegar depois entra num assunto vivo, não numa página parada.
              </p>
            </div>
          )}

          {listaComentarios.length > 0 && (
            <ul className="lista-limpa empilhado">
              {listaComentarios.map((c) => (
                <li className="comentario" key={c.id}>
                  <p className="rotulo" style={{ marginBottom: '0.25rem' }}>
                    {c.autor
                      ? <Link to={`/pessoas/${c.autor.id}`}>{c.autor.nome}</Link>
                      : 'Participante'}
                  </p>
                  <p className="miudo" style={{ opacity: 0.75, marginBottom: '0.375rem' }}>
                    {quando(c.criado_em)}
                  </p>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{c.texto}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={comentar} noValidate style={{ marginTop: '2rem', maxWidth: '34rem' }}>
            <Campo id="comentario" rotulo="Escrever" erro={erroCampo}>
              <textarea id="comentario" value={texto} maxLength={2000}
                        placeholder="Escreve o que você pensa. Aqui ninguém precisa ter resposta pronta."
                        onChange={(e) => setTexto(e.target.value)} />
            </Campo>
            <button className="botao botao--vermelho" type="submit" disabled={enviando}>
              <span className="seta" aria-hidden="true" />
              {enviando ? 'Enviando…' : 'Mandar'}
            </button>
            {!jaEstou && (
              <p className="miudo" style={{ marginTop: '0.75rem' }}>
                Ao mandar, você já entra na conversa.
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="faixa faixa--preto-2">
        <div className="faixa__interno">
          <h2>Quem tá aqui</h2>
          {participantes.carregando && (
            <Carregando quantidade={2} rotulo="Buscando quem tá na conversa" />
          )}
          {participantes.erro && (
            <Erro mensagem={participantes.erro} aoTentarDeNovo={participantes.recarregar} />
          )}
          {!participantes.carregando && listaParticipantes.length === 0 && (
            <p>Ninguém entrou ainda. Pode ser você.</p>
          )}
          {listaParticipantes.length > 0 && (
            <div className="grade">
              {listaParticipantes.map((p) => <CardPessoaCompacto key={p.id} pessoa={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
