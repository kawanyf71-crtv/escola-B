import type {
  Comentario, Discussao, Evento, Interesse, Participante, PerfilSuspenso, Projeto,
  Tema, TipoParticipacao, Uf,
} from '../lib/dominio';
import { fimDaJanela, jaRolou } from '../lib/datas';
import type {
  ComentarioComAutor, DadosEvento, DadosPerfil, DadosProjeto, DiscussaoCompleta,
  EventoComAutor, FiltrosEventos, FiltrosPessoas, FiltrosProjetos,
  InteresseComParticipante, InteresseComProjeto, LocalDeEventos, NovaDiscussao,
  ParticipanteResumo, ProjetoComAutor, Repositorio, Sessao,
} from './tipos';
import {
  COMENTARIOS_EXEMPLO, DISCUSSOES_EXEMPLO, EVENTOS_EXEMPLO, INTERESSES_EXEMPLO,
  PARTICIPACOES_EXEMPLO, PARTICIPANTES_EXEMPLO, PROJETOS_EXEMPLO,
} from './exemplo';
import { REDES_DA_TURMA, chaveDaRede } from './redes';

// Nao renomear junto com o produto: e a chave onde os dados ja gravados moram.
// Trocar aqui faria todo mundo perder perfil, projeto e conversa.
const CHAVE = 'rede-escola-b/v1';

interface Conta { id: string; email: string; senha_hash: string }

interface Banco {
  contas: Conta[];
  participantes: Participante[];
  projetos: Projeto[];
  discussoes: Discussao[];
  comentarios: Comentario[];
  participacoes: {
    discussao_id: string; participante_id: string; criado_em: string; demo?: boolean;
  }[];
  interesses: Interesse[];
  eventos: Evento[];
  perfis_suspensos: PerfilSuspenso[];
  sessao: Sessao | null;
}

const vazio = (): Banco => ({
  contas: [], participantes: [], projetos: [], discussoes: [],
  comentarios: [], participacoes: [], interesses: [], eventos: [],
  perfis_suspensos: [], sessao: null,
});

function ler(): Banco {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return vazio();
    return { ...vazio(), ...(JSON.parse(bruto) as Partial<Banco>) };
  } catch {
    return vazio();
  }
}

/** A cota estourada tem nome proprio em cada navegador; todos caem aqui. */
function ehCotaEstourada(e: unknown): boolean {
  if (!(e instanceof DOMException)) return false;
  return e.name === 'QuotaExceededError'
    || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || e.code === 22 || e.code === 1014;
}

function gravar(b: Banco): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(b));
  } catch (e) {
    // Cota estourada e quase sempre imagem: e o unico dado grande que entra
    // aqui. Vale dizer isso em vez de falar de armazenamento bloqueado.
    if (ehCotaEstourada(e)) {
      throw new Error(
        'Não deu pra guardar a imagem — ela ficou grande demais. Tenta uma foto menor.',
      );
    }
    // Navegacao privada no iOS ou dados do site bloqueados. Sem localStorage
    // este adaptador nao tem onde guardar nada, entao e melhor dizer isso do
    // que deixar a tela falhar com um erro sem sentido.
    throw new Error(
      'Seu navegador tá bloqueando o armazenamento do site, e é ali que esta ' +
      'demonstração guarda tudo. Sai da aba anônima ou libera os dados do site ' +
      'e tenta de novo.',
    );
  }
}

function id(): string {
  return crypto.randomUUID();
}

function agora(): string {
  return new Date().toISOString();
}

/**
 * Hash de senha do adaptador LOCAL. Este adaptador e para desenvolvimento e
 * demonstracao: os dados vivem no navegador de quem abre o site e nao ha
 * servidor. Em producao quem autentica e o Supabase (`src/data/supabase.ts`).
 */
async function hash(senha: string): Promise<string> {
  // O sal tambem fica: trocar invalidaria a senha de quem ja tem conta.
  const bytes = new TextEncoder().encode(`rede-escola-b:${senha}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cidade e escolhida numa lista montada a partir do que ja foi cadastrado,
 * entao a comparacao e exata, so ignorando caixa e espaco em volta — o mesmo
 * criterio do `ilike` usado no adaptador Supabase.
 */
function mesmaCidade(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function resumo(p: Participante | undefined): ParticipanteResumo | null {
  if (!p) return null;
  return { id: p.id, nome: p.nome, ocupacao: p.ocupacao, cidade: p.cidade, foto: p.foto };
}

/**
 * O mural ordena por quando o evento acontece, nao por quando foi publicado: o
 * que vem antes aparece antes. Nos passados a ordem inverte — o que acabou de
 * acontecer interessa mais do que o de um ano atras.
 */
function ordenarPorData<T extends { data_inicio: string }>(itens: T[], invertido: boolean): T[] {
  return [...itens].sort((a, z) => (invertido
    ? z.data_inicio.localeCompare(a.data_inicio)
    : a.data_inicio.localeCompare(z.data_inicio)));
}

function maisRecentePrimeiro<T extends { criado_em: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

/**
 * Semeia a lista de @ da turma, uma vez. O que já está gravado manda: quem foi
 * reivindicado continua reivindicado, quem pediu pra sair continua fora, e
 * registro novo no arquivo entra sem mexer em nada do que já existe.
 *
 * A comparação é pelo primeiro handle (ou pelo nome, nos dois registros que
 * chegaram sem @ nenhum) e não pelo id: o id nasce aqui, e nasceria diferente
 * a cada vez.
 */
function semearRedes(b: Banco): boolean {
  const jaTem = new Set(b.perfis_suspensos.map((p) => chaveDaRede(p)));
  const faltando = REDES_DA_TURMA.filter((r) => !jaTem.has(chaveDaRede(r)));
  if (faltando.length === 0) return false;
  b.perfis_suspensos.push(...faltando.map((r) => ({
    ...r, id: id(), reivindicado_por: null, removido: false,
  })));
  return true;
}

export class RepositorioLocal implements Repositorio {
  readonly nome = 'local' as const;
  readonly suportaExemplo = true;

  // --- Imagens ---

  /**
   * Sem servidor, a imagem ja comprimida vira a propria data URL do registro.
   * E o que a cota do localStorage aguenta — dai a compressao ser obrigatoria
   * antes de chegar aqui.
   */
  async enviarImagem(_blob: Blob, dataUrl: string): Promise<string> {
    return dataUrl;
  }

  // --- Lote de demonstracao ---

  async temDadosDeExemplo(): Promise<boolean> {
    return ler().participantes.some((p) => p.demo);
  }

  /** Recarregavel: apaga o lote anterior antes de gravar o novo. */
  async carregarDadosDeExemplo(): Promise<void> {
    await this.apagarDadosDeExemplo();
    const b = ler();
    b.participantes.push(...PARTICIPANTES_EXEMPLO);
    b.projetos.push(...PROJETOS_EXEMPLO);
    b.discussoes.push(...DISCUSSOES_EXEMPLO);
    b.comentarios.push(...COMENTARIOS_EXEMPLO);
    b.interesses.push(...INTERESSES_EXEMPLO);
    b.participacoes.push(...PARTICIPACOES_EXEMPLO);
    b.eventos.push(...EVENTOS_EXEMPLO);
    // Nenhuma conta e criada: as pessoas do lote nao conseguem entrar.
    gravar(b);
  }

  /**
   * Remove tudo que tem `demo: true` e mais nada. O que a pessoa criou de
   * verdade fica intacto, inclusive um interesse dela num projeto do lote ou um
   * comentario dela numa conversa do lote — esses caem junto porque o registro
   * pai some, e nao porque foram marcados.
   */
  async apagarDadosDeExemplo(): Promise<void> {
    const b = ler();
    const pessoas = new Set(b.participantes.filter((p) => p.demo).map((p) => p.id));
    const projetos = new Set(b.projetos.filter((p) => p.demo).map((p) => p.id));
    const discussoes = new Set(b.discussoes.filter((d) => d.demo).map((d) => d.id));

    b.comentarios = b.comentarios.filter(
      (c) => !c.demo && !discussoes.has(c.discussao_id) && !pessoas.has(c.autor_id),
    );
    b.participacoes = b.participacoes.filter(
      (x) => !x.demo && !discussoes.has(x.discussao_id) && !pessoas.has(x.participante_id),
    );
    b.interesses = b.interesses.filter(
      (i) => !i.demo && !projetos.has(i.projeto_id) && !pessoas.has(i.participante_id),
    );
    b.discussoes = b.discussoes.filter(
      (d) => !d.demo && !pessoas.has(d.autor_id)
        && !(d.projeto_origem_id !== null && projetos.has(d.projeto_origem_id)),
    );
    b.eventos = b.eventos.filter((e) => !e.demo && !pessoas.has(e.autor_id));
    b.projetos = b.projetos.filter((p) => !p.demo && !pessoas.has(p.autor_id));
    b.participantes = b.participantes.filter((p) => !p.demo);
    gravar(b);
  }

  private exigirSessao(b: Banco): Sessao {
    if (!b.sessao) throw new Error('Entra na sua conta pra fazer isso.');
    return b.sessao;
  }

  private comAutor(b: Banco, p: Projeto): ProjetoComAutor {
    return { ...p, autor: resumo(b.participantes.find((x) => x.id === p.autor_id)) };
  }

  private comAutorEvento(b: Banco, e: Evento): EventoComAutor {
    return { ...e, autor: resumo(b.participantes.find((x) => x.id === e.autor_id)) };
  }

  private completarDiscussao(b: Banco, d: Discussao): DiscussaoCompleta {
    const projeto = d.projeto_origem_id
      ? b.projetos.find((p) => p.id === d.projeto_origem_id)
      : undefined;
    return {
      ...d,
      autor: resumo(b.participantes.find((x) => x.id === d.autor_id)),
      projeto: projeto ? { id: projeto.id, nome: projeto.nome } : null,
      total_participantes: b.participacoes.filter((x) => x.discussao_id === d.id).length,
    };
  }

  // --- Autenticacao ---

  async sessaoAtual(): Promise<Sessao | null> {
    return ler().sessao;
  }

  async criarConta(email: string, senha: string): Promise<Sessao> {
    const b = ler();
    const limpo = email.trim().toLowerCase();
    if (b.contas.some((c) => c.email === limpo)) {
      throw new Error('Já tem uma conta com esse e-mail. Tenta entrar.');
    }
    const conta: Conta = { id: id(), email: limpo, senha_hash: await hash(senha) };
    b.contas.push(conta);
    b.sessao = { usuario_id: conta.id, email: conta.email };
    gravar(b);
    return b.sessao;
  }

  async entrar(email: string, senha: string): Promise<Sessao> {
    const b = ler();
    const limpo = email.trim().toLowerCase();
    const conta = b.contas.find((c) => c.email === limpo);
    if (!conta || conta.senha_hash !== (await hash(senha))) {
      throw new Error('E-mail ou senha não conferem.');
    }
    b.sessao = { usuario_id: conta.id, email: conta.email };
    gravar(b);
    return b.sessao;
  }

  async sair(): Promise<void> {
    const b = ler();
    b.sessao = null;
    gravar(b);
  }

  async excluirConta(): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    const meusProjetos = new Set(
      b.projetos.filter((p) => p.autor_id === s.usuario_id).map((p) => p.id),
    );
    const minhasDiscussoes = new Set(
      b.discussoes
        .filter((d) => d.autor_id === s.usuario_id
          || (d.projeto_origem_id !== null && meusProjetos.has(d.projeto_origem_id)))
        .map((d) => d.id),
    );
    b.comentarios = b.comentarios.filter(
      (c) => c.autor_id !== s.usuario_id && !minhasDiscussoes.has(c.discussao_id),
    );
    b.participacoes = b.participacoes.filter(
      (x) => x.participante_id !== s.usuario_id && !minhasDiscussoes.has(x.discussao_id),
    );
    b.discussoes = b.discussoes.filter((d) => !minhasDiscussoes.has(d.id));
    b.interesses = b.interesses.filter(
      (i) => i.participante_id !== s.usuario_id && !meusProjetos.has(i.projeto_id),
    );
    b.projetos = b.projetos.filter((p) => p.autor_id !== s.usuario_id);
    b.participantes = b.participantes.filter((p) => p.id !== s.usuario_id);
    b.contas = b.contas.filter((c) => c.id !== s.usuario_id);
    b.sessao = null;
    gravar(b);
  }

  // --- Participantes ---

  async meuPerfil(): Promise<Participante | null> {
    const b = ler();
    if (!b.sessao) return null;
    return b.participantes.find((p) => p.id === b.sessao!.usuario_id) ?? null;
  }

  async salvarPerfil(dados: DadosPerfil): Promise<Participante> {
    const b = ler();
    const s = this.exigirSessao(b);
    const indice = b.participantes.findIndex((p) => p.id === s.usuario_id);
    const perfil: Participante = {
      id: s.usuario_id,
      email: s.email,
      criado_em: indice >= 0 ? b.participantes[indice].criado_em : agora(),
      ...dados,
    };
    if (indice >= 0) b.participantes[indice] = perfil;
    else b.participantes.push(perfil);
    gravar(b);
    return perfil;
  }

  async obterParticipante(pid: string): Promise<Participante | null> {
    return ler().participantes.find((p) => p.id === pid) ?? null;
  }

  async listarParticipantes(f: FiltrosPessoas): Promise<Participante[]> {
    return maisRecentePrimeiro(
      ler().participantes.filter((p) => {
        if (f.habilidade && !p.habilidades_oferecidas.includes(f.habilidade)) return false;
        if (f.area && !p.areas.includes(f.area)) return false;
        if (f.tema && !p.temas_interesse.includes(f.tema)) return false;
        if (f.cidade && !mesmaCidade(p.cidade, f.cidade)) return false;
        return true;
      }),
    );
  }

  async cidadesConhecidas(): Promise<string[]> {
    const b = ler();
    const cidades = new Set<string>();
    b.participantes.forEach((p) => p.cidade && cidades.add(p.cidade.trim()));
    b.projetos.forEach((p) => p.onde_cidade && cidades.add(p.onde_cidade.trim()));
    return [...cidades].sort((a, z) => a.localeCompare(z, 'pt-BR'));
  }

  // --- Projetos ---

  async listarProjetos(f: FiltrosProjetos): Promise<ProjetoComAutor[]> {
    const b = ler();
    const encontrados = b.projetos.filter((p) => {
      if (p.estado !== 'publicado') return false;
      if (f.area && !p.areas.includes(f.area)) return false;
      if (f.estagio && p.estagio !== f.estagio) return false;
      if (f.tema && !p.temas.includes(f.tema)) return false;
      if (f.conhecimento && !p.conhecimentos_procurados.includes(f.conhecimento)) return false;
      if (f.cidade && !mesmaCidade(p.onde_cidade ?? '', f.cidade)) return false;
      return true;
    });
    return maisRecentePrimeiro(encontrados).map((p) => this.comAutor(b, p));
  }

  async obterProjeto(pid: string): Promise<ProjetoComAutor | null> {
    const b = ler();
    const p = b.projetos.find((x) => x.id === pid);
    return p ? this.comAutor(b, p) : null;
  }

  async projetosDoParticipante(participanteId: string): Promise<ProjetoComAutor[]> {
    const b = ler();
    const meus = b.projetos.filter((p) => p.autor_id === participanteId);
    return maisRecentePrimeiro(meus).map((p) => this.comAutor(b, p));
  }

  async criarProjeto(dados: DadosProjeto, discussao: NovaDiscussao | null): Promise<Projeto> {
    const b = ler();
    const s = this.exigirSessao(b);
    const projeto: Projeto = { id: id(), autor_id: s.usuario_id, criado_em: agora(), ...dados };
    b.projetos.push(projeto);
    if (discussao) {
      const nova: Discussao = {
        id: id(), ...discussao, projeto_origem_id: projeto.id,
        autor_id: s.usuario_id, criado_em: agora(),
      };
      b.discussoes.push(nova);
      b.participacoes.push({
        discussao_id: nova.id, participante_id: s.usuario_id, criado_em: agora(),
      });
    }
    gravar(b);
    return projeto;
  }

  async atualizarProjeto(pid: string, dados: DadosProjeto): Promise<Projeto> {
    const b = ler();
    const s = this.exigirSessao(b);
    const indice = b.projetos.findIndex((p) => p.id === pid);
    if (indice < 0) throw new Error('Esse projeto não existe mais.');
    if (b.projetos[indice].autor_id !== s.usuario_id) {
      throw new Error('Só quem publicou pode mexer nele.');
    }
    const atualizado: Projeto = { ...b.projetos[indice], ...dados };
    b.projetos[indice] = atualizado;
    gravar(b);
    return atualizado;
  }

  async definirEstadoProjeto(pid: string, estado: Projeto['estado']): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    const projeto = b.projetos.find((p) => p.id === pid);
    if (!projeto) throw new Error('Esse projeto não existe mais.');
    if (projeto.autor_id !== s.usuario_id) {
      throw new Error('Só quem publicou pode mexer nele.');
    }
    projeto.estado = estado;
    gravar(b);
  }

  // --- Interesses ---

  async manifestarInteresse(
    projetoId: string, tipo: TipoParticipacao, mensagem: string,
  ): Promise<Interesse> {
    const b = ler();
    const s = this.exigirSessao(b);
    const projeto = b.projetos.find((p) => p.id === projetoId);
    if (!projeto) throw new Error('Esse projeto não existe mais.');
    if (!projeto.busca_pessoas) throw new Error('Este projeto não tá procurando gente agora.');
    if (projeto.autor_id === s.usuario_id) {
      throw new Error('Esse projeto é seu — quem chega junto são os outros.');
    }
    // RN-008: um interesse por par pessoa/projeto.
    if (b.interesses.some((i) => i.projeto_id === projetoId && i.participante_id === s.usuario_id)) {
      throw new Error('Você já chegou junto neste projeto.');
    }
    const interesse: Interesse = {
      id: id(), projeto_id: projetoId, participante_id: s.usuario_id,
      tipo_participacao: tipo, mensagem, estado: 'enviado', criado_em: agora(),
    };
    b.interesses.push(interesse);
    gravar(b);
    return interesse;
  }

  async cancelarInteresse(projetoId: string): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    b.interesses = b.interesses.filter(
      (i) => !(i.projeto_id === projetoId && i.participante_id === s.usuario_id),
    );
    gravar(b);
  }

  async meuInteresseNoProjeto(projetoId: string): Promise<Interesse | null> {
    const b = ler();
    if (!b.sessao) return null;
    return b.interesses.find(
      (i) => i.projeto_id === projetoId && i.participante_id === b.sessao!.usuario_id,
    ) ?? null;
  }

  async interessadosNoProjeto(projetoId: string): Promise<InteresseComParticipante[]> {
    const b = ler();
    const s = this.exigirSessao(b);
    const projeto = b.projetos.find((p) => p.id === projetoId);
    // Projeto do lote de demonstracao e visitavel por quem estiver logado: ele
    // pertence a um perfil ficticio que ninguem consegue acessar, e sem esta
    // brecha a tela de quem chegou junto ficaria impossivel de avaliar. Vale so
    // no adaptador local — no Supabase a politica de RLS continua exigindo que
    // quem le seja a autora do projeto, e o lote nem existe la.
    const podeVer = projeto?.demo === true || projeto?.autor_id === s.usuario_id;
    if (!projeto || !podeVer) {
      throw new Error('Só quem publicou vê quem chegou junto.');
    }
    return maisRecentePrimeiro(b.interesses.filter((i) => i.projeto_id === projetoId)).map((i) => ({
      ...i,
      participante: b.participantes.find((p) => p.id === i.participante_id) ?? null,
    }));
  }

  async meusInteresses(): Promise<InteresseComProjeto[]> {
    const b = ler();
    const s = this.exigirSessao(b);
    const meus = b.interesses.filter((i) => i.participante_id === s.usuario_id);
    return maisRecentePrimeiro(meus).map((i) => {
      const projeto = b.projetos.find((p) => p.id === i.projeto_id);
      return { ...i, projeto: projeto ? this.comAutor(b, projeto) : null };
    });
  }

  // --- Discussoes ---

  async listarDiscussoes(tema?: Tema | ''): Promise<DiscussaoCompleta[]> {
    const b = ler();
    const publicados = new Set(
      b.projetos.filter((p) => p.estado === 'publicado').map((p) => p.id),
    );
    // Assunto solto sempre aparece. Assunto ligado a um projeto so aparece se o
    // projeto estiver publicado — senao o link levaria a uma pagina invisivel.
    const visivel = (d: Discussao) =>
      d.projeto_origem_id === null || publicados.has(d.projeto_origem_id);
    const encontradas = b.discussoes.filter(
      (d) => visivel(d) && (!tema || d.tema === tema),
    );
    return maisRecentePrimeiro(encontradas).map((d) => this.completarDiscussao(b, d));
  }

  async discussoesDoProjeto(projetoId: string): Promise<DiscussaoCompleta[]> {
    const b = ler();
    const encontradas = b.discussoes.filter((d) => d.projeto_origem_id === projetoId);
    return maisRecentePrimeiro(encontradas).map((d) => this.completarDiscussao(b, d));
  }

  async discussoesDoParticipante(participanteId: string): Promise<DiscussaoCompleta[]> {
    const b = ler();
    const ids = new Set(
      b.participacoes.filter((x) => x.participante_id === participanteId)
        .map((x) => x.discussao_id),
    );
    b.discussoes.forEach((d) => { if (d.autor_id === participanteId) ids.add(d.id); });
    const encontradas = b.discussoes.filter((d) => ids.has(d.id));
    return maisRecentePrimeiro(encontradas).map((d) => this.completarDiscussao(b, d));
  }

  async obterDiscussao(did: string): Promise<DiscussaoCompleta | null> {
    const b = ler();
    const d = b.discussoes.find((x) => x.id === did);
    return d ? this.completarDiscussao(b, d) : null;
  }

  async criarDiscussao(dados: NovaDiscussao, projetoId: string | null): Promise<Discussao> {
    const b = ler();
    const s = this.exigirSessao(b);
    // Ligar a um projeto e opcional; quando acontece, so vale se o projeto for
    // de quem esta puxando o assunto.
    if (projetoId !== null) {
      const projeto = b.projetos.find((p) => p.id === projetoId);
      if (!projeto) throw new Error('Esse projeto não existe mais.');
      if (projeto.autor_id !== s.usuario_id) {
        throw new Error('Só dá pra ligar o assunto a um projeto seu.');
      }
    }
    const nova: Discussao = {
      id: id(), ...dados, projeto_origem_id: projetoId,
      autor_id: s.usuario_id, criado_em: agora(),
    };
    b.discussoes.push(nova);
    b.participacoes.push({
      discussao_id: nova.id, participante_id: s.usuario_id, criado_em: agora(),
    });
    gravar(b);
    return nova;
  }

  async excluirDiscussao(did: string): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    const d = b.discussoes.find((x) => x.id === did);
    if (!d) return;
    if (d.autor_id !== s.usuario_id) throw new Error('Só quem abriu pode apagar.');
    b.discussoes = b.discussoes.filter((x) => x.id !== did);
    b.comentarios = b.comentarios.filter((c) => c.discussao_id !== did);
    b.participacoes = b.participacoes.filter((x) => x.discussao_id !== did);
    gravar(b);
  }

  async participantesDaDiscussao(discussaoId: string): Promise<ParticipanteResumo[]> {
    const b = ler();
    return b.participacoes
      .filter((x) => x.discussao_id === discussaoId)
      .sort((a, z) => a.criado_em.localeCompare(z.criado_em))
      .map((x) => resumo(b.participantes.find((p) => p.id === x.participante_id)))
      .filter((p): p is ParticipanteResumo => p !== null);
  }

  /** RN-006: qualquer participante logado entra em qualquer discussao. */
  async entrarNaDiscussao(discussaoId: string): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    const jaEsta = b.participacoes.some(
      (x) => x.discussao_id === discussaoId && x.participante_id === s.usuario_id,
    );
    if (jaEsta) return;
    b.participacoes.push({
      discussao_id: discussaoId, participante_id: s.usuario_id, criado_em: agora(),
    });
    gravar(b);
  }

  async comentarios(discussaoId: string): Promise<ComentarioComAutor[]> {
    const b = ler();
    return b.comentarios
      .filter((c) => c.discussao_id === discussaoId)
      .sort((a, z) => a.criado_em.localeCompare(z.criado_em))
      .map((c) => ({
        ...c,
        autor: resumo(b.participantes.find((p) => p.id === c.autor_id)),
      }));
  }

  async comentar(discussaoId: string, texto: string): Promise<Comentario> {
    const b = ler();
    const s = this.exigirSessao(b);
    const comentario: Comentario = {
      id: id(), discussao_id: discussaoId, autor_id: s.usuario_id,
      texto, criado_em: agora(),
    };
    b.comentarios.push(comentario);
    // Comentar entra na discussao.
    if (!b.participacoes.some(
      (x) => x.discussao_id === discussaoId && x.participante_id === s.usuario_id,
    )) {
      b.participacoes.push({
        discussao_id: discussaoId, participante_id: s.usuario_id, criado_em: agora(),
      });
    }
    gravar(b);
    return comentario;
  }

  // --- Eventos ---

  async listarEventos(f: FiltrosEventos): Promise<EventoComAutor[]> {
    const b = ler();
    const limite = f.janela ? fimDaJanela(f.janela) : null;
    const encontrados = b.eventos.filter((e) => {
      // O que já rolou sai da listagem principal; só aparece quando pedido.
      if (jaRolou(e) !== Boolean(f.passados)) return false;
      if (f.estado && e.estado !== f.estado) return false;
      if (f.cidade && !mesmaCidade(e.cidade ?? '', f.cidade)) return false;
      if (f.area && !e.areas.includes(f.area)) return false;
      if (f.tema && !e.temas.includes(f.tema)) return false;
      if (f.entrada && e.entrada !== f.entrada) return false;
      // A janela olha o COMEÇO: uma temporada que já abriu conta como
      // acontecendo nesta semana, mesmo terminando daqui a três meses.
      if (limite && e.data_inicio > limite) return false;
      return true;
    });
    return ordenarPorData(encontrados, Boolean(f.passados))
      .map((e) => this.comAutorEvento(b, e));
  }

  async obterEvento(eid: string): Promise<EventoComAutor | null> {
    const b = ler();
    const e = b.eventos.find((x) => x.id === eid);
    return e ? this.comAutorEvento(b, e) : null;
  }

  async eventosDoParticipante(participanteId: string): Promise<EventoComAutor[]> {
    const b = ler();
    const seus = b.eventos.filter((e) => e.autor_id === participanteId && !jaRolou(e));
    return ordenarPorData(seus, false).map((e) => this.comAutorEvento(b, e));
  }

  async meusEventos(): Promise<EventoComAutor[]> {
    const b = ler();
    const s = this.exigirSessao(b);
    const meus = b.eventos.filter((e) => e.autor_id === s.usuario_id);
    return ordenarPorData(meus, false).map((e) => this.comAutorEvento(b, e));
  }

  async criarEvento(dados: DadosEvento): Promise<Evento> {
    const b = ler();
    const s = this.exigirSessao(b);
    const evento: Evento = {
      ...dados, id: id(), autor_id: s.usuario_id, criado_em: agora(),
    };
    b.eventos.push(evento);
    gravar(b);
    return evento;
  }

  async atualizarEvento(eid: string, dados: DadosEvento): Promise<Evento> {
    const b = ler();
    const s = this.exigirSessao(b);
    const i = b.eventos.findIndex((x) => x.id === eid);
    if (i < 0) throw new Error('Esse evento não existe mais.');
    if (b.eventos[i].autor_id !== s.usuario_id) {
      throw new Error('Só quem publicou pode editar.');
    }
    b.eventos[i] = { ...b.eventos[i], ...dados };
    gravar(b);
    return b.eventos[i];
  }

  async excluirEvento(eid: string): Promise<void> {
    const b = ler();
    const s = this.exigirSessao(b);
    const e = b.eventos.find((x) => x.id === eid);
    if (!e) return;
    if (e.autor_id !== s.usuario_id) throw new Error('Só quem publicou pode apagar.');
    b.eventos = b.eventos.filter((x) => x.id !== eid);
    gravar(b);
  }

  async locaisDeEventos(): Promise<LocalDeEventos[]> {
    // Só o que está por vir: filtrar por um estado sem evento futuro devolveria
    // uma lista vazia e pareceria defeito.
    const porEstado = new Map<Uf, Set<string>>();
    for (const e of ler().eventos) {
      if (jaRolou(e) || !e.estado) continue;
      const cidades = porEstado.get(e.estado) ?? new Set<string>();
      if (e.cidade) cidades.add(e.cidade);
      porEstado.set(e.estado, cidades);
    }
    return [...porEstado]
      .map(([estado, cidades]) => ({
        estado,
        cidades: [...cidades].sort((a, z) => a.localeCompare(z, 'pt-BR')),
      }))
      .sort((a, z) => a.estado.localeCompare(z.estado));
  }

  // --- As redes da turma (perfis suspensos) ---

  /**
   * Lê o banco já com a lista semeada. Gravar é melhor-esforço: em aba anônima
   * o localStorage recusa escrita, e aí a lista existe só nesta sessão — ver a
   * lista continua funcionando, o que se perde é a memória de quem a
   * reivindicou, que nessa aba já se perderia de qualquer jeito.
   */
  private lerComRedes(): Banco {
    const b = ler();
    if (semearRedes(b)) {
      try { gravar(b); } catch { /* segue com a lista em memória */ }
    }
    return b;
  }

  async listarPerfisSuspensos(): Promise<PerfilSuspenso[]> {
    return this.lerComRedes().perfis_suspensos.filter((p) => !p.removido);
  }

  async obterPerfilSuspenso(pid: string): Promise<PerfilSuspenso | null> {
    const p = this.lerComRedes().perfis_suspensos.find((x) => x.id === pid);
    return p && !p.removido ? p : null;
  }

  async meuPerfilSuspenso(): Promise<PerfilSuspenso | null> {
    const b = this.lerComRedes();
    if (!b.sessao) return null;
    const meu = b.perfis_suspensos.find(
      (p) => p.reivindicado_por === b.sessao!.usuario_id && !p.removido,
    );
    return meu ?? null;
  }

  async reivindicarPerfilSuspenso(pid: string): Promise<void> {
    const b = this.lerComRedes();
    const s = this.exigirSessao(b);
    const p = b.perfis_suspensos.find((x) => x.id === pid);
    if (!p || p.removido) throw new Error('Esse @ não está mais na lista.');
    if (p.reivindicado_por && p.reivindicado_por !== s.usuario_id) {
      throw new Error('Alguém já disse que esse @ é dela.');
    }
    // Uma pessoa, um @: reivindicar um segundo devolve o primeiro.
    for (const outro of b.perfis_suspensos) {
      if (outro.id !== pid && outro.reivindicado_por === s.usuario_id) {
        outro.reivindicado_por = null;
      }
    }
    p.reivindicado_por = s.usuario_id;
    gravar(b);
  }

  async devolverPerfilSuspenso(pid: string): Promise<void> {
    const b = this.lerComRedes();
    const s = this.exigirSessao(b);
    const p = b.perfis_suspensos.find((x) => x.id === pid);
    if (!p) return;
    if (p.reivindicado_por !== s.usuario_id) {
      throw new Error('Esse registro não é seu pra devolver.');
    }
    p.reivindicado_por = null;
    gravar(b);
  }

  async sairDaLista(handle: string): Promise<boolean> {
    const procurado = handle.trim().toLowerCase();
    if (!procurado) return false;
    const b = this.lerComRedes();
    const p = b.perfis_suspensos.find(
      (x) => !x.removido && x.handles.some((h) => h.toLowerCase() === procurado),
    );
    if (!p) return false;
    // Só a marca de removido: quem some da lista some de toda a interface, e
    // uma reivindicação pendurada num registro invisível não aparece em lugar
    // nenhum. No Supabase é a única coluna que a pessoa deslogada pode tocar,
    // e os dois adaptadores fazem a mesma coisa.
    p.removido = true;
    gravar(b);
    return true;
  }

  // --- Tema ---

  async eventosPorTema(tema: Tema): Promise<EventoComAutor[]> {
    const b = ler();
    const encontrados = b.eventos.filter((e) => e.temas.includes(tema) && !jaRolou(e));
    return ordenarPorData(encontrados, false).map((e) => this.comAutorEvento(b, e));
  }

  async participantesPorTema(tema: Tema): Promise<Participante[]> {
    return maisRecentePrimeiro(
      ler().participantes.filter((p) => p.temas_interesse.includes(tema)),
    );
  }

  async projetosPorTema(tema: Tema): Promise<ProjetoComAutor[]> {
    const b = ler();
    const encontrados = b.projetos.filter(
      (p) => p.estado === 'publicado' && p.temas.includes(tema),
    );
    return maisRecentePrimeiro(encontrados).map((p) => this.comAutor(b, p));
  }
}

