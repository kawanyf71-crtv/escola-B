// Listas fixas da spec (secao 16). RN-002 e RN-003 dependem de que estas
// constantes sejam a UNICA fonte: habilidade oferecida e conhecimento
// procurado leem o mesmo array; tema de perfil, de projeto e de discussao
// tambem. Nao duplicar estas listas em lugar nenhum.

export const AREAS = [
  'Música', 'Audiovisual', 'Teatro', 'Dança', 'Literatura', 'Artes Visuais',
  'Cultura Popular', 'Educação', 'Pesquisa', 'Eventos', 'Comunicação', 'Outro',
] as const;

export const TEMAS = [
  'Cultura negra', 'Cultura afro-brasileira', 'LGBTQIA+', 'Juventude',
  'Periferias', 'Ancestralidade', 'Memória', 'Identidade', 'Educação',
  'Direitos humanos', 'Outro',
] as const;

/** RN-002: a mesma lista serve `habilidades_oferecidas` e `conhecimentos_procurados`. */
export const HABILIDADES = [
  'Produção', 'Comunicação', 'Design', 'Audiovisual', 'Fotografia', 'Música',
  'Curadoria', 'Pesquisa', 'Gestão', 'Captação de recursos', 'Outro',
] as const;

export const ESTAGIOS = [
  'Ideia', 'Em desenvolvimento', 'Em produção', 'Em execução', 'Já aconteceu',
] as const;

export const TIPOS_PARTICIPACAO = [
  'Trabalho remunerado', 'Trabalho voluntário', 'Colaboração', 'Colaboração intelectual',
] as const;

export const DISPONIBILIDADES = [
  'Remunerado', 'Voluntário', 'Colaboração', 'Colaboração intelectual',
] as const;

export const MODALIDADES = ['Presencial', 'Online', 'Híbrido', 'Não definido'] as const;

export type Area = (typeof AREAS)[number];
export type Tema = (typeof TEMAS)[number];
export type Habilidade = (typeof HABILIDADES)[number];
export type Estagio = (typeof ESTAGIOS)[number];
export type TipoParticipacao = (typeof TIPOS_PARTICIPACAO)[number];
export type Disponibilidade = (typeof DISPONIBILIDADES)[number];
export type Modalidade = (typeof MODALIDADES)[number];

export interface Participante {
  id: string;
  nome: string;
  email: string;
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
  criado_em: string;
}

export type EstadoProjeto = 'rascunho' | 'publicado' | 'despublicado';

export interface Projeto {
  id: string;
  autor_id: string;
  nome: string;
  o_que_e: string;
  areas: Area[];
  sobre: string;
  estagio: Estagio;
  temas: Tema[];
  quando: string | null;
  onde_cidade: string | null;
  onde_modalidade: Modalidade | null;
  ja_existiu: boolean;
  ja_existiu_links: string | null;
  imagem: string | null;
  busca_pessoas: boolean;
  tipo_participacao: TipoParticipacao[];
  conhecimentos_procurados: Habilidade[];
  o_que_precisa: string | null;
  estado: EstadoProjeto;
  criado_em: string;
}

export interface Discussao {
  id: string;
  titulo: string;
  tema: Tema;          // RN-005: exatamente um tema.
  descricao: string;
  projeto_origem_id: string; // RN-004: toda discussao nasce de um projeto.
  autor_id: string;
  criado_em: string;
}

export interface Comentario {
  id: string;
  discussao_id: string;
  autor_id: string;
  texto: string;
  criado_em: string;
}

export interface ParticipacaoDiscussao {
  discussao_id: string;
  participante_id: string;
  criado_em: string;
}

export type EstadoInteresse = 'enviado' | 'visto';

export interface Interesse {
  id: string;
  projeto_id: string;
  participante_id: string;
  tipo_participacao: TipoParticipacao;
  mensagem: string;
  estado: EstadoInteresse;
  criado_em: string;
}

/** RF-008: intersecao entre o que ofereco e o que o projeto procura. */
export function correspondencia(
  habilidades: Habilidade[] | undefined,
  procurados: Habilidade[] | undefined,
): Habilidade[] {
  if (!habilidades?.length || !procurados?.length) return [];
  const procura = new Set<string>(procurados);
  return habilidades.filter((h) => procura.has(h));
}

export function slugTema(tema: string): string {
  return tema
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function temaPorSlug(slug: string): Tema | undefined {
  return TEMAS.find((t) => slugTema(t) === slug);
}
