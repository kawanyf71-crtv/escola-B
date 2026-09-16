import type {
  Area, Comentario, Discussao, Disponibilidade, EntradaEvento, Evento, Habilidade,
  Interesse, Participante, Projeto, Tema, TipoParticipacao, Uf,
} from '../lib/dominio';
import type { Janela } from '../lib/datas';

export interface Sessao {
  usuario_id: string;
  email: string;
}

export interface ParticipanteResumo {
  id: string;
  nome: string;
  ocupacao: string;
  cidade: string;
  foto: string | null;
}

export type ProjetoComAutor = Projeto & { autor: ParticipanteResumo | null };

export type DiscussaoCompleta = Discussao & {
  autor: ParticipanteResumo | null;
  projeto: { id: string; nome: string } | null;
  total_participantes: number;
};

export type ComentarioComAutor = Comentario & { autor: ParticipanteResumo | null };

export type InteresseComParticipante = Interesse & { participante: Participante | null };

export type InteresseComProjeto = Interesse & { projeto: ProjetoComAutor | null };

export type EventoComAutor = Evento & { autor: ParticipanteResumo | null };

/** Os estados que têm evento e, dentro de cada um, as cidades que têm. */
export interface LocalDeEventos {
  estado: Uf;
  cidades: string[];
}

export interface FiltrosPessoas {
  habilidade?: Habilidade | '';
  area?: Area | '';
  tema?: Tema | '';
  cidade?: string;
}

export interface FiltrosEventos {
  estado?: Uf | '';
  cidade?: string;
  area?: Area | '';
  tema?: Tema | '';
  janela?: Janela | '';
  entrada?: EntradaEvento | '';
  /**
   * O mural mostra o que está por vir. Evento vencido no topo mata um mural em
   * três semanas, então o que já passou sai da listagem e só aparece quando
   * alguém pede — em ordem decrescente, do mais recente pro mais antigo.
   */
  passados?: boolean;
}

export interface FiltrosProjetos {
  area?: Area | '';
  estagio?: string;
  tema?: Tema | '';
  cidade?: string;
  conhecimento?: Habilidade | '';
}

/** Dados de perfil que a pessoa preenche; o id vem da sessao. */
export type DadosPerfil = {
  nome: string;
  foto: string | null;
  cidade: string;
  ocupacao: string;
  mini_bio: string;
  areas: Area[];
  habilidades_oferecidas: Habilidade[];
  temas_interesse: Tema[];
  disponibilidade: Disponibilidade[];
  instagram: string | null;
  linkedin: string | null;
  site: string | null;
};

export type DadosProjeto = Omit<Projeto, 'id' | 'autor_id' | 'criado_em'>;

export type DadosEvento = Omit<Evento, 'id' | 'autor_id' | 'criado_em'>;

export interface NovaDiscussao {
  titulo: string;
  tema: Tema;
  descricao: string;
}

/**
 * Contrato unico das telas. Dois adaptadores o implementam: `local` (navegador,
 * zero configuracao) e `supabase` (producao). Trocar de um para o outro nao
 * exige mudanca em nenhuma pagina.
 */
export interface Repositorio {
  readonly nome: 'local' | 'supabase';

  /**
   * O lote de demonstração cria pessoas sem conta. No Supabase isso não é
   * possível: `participantes.id` referencia `auth.users`, então cada perfil
   * exigiria um usuário de autenticação de verdade. Por isso o lote só existe
   * no adaptador local, e a interface esconde os botões quando isto é falso.
   */
  readonly suportaExemplo: boolean;
  carregarDadosDeExemplo(): Promise<void>;
  apagarDadosDeExemplo(): Promise<void>;
  temDadosDeExemplo(): Promise<boolean>;

  // --- Autenticacao (RF-001) ---
  sessaoAtual(): Promise<Sessao | null>;
  criarConta(email: string, senha: string): Promise<Sessao>;
  entrar(email: string, senha: string): Promise<Sessao>;
  sair(): Promise<void>;
  excluirConta(): Promise<void>;

  // --- Imagens ---

  /**
   * Guarda uma imagem já comprimida e devolve o que vai no registro. No
   * Supabase sobe para o Storage e devolve a URL pública; no adaptador local
   * devolve a própria data URL. A tela não sabe qual dos dois aconteceu.
   */
  enviarImagem(
    blob: Blob, dataUrl: string, pasta: 'perfis' | 'projetos' | 'eventos',
  ): Promise<string>;

  // --- Participantes (RF-002, RF-003, RF-004) ---
  meuPerfil(): Promise<Participante | null>;
  salvarPerfil(dados: DadosPerfil): Promise<Participante>;
  obterParticipante(id: string): Promise<Participante | null>;
  listarParticipantes(filtros: FiltrosPessoas): Promise<Participante[]>;
  cidadesConhecidas(): Promise<string[]>;

  // --- Projetos (RF-005, RF-006, RF-007, RF-017) ---
  listarProjetos(filtros: FiltrosProjetos): Promise<ProjetoComAutor[]>;
  obterProjeto(id: string): Promise<ProjetoComAutor | null>;
  projetosDoParticipante(participanteId: string): Promise<ProjetoComAutor[]>;
  criarProjeto(dados: DadosProjeto, discussao: NovaDiscussao | null): Promise<Projeto>;
  atualizarProjeto(id: string, dados: DadosProjeto): Promise<Projeto>;
  definirEstadoProjeto(id: string, estado: Projeto['estado']): Promise<void>;

  // --- Interesses (RF-009, RF-010) ---
  manifestarInteresse(
    projetoId: string, tipo: TipoParticipacao, mensagem: string,
  ): Promise<Interesse>;
  cancelarInteresse(projetoId: string): Promise<void>;
  meuInteresseNoProjeto(projetoId: string): Promise<Interesse | null>;
  interessadosNoProjeto(projetoId: string): Promise<InteresseComParticipante[]>;
  meusInteresses(): Promise<InteresseComProjeto[]>;

  // --- Discussoes (RF-011 a RF-014) ---
  listarDiscussoes(tema?: Tema | ''): Promise<DiscussaoCompleta[]>;
  discussoesDoProjeto(projetoId: string): Promise<DiscussaoCompleta[]>;
  discussoesDoParticipante(participanteId: string): Promise<DiscussaoCompleta[]>;
  obterDiscussao(id: string): Promise<DiscussaoCompleta | null>;
  /** `projetoId` nulo cria um assunto solto, sem projeto de origem. */
  criarDiscussao(dados: NovaDiscussao, projetoId: string | null): Promise<Discussao>;
  excluirDiscussao(id: string): Promise<void>;
  participantesDaDiscussao(discussaoId: string): Promise<ParticipanteResumo[]>;
  entrarNaDiscussao(discussaoId: string): Promise<void>;
  comentarios(discussaoId: string): Promise<ComentarioComAutor[]>;
  comentar(discussaoId: string, texto: string): Promise<Comentario>;

  // --- Eventos (mural) ---
  /** Ordenado por data_inicio crescente; com `passados`, decrescente. */
  listarEventos(filtros: FiltrosEventos): Promise<EventoComAutor[]>;
  obterEvento(id: string): Promise<EventoComAutor | null>;
  /** Só os que ainda vão acontecer: perfil não é arquivo. */
  eventosDoParticipante(participanteId: string): Promise<EventoComAutor[]>;
  /** Os meus, passados inclusive — é de lá que eu edito e apago. */
  meusEventos(): Promise<EventoComAutor[]>;
  criarEvento(dados: DadosEvento): Promise<Evento>;
  atualizarEvento(id: string, dados: DadosEvento): Promise<Evento>;
  excluirEvento(id: string): Promise<void>;
  /** Alimenta os filtros de estado e cidade com o que existe de verdade. */
  locaisDeEventos(): Promise<LocalDeEventos[]>;

  // --- Tema (RF-015) ---
  participantesPorTema(tema: Tema): Promise<Participante[]>;
  projetosPorTema(tema: Tema): Promise<ProjetoComAutor[]>;
  eventosPorTema(tema: Tema): Promise<EventoComAutor[]>;
}
