import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Campo, EscolhaUnica, GrupoOpcoes } from '../components/Campos';
import { CampoImagem } from '../components/CampoImagem';
import { Carregando, Erro } from '../components/Estados';
import {
  AREAS, ENTRADAS_EVENTO, FORMATOS_EVENTO, TEMAS, UFS,
  type Area, type EntradaEvento, type FormatoEvento, type Tema, type Uf,
} from '../lib/dominio';
import { normalizarLink } from '../lib/datas';
import { REGRA_CAPA } from '../lib/imagem';
import type { DadosEvento } from '../data/tipos';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';

export function FormularioEvento() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();

  const [banner, setBanner] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horario, setHorario] = useState('');
  const [formato, setFormato] = useState<FormatoEvento | ''>('');
  const [estado, setEstado] = useState<Uf | ''>('');
  const [cidade, setCidade] = useState('');
  const [entrada, setEntrada] = useState<EntradaEvento | ''>('');
  const [link, setLink] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);

  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const existente = useConsulta(
    () => (id ? repo.obterEvento(id) : Promise.resolve(null)), [id],
  );

  useEffect(() => {
    const e = existente.dados;
    if (!e) return;
    setBanner(e.banner);
    setTitulo(e.titulo);
    setDataInicio(e.data_inicio);
    setDataFim(e.data_fim ?? '');
    setHorario(e.horario ?? '');
    setFormato(e.formato);
    setEstado(e.estado ?? '');
    setCidade(e.cidade ?? '');
    setEntrada(e.entrada);
    setLink(e.link);
    setAreas(e.areas);
    setTemas(e.temas);
  }, [existente.dados]);

  // Online não tem lugar: os dois campos somem e param de ser exigidos.
  const temLugar = formato !== '' && formato !== 'Online';

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const novos: Record<string, string> = {};
    if (!banner) novos.banner = 'Falta o cartaz do evento.';
    if (!titulo.trim()) novos.titulo = 'Falta o nome do evento.';
    if (!dataInicio) novos.data_inicio = 'Falta dizer quando começa.';
    if (dataFim && dataInicio && dataFim < dataInicio) {
      novos.data_fim = 'A data de término vem antes da de início.';
    }
    if (!formato) novos.formato = 'Escolhe se é presencial, online ou híbrido.';
    if (temLugar && !estado) novos.estado = 'Falta o estado.';
    if (temLugar && !cidade.trim()) novos.cidade = 'Falta a cidade.';
    if (!entrada) novos.entrada = 'Escolhe como é a entrada.';
    if (!link.trim()) novos.link = 'Falta o link do evento.';
    if (areas.length === 0) novos.areas = 'Marca ao menos uma área.';
    setErros(novos);
    setFalha(null);
    if (Object.keys(novos).length > 0) {
      document.querySelector('.campo--erro')?.scrollIntoView({ block: 'center' });
      return;
    }

    const dados: DadosEvento = {
      banner: banner!,
      titulo: titulo.trim(),
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      horario: horario || null,
      // Endereço colado sem http vira https em vez de ser recusado.
      link: normalizarLink(link),
      formato: formato as FormatoEvento,
      estado: temLugar ? (estado as Uf) : null,
      cidade: temLugar ? cidade.trim() : null,
      entrada: entrada as EntradaEvento,
      areas,
      temas,
    };

    setEnviando(true);
    try {
      const salvo = editando
        ? await repo.atualizarEvento(id!, dados)
        : await repo.criarEvento(dados);
      navegar(`/eventos/${salvo.id}`);
    } catch (e) {
      setFalha(e instanceof Error ? e.message : 'Não deu pra publicar.');
      setEnviando(false);
    }
  }

  if (editando && existente.carregando) {
    return (
      <section className="faixa">
        <div className="faixa__interno"><Carregando quantidade={1} rotulo="Buscando o evento" /></div>
      </section>
    );
  }

  if (editando && existente.erro) {
    return (
      <section className="faixa">
        <div className="faixa__interno">
          <Erro mensagem={existente.erro} aoTentarDeNovo={existente.recarregar} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <Link className="migalha" to="/eventos">
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            Voltar pro mural
          </Link>
          <h1>{editando ? 'Editar evento' : 'Publicar um evento'}</h1>
          {!editando && (
            <p className="miudo" style={{ maxWidth: '32rem' }}>
              Não precisa ser seu. Se tá rolando na sua cidade e a turma ia querer
              saber, sobe aqui.
            </p>
          )}
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          <div style={{ maxWidth: '40rem' }}>
            <form onSubmit={enviar} noValidate>
              <CampoImagem
                rotulo="Banner do evento"
                dica="Escolhe o cartaz ou uma imagem do evento."
                proporcao="16:9"
                regra={REGRA_CAPA}
                pasta="eventos"
                valor={banner}
                aoMudar={setBanner}
              />
              {erros.banner && <strong className="erro-campo">{erros.banner}</strong>}

              <Campo id="titulo" rotulo="Nome do evento" obrigatorio erro={erros.titulo}>
                <input id="titulo" type="text" value={titulo}
                       onChange={(e) => setTitulo(e.target.value)} />
              </Campo>

              <div className="linha-de-campos">
                <Campo id="data_inicio" rotulo="Quando começa" obrigatorio
                       erro={erros.data_inicio}>
                  <input id="data_inicio" type="date" value={dataInicio}
                         onChange={(e) => setDataInicio(e.target.value)} />
                </Campo>
                <Campo id="horario" rotulo="A que horas" dica="Opcional.">
                  <input id="horario" type="time" value={horario}
                         onChange={(e) => setHorario(e.target.value)} />
                </Campo>
                <Campo id="data_fim" rotulo="Quando termina"
                       dica="Opcional, só se for mais de um dia."
                       erro={erros.data_fim}>
                  <input id="data_fim" type="date" value={dataFim} min={dataInicio || undefined}
                         onChange={(e) => setDataFim(e.target.value)} />
                </Campo>
              </div>

              <EscolhaUnica
                legenda="É presencial, online ou híbrido?"
                nome="formato"
                opcoes={FORMATOS_EVENTO}
                valor={formato}
                aoMudar={setFormato}
                obrigatorio
                erro={erros.formato}
              />

              {temLugar && (
                <div className="linha-de-campos">
                  <Campo id="estado" rotulo="Estado" obrigatorio erro={erros.estado}>
                    <select id="estado" value={estado}
                            onChange={(e) => setEstado(e.target.value as Uf | '')}>
                      <option value="">Escolhe</option>
                      {UFS.map((u) => (
                        <option key={u.sigla} value={u.sigla}>{u.sigla} — {u.nome}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo id="cidade" rotulo="Cidade" obrigatorio erro={erros.cidade}>
                    <input id="cidade" type="text" value={cidade}
                           onChange={(e) => setCidade(e.target.value)} />
                  </Campo>
                </div>
              )}

              <EscolhaUnica
                legenda="A entrada é gratuita?"
                nome="entrada"
                opcoes={ENTRADAS_EVENTO}
                valor={entrada}
                aoMudar={setEntrada}
                obrigatorio
                erro={erros.entrada}
              />

              <Campo
                id="link"
                rotulo="Link do evento"
                obrigatorio
                dica="Onde a pessoa se inscreve ou descobre mais: página, perfil, grupo, formulário. Cola o endereço."
                erro={erros.link}
              >
                <input id="link" type="url" inputMode="url" value={link}
                       placeholder="instagram.com/oevento"
                       onChange={(e) => setLink(e.target.value)} />
              </Campo>

              <GrupoOpcoes
                legenda="Áreas"
                dica="Do que esse evento é feito."
                nome="areas"
                opcoes={AREAS}
                valor={areas}
                aoMudar={setAreas}
                obrigatorio
                erro={erros.areas}
              />

              <GrupoOpcoes
                legenda="Temas"
                dica="Opcional. É o que liga o evento às pessoas que se interessam pelo assunto."
                nome="temas"
                opcoes={TEMAS}
                valor={temas}
                aoMudar={setTemas}
              />

              {falha && <p className="aviso" role="alert">{falha}</p>}

              <div className="acoes">
                <button type="submit" className="botao botao--vermelho botao--bloco-no-celular"
                        disabled={enviando}>
                  <span className="seta" aria-hidden="true" />
                  {enviando ? 'Publicando…' : editando ? 'Salvar' : 'Publicar no mural'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
