import type {
  Comentario, Discussao, Interesse, Participante, Projeto, Tema, TipoParticipacao,
} from '../lib/dominio';
import type {
  ComentarioComAutor, DadosPerfil, DadosProjeto, DiscussaoCompleta, FiltrosPessoas,
  FiltrosProjetos, InteresseComParticipante, InteresseComProjeto, NovaDiscussao,
  ParticipanteResumo, ProjetoComAutor, Repositorio, Sessao,
} from './tipos';

const CHAVE = 'rede-escola-b/v1';

interface Conta { id: string; email: string; senha_hash: string }

interface Banco {
  contas: Conta[];
  participantes: Participante[];
  projetos: Projeto[];
  discussoes: Discussao[];
  comentarios: Comentario[];
  participacoes: { discussao_id: string; participante_id: string; criado_em: string }[];
  interesses: Interesse[];
  sessao: Sessao | null;
}

const vazio = (): Banco => ({
  contas: [], participantes: [], projetos: [], discussoes: [],
  comentarios: [], participacoes: [], interesses: [], sessao: null,
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

function gravar(b: Banco): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(b));
  } catch {
    // Navegacao privada no iOS, cota cheia ou armazenamento bloqueado. Sem
    // localStorage este adaptador nao tem onde guardar nada, entao e melhor
    // dizer isso do que deixar a tela falhar com um erro sem sentido.
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

function maisRecentePrimeiro<T extends { criado_em: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

export class RepositorioLocal implements Repositorio {
  readonly nome = 'local' as const;

  private exigirSessao(b: Banco): Sessao {
    if (!b.sessao) throw new Error('Entra na sua conta pra fazer isso.');
    return b.sessao;
  }

  private comAutor(b: Banco, p: Projeto): ProjetoComAutor {
    return { ...p, autor: resumo(b.participantes.find((x) => x.id === p.autor_id)) };
  }

  private completarDiscussao(b: Banco, d: Discussao): DiscussaoCompleta {
    const projeto = b.projetos.find((p) => p.id === d.projeto_origem_id);
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
        .filter((d) => d.autor_id === s.usuario_id || meusProjetos.has(d.projeto_origem_id))
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
    if (!projeto || projeto.autor_id !== s.usuario_id) {
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
    const encontradas = b.discussoes.filter(
      (d) => publicados.has(d.projeto_origem_id) && (!tema || d.tema === tema),
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

  async criarDiscussao(projetoId: string, dados: NovaDiscussao): Promise<Discussao> {
    const b = ler();
    const s = this.exigirSessao(b);
    const projeto = b.projetos.find((p) => p.id === projetoId);
    if (!projeto) throw new Error('Esse projeto não existe mais.'); // RN-004
    if (projeto.autor_id !== s.usuario_id) {
      throw new Error('Só quem publicou pode puxar assunto no projeto.');
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

  // --- Tema ---

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

