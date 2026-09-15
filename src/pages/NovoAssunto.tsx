import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Campo, EscolhaUnica } from '../components/Campos';
import { Carregando, Erro } from '../components/Estados';
import { TEMAS, type Tema } from '../lib/dominio';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

const NENHUM = '';

export function NovoAssunto() {
  const navegar = useNavigate();
  const { perfil } = useSessao();
  const meuId = perfil?.id ?? '';

  // O campo de projeto só existe se a pessoa tiver o que ligar.
  const meusProjetos = useConsulta(
    () => (meuId ? repo.projetosDoParticipante(meuId) : Promise.resolve([])),
    [meuId],
  );
  const publicados = (meusProjetos.dados ?? []).filter((p) => p.estado === 'publicado');

  const [titulo, setTitulo] = useState('');
  const [tema, setTema] = useState<Tema | ''>('');
  const [descricao, setDescricao] = useState('');
  const [projetoId, setProjetoId] = useState<string>(NENHUM);
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
    if (Object.keys(novos).length > 0) {
      document.querySelector('.campo--erro')?.scrollIntoView({ block: 'center' });
      return;
    }
    setEnviando(true);
    try {
      const nova = await repo.criarDiscussao(
        { titulo: titulo.trim(), tema: tema as Tema, descricao: descricao.trim() },
        projetoId === NENHUM ? null : projetoId,
      );
      navegar(`/assuntos/${nova.id}`);
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não deu pra puxar o assunto.');
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
          <h1>Puxar<br />um assunto</h1>
          <p style={{ maxWidth: '32rem' }}>
            Puxa um assunto que tá te movendo. Tem gente aqui pensando a mesma coisa
            e vocês ainda não se falaram.
          </p>
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno" style={{ maxWidth: '40rem' }}>
          <form onSubmit={enviar} noValidate>
            {falha && <Erro mensagem={falha} />}

            <Campo id="titulo" rotulo="Título do assunto" erro={erros.titulo} obrigatorio>
              <input id="titulo" type="text" value={titulo}
                     onChange={(e) => setTitulo(e.target.value)} />
            </Campo>

            <EscolhaUnica
              nome="tema" legenda="Tema da conversa" opcoes={TEMAS} valor={tema}
              aoMudar={(v) => setTema(v)} erro={erros.tema} obrigatorio
              dica="Um só. É ele que junta seu assunto com os outros."
            />

            <Campo id="descricao" rotulo="O que você quer conversar"
                   erro={erros.descricao} obrigatorio>
              <textarea id="descricao" value={descricao} style={{ minHeight: '8rem' }}
                        onChange={(e) => setDescricao(e.target.value)} />
            </Campo>

            {meusProjetos.carregando && <Carregando quantidade={1} rotulo="Buscando os seus projetos" />}

            {!meusProjetos.carregando && publicados.length > 0 && (
              <Campo id="projeto" rotulo="Ligar a um projeto meu"
                     dica="Opcional. O assunto aparece na página do projeto e ganha o contexto dele.">
                <select id="projeto" value={projetoId}
                        onChange={(e) => setProjetoId(e.target.value)}>
                  <option value={NENHUM}>Nenhum — assunto solto</option>
                  {publicados.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </Campo>
            )}

            <button className="botao botao--vermelho botao--bloco" type="submit"
                    disabled={enviando}>
              <span className="seta" aria-hidden="true" />
              {enviando ? 'Puxando…' : 'Puxar assunto'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
