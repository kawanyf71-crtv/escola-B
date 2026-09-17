import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Campo, GrupoOpcoes } from '../components/Campos';
import { CampoImagem } from '../components/CampoImagem';
import { REGRA_FOTO } from '../lib/imagem';
import { chaveDoRascunhoDePerfil } from '../lib/adiantado';
import { Erro } from '../components/Estados';
import {
  AREAS, DISPONIBILIDADES, HABILIDADES, TEMAS,
  type Area, type Disponibilidade, type Habilidade, type Tema,
} from '../lib/dominio';
import { repo } from '../data';
import { useRascunho } from '../lib/useRascunho';
import { useSessao } from '../lib/sessao';

interface Formulario {
  nome: string;
  ocupacao: string;
  cidade: string;
  mini_bio: string;
  foto: string;
  areas: Area[];
  habilidades_oferecidas: Habilidade[];
  temas_interesse: Tema[];
  disponibilidade: Disponibilidade[];
  instagram: string;
  linkedin: string;
  site: string;
  /**
   * O registro da lista da turma que a pessoa disse ser dela, vindo da etapa
   * anterior. Vive no rascunho porque a reivindicação só acontece quando o
   * perfil é publicado: quem desiste no meio não reivindica nada.
   */
  suspenso_id: string;
}

const VAZIO: Formulario = {
  nome: '', ocupacao: '', cidade: '', mini_bio: '', foto: '',
  areas: [], habilidades_oferecidas: [], temas_interesse: [], disponibilidade: [],
  instagram: '', linkedin: '', site: '', suspenso_id: '',
};

function limparLink(valor: string): string | null {
  const v = valor.trim();
  return v.length > 0 ? v : null;
}

export function MeuPerfil() {
  const { perfil, recarregarPerfil, sessao } = useSessao();
  const navegar = useNavigate();
  const editando = perfil !== null;

  const [form, setForm, descartarRascunho] = useRascunho<Formulario>(
    chaveDoRascunhoDePerfil(sessao?.usuario_id ?? 'anon'),
    perfil
      ? {
          nome: perfil.nome, ocupacao: perfil.ocupacao, cidade: perfil.cidade,
          mini_bio: perfil.mini_bio, foto: perfil.foto ?? '',
          areas: perfil.areas, habilidades_oferecidas: perfil.habilidades_oferecidas,
          temas_interesse: perfil.temas_interesse, disponibilidade: perfil.disponibilidade,
          instagram: perfil.instagram ?? '', linkedin: perfil.linkedin ?? '',
          site: perfil.site ?? '', suspenso_id: '',
        }
      : VAZIO,
  );

  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function campo<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((anterior) => ({ ...anterior, [chave]: valor }));
  }

  /** RF-003: sem estes campos o perfil não é publicado, e a tela diz por quê. */
  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Como a turma vai te chamar?';
    if (!form.ocupacao.trim()) e.ocupacao = 'Conta o que você faz.';
    if (!form.cidade.trim()) e.cidade = 'Faltou a cidade.';
    if (!form.mini_bio.trim()) e.mini_bio = 'Escreve umas linhas sobre você.';
    if (form.areas.length === 0) e.areas = 'Marca ao menos uma área.';
    if (form.habilidades_oferecidas.length === 0) {
      e.habilidades_oferecidas =
        'Marca ao menos uma. É por aqui que os projetos vão te encontrar — ' +
        'sem isso, seu perfil não cruza com nada.';
    }
    return e;
  }

  async function enviar(evento: FormEvent) {
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
      await repo.salvarPerfil({
        nome: form.nome.trim(),
        ocupacao: form.ocupacao.trim(),
        cidade: form.cidade.trim(),
        mini_bio: form.mini_bio.trim(),
        foto: limparLink(form.foto),
        areas: form.areas,
        habilidades_oferecidas: form.habilidades_oferecidas,
        temas_interesse: form.temas_interesse,
        disponibilidade: form.disponibilidade,
        instagram: limparLink(form.instagram),
        linkedin: limparLink(form.linkedin),
        site: limparLink(form.site),
      });
      // A reivindicação vem DEPOIS de publicar: é o perfil que existe primeiro,
      // e é ele que o registro da lista passa a apontar. Se falhar — alguém
      // chegou antes no mesmo @ —, o perfil já está publicado e é isso que
      // importa; a lista se acerta sozinha na próxima vez que alguém olhar.
      if (form.suspenso_id) {
        try {
          await repo.reivindicarPerfilSuspenso(form.suspenso_id);
        } catch {
          /* o perfil é o que estava em jogo, e ele foi publicado */
        }
      }
      descartarRascunho();
      await recarregarPerfil();
      navegar('/pessoas');
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não deu pra salvar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="faixa">
        <div className="faixa__interno">
          <h1>{editando ? 'Editar\nmeu perfil' : 'Quem é você\nnessa turma'}</h1>
          <p style={{ maxWidth: '32rem' }}>
            Ninguém aqui é currículo. Conta o que você faz, o que sabe fazer e o que
            te move — é por aí que a turma vai te achar.
          </p>
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno" style={{ maxWidth: '40rem' }}>
          {form.suspenso_id && !editando && (
            <div className="ja-esperavam">
              <p className="ja-esperavam__titulo">A gente já tava te esperando.</p>
              <p>
                Achamos você na lista. Confere se tá tudo certo e completa o resto —
                falta pouco.
              </p>
            </div>
          )}

          <form onSubmit={enviar} noValidate>
            {falha && <Erro mensagem={falha} />}

            <Campo id="nome" rotulo="Nome" erro={erros.nome} obrigatorio>
              <input id="nome" type="text" value={form.nome} autoComplete="name"
                     onChange={(e) => campo('nome', e.target.value)} />
            </Campo>

            <Campo id="ocupacao" rotulo="O que você faz" erro={erros.ocupacao} obrigatorio
                   dica="Ex.: produtora cultural, fotógrafo, professora de dança.">
              <input id="ocupacao" type="text" value={form.ocupacao}
                     onChange={(e) => campo('ocupacao', e.target.value)} />
            </Campo>

            <Campo id="cidade" rotulo="De onde você é" erro={erros.cidade} obrigatorio>
              <input id="cidade" type="text" value={form.cidade} placeholder="Salvador, BA"
                     onChange={(e) => campo('cidade', e.target.value)} />
            </Campo>

            <Campo id="mini_bio" rotulo="Em poucas linhas, quem é você"
                   erro={erros.mini_bio} obrigatorio
                   dica="Escreve do seu jeito. Ninguém aqui tá julgando português.">
              <textarea id="mini_bio" value={form.mini_bio} maxLength={400}
                        onChange={(e) => campo('mini_bio', e.target.value)} />
            </Campo>

            <GrupoOpcoes
              nome="areas" legenda="Áreas" opcoes={AREAS} valor={form.areas}
              aoMudar={(v) => campo('areas', v)} erro={erros.areas} obrigatorio
            />

            <GrupoOpcoes
              nome="habilidades" legenda="O que você sabe fazer" opcoes={HABILIDADES}
              valor={form.habilidades_oferecidas}
              aoMudar={(v) => campo('habilidades_oferecidas', v)}
              erro={erros.habilidades_oferecidas} obrigatorio
              dica={'É por aqui que os projetos vão te encontrar. Marca tudo que você ' +
                    'entrega de verdade — inclusive o que você aprendeu fora da escola.'}
            />

            <GrupoOpcoes
              nome="temas" legenda="O que te move" opcoes={TEMAS}
              valor={form.temas_interesse} aoMudar={(v) => campo('temas_interesse', v)}
              dica="Assunto também aproxima. Quem se interessa pelo mesmo que você vai chegar por aqui."
            />

            <GrupoOpcoes
              nome="disponibilidade" legenda="Como você topa participar"
              opcoes={DISPONIBILIDADES}
              valor={form.disponibilidade} aoMudar={(v) => campo('disponibilidade', v)}
              dica="Dá pra marcar mais de um. Muda de ideia quando quiser."
            />

            <CampoImagem
              rotulo="Sua foto"
              dica="Escolhe uma foto do seu celular ou computador. Dá pra deixar em branco."
              proporcao="1:1"
              regra={REGRA_FOTO}
              pasta="perfis"
              valor={form.foto || null}
              aoMudar={(v) => campo('foto', v ?? '')}
            />

            <Campo id="instagram" rotulo="Instagram">
              <input id="instagram" type="text" value={form.instagram} placeholder="@seuperfil"
                     onChange={(e) => campo('instagram', e.target.value)} />
            </Campo>

            <Campo id="linkedin" rotulo="LinkedIn">
              <input id="linkedin" type="url" value={form.linkedin} inputMode="url"
                     onChange={(e) => campo('linkedin', e.target.value)} />
            </Campo>

            <Campo id="site" rotulo="Site ou portfólio">
              <input id="site" type="url" value={form.site} inputMode="url"
                     onChange={(e) => campo('site', e.target.value)} />
            </Campo>

            <button className="botao botao--vermelho botao--bloco" type="submit" disabled={enviando}>
              <span className="seta" aria-hidden="true" />
              {enviando ? 'Publicando…' : editando ? 'Salvar perfil' : 'Me apresentar pra turma'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
