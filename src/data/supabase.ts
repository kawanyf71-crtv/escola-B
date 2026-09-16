import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Comentario, Discussao, Evento, Interesse, Participante, Projeto, Tema,
  TipoParticipacao, Uf,
} from '../lib/dominio';
import { fimDaJanela, hoje } from '../lib/datas';
import type {
  ComentarioComAutor, DadosEvento, DadosPerfil, DadosProjeto, DiscussaoCompleta,
  EventoComAutor, FiltrosEventos, FiltrosPessoas, FiltrosProjetos,
  InteresseComParticipante, InteresseComProjeto, LocalDeEventos, NovaDiscussao,
  ParticipanteResumo, ProjetoComAutor, Repositorio, Sessao,
} from './tipos';

const CAMPOS_RESUMO = 'id,nome,ocupacao,cidade,foto';
const PROJETO_COM_AUTOR = `*, autor:participantes!projetos_autor_id_fkey(${CAMPOS_RESUMO})`;
const EVENTO_COM_AUTOR = `*, autor:participantes!eventos_autor_id_fkey(${CAMPOS_RESUMO})`;
const DISCUSSAO_COMPLETA =
  `*, autor:participantes!discussoes_autor_id_fkey(${CAMPOS_RESUMO}),` +
  ' projeto:projetos!discussoes_projeto_origem_id_fkey(id,nome),' +
  ' participacoes_discussao(count)';

/** PostgREST devolve `[{ count: n }]` para agregacoes aninhadas. */
type Contagem = { count: number }[] | null;

function contar(c: Contagem): number {
  return c?.[0]?.count ?? 0;
}

function erro(e: { message: string } | null, contexto: string): void {
  if (e) throw new Error(`${contexto}: ${e.message}`);
}

const SEM_EXEMPLO =
  'O lote de demonstração só existe no modo local. No Supabase cada perfil ' +
  'precisa de um usuário de autenticação de verdade, e perfis fictícios não têm.';

export class RepositorioSupabase implements Repositorio {
  readonly nome = 'supabase' as const;
  readonly suportaExemplo = false;

  async temDadosDeExemplo(): Promise<boolean> { return false; }
  async carregarDadosDeExemplo(): Promise<void> { throw new Error(SEM_EXEMPLO); }
  async apagarDadosDeExemplo(): Promise<void> { throw new Error(SEM_EXEMPLO); }

  constructor(private readonly cliente: SupabaseClient) {}

  // --- Imagens ---

  /**
   * Sobe a imagem para o bucket publico `imagens` e devolve so a URL — o
   * registro nunca carrega os bytes. O bucket e criado pela migracao 0003.
   */
  async enviarImagem(blob: Blob, _dataUrl: string, pasta: 'perfis' | 'projetos'): Promise<string> {
    const usuario = await this.exigirUsuario();
    // O caminho comeca pelo id de quem envia: e o que a politica do Storage usa
    // pra deixar cada pessoa escrever so na propria pasta.
    const caminho = `${pasta}/${usuario}/${crypto.randomUUID()}.jpg`;
    const { error } = await this.cliente.storage
      .from('imagens')
      .upload(caminho, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      throw new Error(
        `Não deu pra enviar a imagem: ${error.message}. ` +
        'Confira se o bucket "imagens" existe — ele é criado pela migração 0003.',
      );
    }
    const { data } = this.cliente.storage.from('imagens').getPublicUrl(caminho);
    return data.publicUrl;
  }

  private async exigirUsuario(): Promise<string> {
    const { data } = await this.cliente.auth.getUser();
    if (!data.user) throw new Error('Entra na sua conta pra fazer isso.');
    return data.user.id;
  }

  // --- Autenticacao ---

  async sessaoAtual(): Promise<Sessao | null> {
    const { data } = await this.cliente.auth.getSession();
    const u = data.session?.user;
    return u ? { usuario_id: u.id, email: u.email ?? '' } : null;
  }

  async criarConta(email: string, senha: string): Promise<Sessao> {
    const { data, error } = await this.cliente.auth.signUp({ email, password: senha });
    erro(error, 'Não deu pra criar a conta');
    if (!data.session || !data.user) {
      throw new Error(
        'Conta criada, mas falta confirmar o e-mail. Desligue a confirmação de e-mail no ' +
        'painel do Supabase (Authentication → Providers → Email) ou confirme pelo link enviado.',
      );
    }
    return { usuario_id: data.user.id, email: data.user.email ?? email };
  }

  async entrar(email: string, senha: string): Promise<Sessao> {
    const { data, error } = await this.cliente.auth.signInWithPassword({
      email, password: senha,
    });
    if (error) throw new Error('E-mail ou senha não conferem.');
    return { usuario_id: data.user.id, email: data.user.email ?? email };
  }

  async sair(): Promise<void> {
    await this.cliente.auth.signOut();
  }

  async excluirConta(): Promise<void> {
    const usuario = await this.exigirUsuario();
    // As demais tabelas caem por `on delete cascade` a partir de participantes.
    const { error } = await this.cliente.from('participantes').delete().eq('id', usuario);
    erro(error, 'Não deu pra apagar a conta');
    await this.cliente.auth.signOut();
  }

  // --- Participantes ---

  async meuPerfil(): Promise<Participante | null> {
    const sessao = await this.sessaoAtual();
    if (!sessao) return null;
    const { data, error } = await this.cliente
      .from('participantes').select('*').eq('id', sessao.usuario_id).maybeSingle();
    erro(error, 'Não deu pra buscar seu perfil');
    return (data as Participante) ?? null;
  }

  async salvarPerfil(dados: DadosPerfil): Promise<Participante> {
    const sessao = await this.sessaoAtual();
    if (!sessao) throw new Error('Entra na sua conta pra fazer isso.');
    const { data, error } = await this.cliente
      .from('participantes')
      .upsert({ id: sessao.usuario_id, email: sessao.email, ...dados })
      .select('*').single();
    erro(error, 'Não deu pra salvar');
    return data as Participante;
  }

  async obterParticipante(id: string): Promise<Participante | null> {
    const { data, error } = await this.cliente
      .from('participantes').select('*').eq('id', id).maybeSingle();
    erro(error, 'Não deu pra buscar o perfil');
    return (data as Participante) ?? null;
  }

  async listarParticipantes(f: FiltrosPessoas): Promise<Participante[]> {
    let q = this.cliente.from('participantes').select('*')
      .order('criado_em', { ascending: false });
    if (f.habilidade) q = q.contains('habilidades_oferecidas', [f.habilidade]);
    if (f.area) q = q.contains('areas', [f.area]);
    if (f.tema) q = q.contains('temas_interesse', [f.tema]);
    if (f.cidade) q = q.ilike('cidade', f.cidade);
    const { data, error } = await q;
    erro(error, 'Não deu pra buscar a turma');
    return (data ?? []) as Participante[];
  }

  async cidadesConhecidas(): Promise<string[]> {
    const [pessoas, projetos] = await Promise.all([
      this.cliente.from('participantes').select('cidade'),
      this.cliente.from('projetos').select('onde_cidade').eq('estado', 'publicado'),
    ]);
    erro(pessoas.error, 'Não deu pra buscar as cidades');
    erro(projetos.error, 'Não deu pra buscar as cidades');
    const cidades = new Set<string>();
    (pessoas.data ?? []).forEach((r) => {
      const c = (r as { cidade: string | null }).cidade?.trim();
      if (c) cidades.add(c);
    });
    (projetos.data ?? []).forEach((r) => {
      const c = (r as { onde_cidade: string | null }).onde_cidade?.trim();
      if (c) cidades.add(c);
    });
    return [...cidades].sort((a, z) => a.localeCompare(z, 'pt-BR'));
  }

  // --- Projetos ---

  async listarProjetos(f: FiltrosProjetos): Promise<ProjetoComAutor[]> {
    let q = this.cliente.from('projetos').select(PROJETO_COM_AUTOR)
      .eq('estado', 'publicado').order('criado_em', { ascending: false });
    if (f.area) q = q.contains('areas', [f.area]);
    if (f.estagio) q = q.eq('estagio', f.estagio);
    if (f.tema) q = q.contains('temas', [f.tema]);
    if (f.conhecimento) q = q.contains('conhecimentos_procurados', [f.conhecimento]);
    if (f.cidade) q = q.ilike('onde_cidade', f.cidade);
    const { data, error } = await q;
    erro(error, 'Não deu pra buscar os projetos');
    return (data ?? []) as unknown as ProjetoComAutor[];
  }

  async obterProjeto(id: string): Promise<ProjetoComAutor | null> {
    const { data, error } = await this.cliente
      .from('projetos').select(PROJETO_COM_AUTOR).eq('id', id).maybeSingle();
    erro(error, 'Não deu pra buscar o projeto');
    return (data as unknown as ProjetoComAutor) ?? null;
  }

  async projetosDoParticipante(participanteId: string): Promise<ProjetoComAutor[]> {
    const { data, error } = await this.cliente
      .from('projetos').select(PROJETO_COM_AUTOR)
      .eq('autor_id', participanteId).order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar os projetos');
    return (data ?? []) as unknown as ProjetoComAutor[];
  }

  async criarProjeto(dados: DadosProjeto, discussao: NovaDiscussao | null): Promise<Projeto> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente
      .from('projetos').insert({ autor_id: usuario, ...dados }).select('*').single();
    erro(error, 'Não deu pra publicar');
    const projeto = data as Projeto;
    if (discussao) {
      await this.criarDiscussao(discussao, projeto.id);
    }
    return projeto;
  }

  async atualizarProjeto(id: string, dados: DadosProjeto): Promise<Projeto> {
    const { data, error } = await this.cliente
      .from('projetos').update(dados).eq('id', id).select('*').single();
    erro(error, 'Não deu pra salvar');
    return data as Projeto;
  }

  async definirEstadoProjeto(id: string, estado: Projeto['estado']): Promise<void> {
    const { error } = await this.cliente.from('projetos').update({ estado }).eq('id', id);
    erro(error, 'Não deu pra mudar o projeto');
  }

  // --- Interesses ---

  async manifestarInteresse(
    projetoId: string, tipo: TipoParticipacao, mensagem: string,
  ): Promise<Interesse> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente.from('interesses').insert({
      projeto_id: projetoId, participante_id: usuario,
      tipo_participacao: tipo, mensagem,
    }).select('*').single();
    if (error) {
      // RN-008 é garantida pela unique constraint do banco.
      if (error.code === '23505') throw new Error('Você já chegou junto neste projeto.');
      throw new Error(`Não deu pra registrar: ${error.message}`);
    }
    return data as Interesse;
  }

  async cancelarInteresse(projetoId: string): Promise<void> {
    const usuario = await this.exigirUsuario();
    const { error } = await this.cliente.from('interesses').delete()
      .eq('projeto_id', projetoId).eq('participante_id', usuario);
    erro(error, 'Não deu pra cancelar');
  }

  async meuInteresseNoProjeto(projetoId: string): Promise<Interesse | null> {
    const sessao = await this.sessaoAtual();
    if (!sessao) return null;
    const { data, error } = await this.cliente.from('interesses').select('*')
      .eq('projeto_id', projetoId).eq('participante_id', sessao.usuario_id).maybeSingle();
    erro(error, 'Não deu pra conferir');
    return (data as Interesse) ?? null;
  }

  async interessadosNoProjeto(projetoId: string): Promise<InteresseComParticipante[]> {
    const { data, error } = await this.cliente.from('interesses')
      .select(`*, participante:participantes!interesses_participante_id_fkey(*)`)
      .eq('projeto_id', projetoId).order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar quem chegou junto');
    return (data ?? []) as unknown as InteresseComParticipante[];
  }

  async meusInteresses(): Promise<InteresseComProjeto[]> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente.from('interesses')
      .select(`*, projeto:projetos!interesses_projeto_id_fkey(${PROJETO_COM_AUTOR})`)
      .eq('participante_id', usuario).order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar onde você chegou junto');
    return (data ?? []) as unknown as InteresseComProjeto[];
  }

  // --- Discussoes ---

  private mapear(linha: Record<string, unknown>): DiscussaoCompleta {
    const { participacoes_discussao, ...resto } = linha;
    return {
      ...(resto as Omit<DiscussaoCompleta, 'total_participantes'>),
      total_participantes: contar(participacoes_discussao as Contagem),
    };
  }

  async listarDiscussoes(tema?: Tema | ''): Promise<DiscussaoCompleta[]> {
    let q = this.cliente.from('discussoes').select(DISCUSSAO_COMPLETA)
      .order('criado_em', { ascending: false });
    if (tema) q = q.eq('tema', tema);
    const { data, error } = await q;
    erro(error, 'Não deu pra buscar os assuntos');
    return (data ?? []).map((d) => this.mapear(d as unknown as Record<string, unknown>));
  }

  async discussoesDoProjeto(projetoId: string): Promise<DiscussaoCompleta[]> {
    const { data, error } = await this.cliente.from('discussoes').select(DISCUSSAO_COMPLETA)
      .eq('projeto_origem_id', projetoId).order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar os assuntos do projeto');
    return (data ?? []).map((d) => this.mapear(d as unknown as Record<string, unknown>));
  }

  async discussoesDoParticipante(participanteId: string): Promise<DiscussaoCompleta[]> {
    const [participando, autoradas] = await Promise.all([
      this.cliente.from('participacoes_discussao')
        .select(`discussao:discussoes!participacoes_discussao_discussao_id_fkey(${DISCUSSAO_COMPLETA})`)
        .eq('participante_id', participanteId),
      this.cliente.from('discussoes').select(DISCUSSAO_COMPLETA).eq('autor_id', participanteId),
    ]);
    erro(participando.error, 'Não deu pra buscar os assuntos');
    erro(autoradas.error, 'Não deu pra buscar os assuntos');
    const porId = new Map<string, DiscussaoCompleta>();
    (participando.data ?? []).forEach((linha) => {
      const d = (linha as unknown as { discussao: Record<string, unknown> | null }).discussao;
      if (d) porId.set(d.id as string, this.mapear(d));
    });
    (autoradas.data ?? []).forEach((linha) => {
      const d = this.mapear(linha as unknown as Record<string, unknown>);
      porId.set(d.id, d);
    });
    return [...porId.values()].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }

  async obterDiscussao(id: string): Promise<DiscussaoCompleta | null> {
    const { data, error } = await this.cliente.from('discussoes')
      .select(DISCUSSAO_COMPLETA).eq('id', id).maybeSingle();
    erro(error, 'Não deu pra buscar o assunto');
    return data ? this.mapear(data as unknown as Record<string, unknown>) : null;
  }

  async criarDiscussao(dados: NovaDiscussao, projetoId: string | null): Promise<Discussao> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente.from('discussoes')
      .insert({ ...dados, projeto_origem_id: projetoId, autor_id: usuario })
      .select('*').single();
    erro(error, 'Não deu pra puxar o assunto');
    const discussao = data as Discussao;
    await this.entrarNaDiscussao(discussao.id);
    return discussao;
  }

  async excluirDiscussao(id: string): Promise<void> {
    const { error } = await this.cliente.from('discussoes').delete().eq('id', id);
    erro(error, 'Não deu pra apagar');
  }

  async participantesDaDiscussao(discussaoId: string): Promise<ParticipanteResumo[]> {
    const { data, error } = await this.cliente.from('participacoes_discussao')
      .select(`participante:participantes!participacoes_discussao_participante_id_fkey(${CAMPOS_RESUMO})`)
      .eq('discussao_id', discussaoId).order('criado_em', { ascending: true });
    erro(error, 'Não deu pra buscar quem tá na conversa');
    return (data ?? [])
      .map((l) => (l as unknown as { participante: ParticipanteResumo | null }).participante)
      .filter((p): p is ParticipanteResumo => p !== null);
  }

  async entrarNaDiscussao(discussaoId: string): Promise<void> {
    const usuario = await this.exigirUsuario();
    const { error } = await this.cliente.from('participacoes_discussao')
      .upsert(
        { discussao_id: discussaoId, participante_id: usuario },
        { onConflict: 'discussao_id,participante_id', ignoreDuplicates: true },
      );
    erro(error, 'Não deu pra entrar na conversa');
  }

  async comentarios(discussaoId: string): Promise<ComentarioComAutor[]> {
    const { data, error } = await this.cliente.from('comentarios')
      .select(`*, autor:participantes!comentarios_autor_id_fkey(${CAMPOS_RESUMO})`)
      .eq('discussao_id', discussaoId).order('criado_em', { ascending: true });
    erro(error, 'Não deu pra buscar a conversa');
    return (data ?? []) as unknown as ComentarioComAutor[];
  }

  async comentar(discussaoId: string, texto: string): Promise<Comentario> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente.from('comentarios')
      .insert({ discussao_id: discussaoId, autor_id: usuario, texto })
      .select('*').single();
    erro(error, 'Não deu pra mandar');
    await this.entrarNaDiscussao(discussaoId);
    return data as Comentario;
  }

  // --- Eventos ---

  /**
   * "Já rolou" é uma comparação sobre o último dia do evento — `data_fim`
   * quando existe, `data_inicio` quando não. Em SQL isso é
   * `coalesce(data_fim, data_inicio)`, e o filtro vai numa coluna gerada
   * (`ultimo_dia`) porque PostgREST não compara duas colunas entre si.
   */
  private eventosFuturos(passados: boolean) {
    const q = this.cliente.from('eventos').select(EVENTO_COM_AUTOR);
    return passados
      ? q.lt('ultimo_dia', hoje()).order('data_inicio', { ascending: false })
      : q.gte('ultimo_dia', hoje()).order('data_inicio', { ascending: true });
  }

  async listarEventos(f: FiltrosEventos): Promise<EventoComAutor[]> {
    let q = this.eventosFuturos(Boolean(f.passados));
    if (f.estado) q = q.eq('estado', f.estado);
    if (f.cidade) q = q.ilike('cidade', f.cidade);
    if (f.area) q = q.contains('areas', [f.area]);
    if (f.tema) q = q.contains('temas', [f.tema]);
    if (f.entrada) q = q.eq('entrada', f.entrada);
    // A janela olha o COMEÇO: uma temporada que já abriu conta como
    // acontecendo nesta semana, mesmo terminando daqui a três meses.
    if (f.janela) q = q.lte('data_inicio', fimDaJanela(f.janela));
    const { data, error } = await q;
    erro(error, 'Não deu pra buscar os eventos');
    return (data ?? []) as unknown as EventoComAutor[];
  }

  async obterEvento(id: string): Promise<EventoComAutor | null> {
    const { data, error } = await this.cliente
      .from('eventos').select(EVENTO_COM_AUTOR).eq('id', id).maybeSingle();
    erro(error, 'Não deu pra buscar o evento');
    return (data as unknown as EventoComAutor) ?? null;
  }

  async eventosDoParticipante(participanteId: string): Promise<EventoComAutor[]> {
    const { data, error } = await this.eventosFuturos(false).eq('autor_id', participanteId);
    erro(error, 'Não deu pra buscar os eventos');
    return (data ?? []) as unknown as EventoComAutor[];
  }

  async meusEventos(): Promise<EventoComAutor[]> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente.from('eventos').select(EVENTO_COM_AUTOR)
      .eq('autor_id', usuario).order('data_inicio', { ascending: true });
    erro(error, 'Não deu pra buscar os seus eventos');
    return (data ?? []) as unknown as EventoComAutor[];
  }

  async criarEvento(dados: DadosEvento): Promise<Evento> {
    const usuario = await this.exigirUsuario();
    const { data, error } = await this.cliente
      .from('eventos').insert({ autor_id: usuario, ...dados }).select('*').single();
    erro(error, 'Não deu pra publicar no mural');
    return data as Evento;
  }

  async atualizarEvento(id: string, dados: DadosEvento): Promise<Evento> {
    const { data, error } = await this.cliente
      .from('eventos').update(dados).eq('id', id).select('*').single();
    erro(error, 'Não deu pra salvar o evento');
    return data as Evento;
  }

  async excluirEvento(id: string): Promise<void> {
    const { error } = await this.cliente.from('eventos').delete().eq('id', id);
    erro(error, 'Não deu pra apagar o evento');
  }

  async locaisDeEventos(): Promise<LocalDeEventos[]> {
    // Só o que está por vir: filtrar por um estado sem evento futuro devolveria
    // uma lista vazia e pareceria defeito.
    const { data, error } = await this.cliente.from('eventos').select('estado,cidade')
      .gte('ultimo_dia', hoje()).not('estado', 'is', null);
    erro(error, 'Não deu pra buscar os lugares');
    const porEstado = new Map<Uf, Set<string>>();
    for (const linha of (data ?? []) as { estado: Uf | null; cidade: string | null }[]) {
      if (!linha.estado) continue;
      const cidades = porEstado.get(linha.estado) ?? new Set<string>();
      if (linha.cidade) cidades.add(linha.cidade);
      porEstado.set(linha.estado, cidades);
    }
    return [...porEstado]
      .map(([estado, cidades]) => ({
        estado,
        cidades: [...cidades].sort((a, z) => a.localeCompare(z, 'pt-BR')),
      }))
      .sort((a, z) => a.estado.localeCompare(z.estado));
  }

  // --- Tema ---

  async eventosPorTema(tema: Tema): Promise<EventoComAutor[]> {
    const { data, error } = await this.eventosFuturos(false).contains('temas', [tema]);
    erro(error, 'Não deu pra buscar os eventos deste tema');
    return (data ?? []) as unknown as EventoComAutor[];
  }

  async participantesPorTema(tema: Tema): Promise<Participante[]> {
    const { data, error } = await this.cliente.from('participantes').select('*')
      .contains('temas_interesse', [tema]).order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar quem se move por isso');
    return (data ?? []) as Participante[];
  }

  async projetosPorTema(tema: Tema): Promise<ProjetoComAutor[]> {
    const { data, error } = await this.cliente.from('projetos').select(PROJETO_COM_AUTOR)
      .eq('estado', 'publicado').contains('temas', [tema])
      .order('criado_em', { ascending: false });
    erro(error, 'Não deu pra buscar os projetos deste tema');
    return (data ?? []) as unknown as ProjetoComAutor[];
  }
}

export function criarClienteSupabase(url: string, chave: string): SupabaseClient {
  return createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
