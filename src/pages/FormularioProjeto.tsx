import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Campo, EscolhaUnica, GrupoOpcoes, SeletorSimNao } from '../components/Campos';
import { Carregando, Erro } from '../components/Estados';
import {
  AREAS, ESTAGIOS, HABILIDADES, MODALIDADES, TEMAS, TIPOS_PARTICIPACAO,
  type Area, type Estagio, type Habilidade, type Modalidade, type Tema,
  type TipoParticipacao,
} from '../lib/dominio';
import { repo } from '../data';
import type { DadosProjeto } from '../data/tipos';
import { useConsulta } from '../lib/useConsulta';
import { useRascunho } from '../lib/useRascunho';
import { useSessao } from '../lib/sessao';

interface Formulario {
  nome: string;
  o_que_e: string;
  areas: Area[];
  sobre: string;
  estagio: Estagio | '';
  temas: Tema[];
  quando: string;
  onde_cidade: string;
  onde_modalidade: Modalidade | '';
  ja_existiu: boolean;
  ja_existiu_links: string;
  imagem: string;
  busca_pessoas: boolean;
  tipo_participacao: TipoParticipacao[];
  conhecimentos_procurados: Habilidade[];
  o_que_precisa: string;
  abrir_discussao: boolean;
  discussao_titulo: string;
  discussao_tema: Tema | '';
  discussao_descricao: string;
}

const VAZIO: Formulario = {
  nome: '', o_que_e: '', areas: [], sobre: '', estagio: '', temas: [],
  quando: '', onde_cidade: '', onde_modalidade: '', ja_existiu: false,
  ja_existiu_links: '', imagem: '', busca_pessoas: true, tipo_participacao: [],
  conhecimentos_procurados: [], o_que_precisa: '',
  abrir_discussao: false, discussao_titulo: '', discussao_tema: '', discussao_descricao: '',
};

function texto(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function FormularioProjeto() {
  const { id } = useParams();
  const editando = Boolean(id);
  const carregado = useConsulta(
    () => (id ? repo.obterProjeto(id) : Promise.resolve(null)),
    [id],
  );

  if (editando && carregado.carregando) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Carregando o projeto" /></div>
      </section>
    );
  }
  if (editando && carregado.erro) {
    return (
      <section className="faixa faixa--claro">
        <div className="faixa__interno">
          <Erro mensagem={carregado.erro} aoTentarDeNovo={carregado.recarregar} />
        </div>
      </section>
    );
  }

  return <Corpo projetoId={id} inicial={paraFormulario(carregado.dados)} />;
}

function paraFormulario(p: Awaited<ReturnType<typeof repo.obterProjeto>>): Formulario {
  if (!p) return VAZIO;
  return {
    nome: p.nome, o_que_e: p.o_que_e, areas: p.areas, sobre: p.sobre,
    estagio: p.estagio, temas: p.temas, quando: p.quando ?? '',
    onde_cidade: p.onde_cidade ?? '', onde_modalidade: p.onde_modalidade ?? '',
    ja_existiu: p.ja_existiu, ja_existiu_links: p.ja_existiu_links ?? '',
    imagem: p.imagem ?? '', busca_pessoas: p.busca_pessoas,
    tipo_participacao: p.tipo_participacao,
    conhecimentos_procurados: p.conhecimentos_procurados,
    o_que_precisa: p.o_que_precisa ?? '',
    abrir_discussao: false, discussao_titulo: '', discussao_tema: '', discussao_descricao: '',
  };
}

function Corpo({ projetoId, inicial }: { projetoId?: string; inicial: Formulario }) {
  const navegar = useNavigate();
  const { perfil } = useSessao();
  const [form, setForm, descartarRascunho] = useRascunho<Formulario>(
    `projeto/${projetoId ?? 'novo'}/${perfil?.id ?? 'anon'}`,
    inicial,
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function campo<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((anterior) => ({ ...anterior, [chave]: valor }));
  }

  /** RN-007: os seis obrigatórios. RF-006: dois a mais se busca_pessoas = sim. */
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Dê um nome ao projeto.';
    if (!form.o_que_e.trim()) e.o_que_e = 'Resuma em uma ou duas frases.';
    if (form.areas.length === 0) e.areas = 'Escolha ao menos uma área.';
    if (!form.sobre.trim()) e.sobre = 'Conte a proposta, o objetivo e o contexto.';
    if (!form.estagio) e.estagio = 'Escolha o estágio do projeto.';
    if (form.busca_pessoas) {
      if (form.tipo_participacao.length === 0) {
        e.tipo_participacao = 'Você marcou que busca pessoas: diga em que regime.';
      }
      if (form.conhecimentos_procurados.length === 0) {
        e.conhecimentos_procurados =
          'Você marcou que busca pessoas: diga que conhecimentos procura. ' +
          'É isto que faz alguém descobrir que serve para o seu projeto.';
      }
    }
    if (form.abrir_discussao) {
      if (!form.discussao_titulo.trim()) e.discussao_titulo = 'Dê um título à discussão.';
      if (!form.discussao_tema) e.discussao_tema = 'Escolha um tema — só um.';
      if (!form.discussao_descricao.trim()) {
        e.discussao_descricao = 'Escreva o que você quer discutir.';
      }
    }
    return e;
  }

  function montarDados(estado: 'rascunho' | 'publicado'): DadosProjeto {
    return {
      nome: form.nome.trim(),
      o_que_e: form.o_que_e.trim(),
      areas: form.areas,
      sobre: form.sobre.trim(),
      estagio: (form.estagio || 'Ideia') as Estagio,
      temas: form.temas,
      quando: texto(form.quando),
      onde_cidade: texto(form.onde_cidade),
      onde_modalidade: form.onde_modalidade || null,
      ja_existiu: form.ja_existiu,
      ja_existiu_links: form.ja_existiu ? texto(form.ja_existiu_links) : null,
      imagem: texto(form.imagem),
      busca_pessoas: form.busca_pessoas,
      // RF-006: com busca_pessoas = não, estes campos não são gravados.
      tipo_participacao: form.busca_pessoas ? form.tipo_participacao : [],
      conhecimentos_procurados: form.busca_pessoas ? form.conhecimentos_procurados : [],
      o_que_precisa: form.busca_pessoas ? texto(form.o_que_precisa) : null,
      estado,
    };
  }

  async function publicar(evento: FormEvent) {
    evento.preventDefault();
    const novos = validar();
    setErros(novos);
    setFalha(null);
    if (Object.keys(novos).length > 0) {
      document.querySelector('.campo--erro')?.scrollIntoView({ block: 'center' });
      return;
    }
    setEnviando(true);
    try {
      const dados = montarDados('publicado');
      const discussao = form.abrir_discussao
        ? {
            titulo: form.discussao_titulo.trim(),
            tema: form.discussao_tema as Tema,
            descricao: form.discussao_descricao.trim(),
          }
        : null;
      const salvo = projetoId
        ? await repo.atualizarProjeto(projetoId, dados)
        : await repo.criarProjeto(dados, discussao);
      descartarRascunho();
      navegar(`/projetos/${salvo.id}`);
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não foi possível salvar o projeto.');
    } finally {
      setEnviando(false);
    }
  }

  /** Exceção da RN-007: rascunho salva incompleto e não vai ao mural. */
  async function salvarRascunho() {
    setFalha(null);
    if (!form.nome.trim()) {
      setErros({ nome: 'Até o rascunho precisa de um nome para você reencontrá-lo.' });
      return;
    }
    setEnviando(true);
    try {
      const dados = montarDados('rascunho');
      const salvo = projetoId
        ? await repo.atualizarProjeto(projetoId, dados)
        : await repo.criarProjeto(dados, null);
      descartarRascunho();
      navegar(`/projetos/${salvo.id}`);
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não foi possível guardar o rascunho.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="faixa faixa--vermelho">
        <div className="faixa__interno">
          <h1>{projetoId ? 'Editar\nprojeto' : 'Publicar\num projeto'}</h1>
          {!projetoId && (
            <p style={{ maxWidth: '32rem' }}>
              O projeto é quem diz o que precisa. Mesmo uma ideia no papel vale
              publicar — é o que abre a porta para alguém chegar.
            </p>
          )}
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno" style={{ maxWidth: '40rem' }}>
          <form onSubmit={publicar} noValidate>
            {falha && <Erro mensagem={falha} />}

            <Campo id="nome" rotulo="Nome do projeto" erro={erros.nome} obrigatorio>
              <input id="nome" type="text" value={form.nome}
                     onChange={(e) => campo('nome', e.target.value)} />
            </Campo>

            <Campo id="o_que_e" rotulo="O que é" erro={erros.o_que_e} obrigatorio
                   dica="Uma ou duas frases. É o que aparece no card do mural.">
              <textarea id="o_que_e" value={form.o_que_e} maxLength={280}
                        onChange={(e) => campo('o_que_e', e.target.value)} />
            </Campo>

            <GrupoOpcoes nome="areas" legenda="Áreas" opcoes={AREAS} valor={form.areas}
                         aoMudar={(v) => campo('areas', v)} erro={erros.areas} obrigatorio />

            <Campo id="sobre" rotulo="Sobre" erro={erros.sobre} obrigatorio
                   dica="Proposta, objetivo e contexto.">
              <textarea id="sobre" value={form.sobre} style={{ minHeight: '9rem' }}
                        onChange={(e) => campo('sobre', e.target.value)} />
            </Campo>

            <EscolhaUnica nome="estagio" legenda="Estágio" opcoes={ESTAGIOS}
                          valor={form.estagio} aoMudar={(v) => campo('estagio', v)}
                          erro={erros.estagio} obrigatorio />

            <GrupoOpcoes nome="temas" legenda="Temas" opcoes={TEMAS} valor={form.temas}
                         aoMudar={(v) => campo('temas', v)}
                         dica="Coloca o projeto na página de cada tema." />

            <Campo id="quando" rotulo="Quando"
                   dica="Uma data, um período, ou deixe em branco se ainda não definiu.">
              <input id="quando" type="text" value={form.quando}
                     placeholder="Novembro de 2026"
                     onChange={(e) => campo('quando', e.target.value)} />
            </Campo>

            <Campo id="onde_cidade" rotulo="Onde — cidade">
              <input id="onde_cidade" type="text" value={form.onde_cidade}
                     onChange={(e) => campo('onde_cidade', e.target.value)} />
            </Campo>

            <EscolhaUnica nome="modalidade" legenda="Onde — formato" opcoes={MODALIDADES}
                          valor={form.onde_modalidade}
                          aoMudar={(v) => campo('onde_modalidade', v)} />

            <SeletorSimNao nome="ja_existiu" legenda="O projeto já aconteceu antes?"
                           valor={form.ja_existiu} aoMudar={(v) => campo('ja_existiu', v)} />

            {form.ja_existiu && (
              <Campo id="ja_existiu_links" rotulo="Links do que já rolou"
                     dica="Cole os endereços, um por linha.">
                <textarea id="ja_existiu_links" value={form.ja_existiu_links}
                          onChange={(e) => campo('ja_existiu_links', e.target.value)} />
              </Campo>
            )}

            <Campo id="imagem" rotulo="Link da capa"
                   dica="Endereço de uma imagem. Opcional.">
              <input id="imagem" type="url" value={form.imagem} inputMode="url"
                     placeholder="https://…"
                     onChange={(e) => campo('imagem', e.target.value)} />
            </Campo>

            <div className="cartaz" style={{ margin: '2rem 0' }}>
              <h3>Está buscando pessoas?</h3>
              <p className="miudo">
                "Não" é resposta legítima: o projeto é publicado do mesmo jeito e
                quem quiser falar com você encontra seus contatos no seu perfil.
              </p>
              <SeletorSimNao
                nome="busca_pessoas" legenda="" valor={form.busca_pessoas}
                aoMudar={(v) => campo('busca_pessoas', v)}
                textoSim="Sim, estou buscando" textoNao="Não, por enquanto não"
              />
            </div>

            {/* RF-006: campos condicionais — só aparecem e só são exigidos com "sim". */}
            {form.busca_pessoas && (
              <>
                <GrupoOpcoes
                  nome="tipo_participacao" legenda="Tipo de participação"
                  opcoes={TIPOS_PARTICIPACAO} valor={form.tipo_participacao}
                  aoMudar={(v) => campo('tipo_participacao', v)}
                  erro={erros.tipo_participacao} obrigatorio
                />
                <GrupoOpcoes
                  nome="conhecimentos" legenda="Conhecimentos procurados"
                  opcoes={HABILIDADES} valor={form.conhecimentos_procurados}
                  aoMudar={(v) => campo('conhecimentos_procurados', v)}
                  erro={erros.conhecimentos_procurados} obrigatorio
                  dica="A mesma lista das habilidades do perfil — é esse encaixe que faz a rede funcionar."
                />
                <Campo id="o_que_precisa" rotulo="O que você precisa"
                       dica="Em poucas palavras, o que faria diferença agora.">
                  <textarea id="o_que_precisa" value={form.o_que_precisa} maxLength={400}
                            onChange={(e) => campo('o_que_precisa', e.target.value)} />
                </Campo>
              </>
            )}

            {/* H5 / RF-011: discussão opcional, criada junto com o projeto. */}
            {!projetoId && (
              <div className="cartaz cartaz--preto" style={{ margin: '2rem 0' }}>
                <h3>Quer abrir uma discussão?</h3>
                <p className="miudo">
                  Um assunto ligado ao projeto, aberto a qualquer participante — mesmo
                  quem não tem nada a ver com ele. É o segundo caminho até as pessoas.
                </p>
                <SeletorSimNao
                  nome="abrir_discussao" legenda="" valor={form.abrir_discussao}
                  aoMudar={(v) => campo('abrir_discussao', v)}
                  textoSim="Quero abrir" textoNao="Agora não"
                />

                {form.abrir_discussao && (
                  <div style={{ marginTop: '1rem' }}>
                    <Campo id="discussao_titulo" rotulo="Título da discussão"
                           erro={erros.discussao_titulo} obrigatorio>
                      <input id="discussao_titulo" type="text" value={form.discussao_titulo}
                             onChange={(e) => campo('discussao_titulo', e.target.value)} />
                    </Campo>
                    <EscolhaUnica
                      nome="discussao_tema" legenda="Tema da discussão" opcoes={TEMAS}
                      valor={form.discussao_tema}
                      aoMudar={(v) => campo('discussao_tema', v)}
                      erro={erros.discussao_tema} obrigatorio
                      dica="Um só. É o tema que agrupa a discussão com as outras."
                    />
                    <Campo id="discussao_descricao" rotulo="O que você quer discutir"
                           erro={erros.discussao_descricao} obrigatorio>
                      <textarea id="discussao_descricao" value={form.discussao_descricao}
                                onChange={(e) => campo('discussao_descricao', e.target.value)} />
                    </Campo>
                  </div>
                )}
              </div>
            )}

            <div className="acoes">
              <button className="botao botao--vermelho" type="submit" disabled={enviando}>
                <span className="seta" aria-hidden="true" />
                {enviando ? 'Salvando…' : projetoId ? 'Salvar e publicar' : 'Publicar projeto'}
              </button>
              <button className="botao botao--contorno" type="button"
                      onClick={salvarRascunho} disabled={enviando}>
                Guardar rascunho
              </button>
            </div>
            <p className="miudo" style={{ marginTop: '0.75rem' }}>
              O rascunho salva mesmo incompleto e não aparece no mural.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
