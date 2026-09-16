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

/** Evento nao tem "nao definido": ou e presencial, ou online, ou os dois. */
export const FORMATOS_EVENTO = ['Presencial', 'Online', 'Híbrido'] as const;

export const ENTRADAS_EVENTO = ['Gratuito', 'Pago', 'Não informado'] as const;

/** As 27 UFs. A sigla e o que fica guardado; o nome so aparece no formulario. */
export const UFS = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const;

export const SIGLAS_UF = UFS.map((u) => u.sigla);

export type Area = (typeof AREAS)[number];
export type Tema = (typeof TEMAS)[number];
export type Habilidade = (typeof HABILIDADES)[number];
export type Estagio = (typeof ESTAGIOS)[number];
export type TipoParticipacao = (typeof TIPOS_PARTICIPACAO)[number];
export type Disponibilidade = (typeof DISPONIBILIDADES)[number];
export type Modalidade = (typeof MODALIDADES)[number];
export type FormatoEvento = (typeof FORMATOS_EVENTO)[number];
export type EntradaEvento = (typeof ENTRADAS_EVENTO)[number];
export type Uf = (typeof UFS)[number]['sigla'];

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
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
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
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
}

export interface Discussao {
  id: string;
  titulo: string;
  tema: Tema;          // RN-005: exatamente um tema.
  descricao: string;
  // Opcional: um assunto pode nascer de um projeto ou solto. Quando ha projeto,
  // ele da contexto; quando nao ha, o tema sozinho ja agrupa.
  projeto_origem_id: string | null;
  autor_id: string;
  criado_em: string;
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
}

export interface Comentario {
  id: string;
  discussao_id: string;
  autor_id: string;
  texto: string;
  criado_em: string;
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
}

export interface ParticipacaoDiscussao {
  discussao_id: string;
  participante_id: string;
  criado_em: string;
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
}

/**
 * Evento do mural. O cadastro e curto de proposito: quem quiser detalhe clica
 * no link de quem organiza. Este lugar nao vende, nao emite ingresso e nao
 * processa pagamento — so mostra e manda pra fora.
 */
export interface Evento {
  id: string;
  autor_id: string;
  /** Obrigatorio, ao contrario da capa de projeto: sem cartaz nao ha mural. */
  banner: string;
  titulo: string;
  /** AAAA-MM-DD. Data pura, sem fuso: um evento dia 28 e dia 28 em qualquer lugar. */
  data_inicio: string;
  /** Temporada, exposicao, festival de varios dias. */
  data_fim: string | null;
  /** HH:MM. */
  horario: string | null;
  link: string;
  formato: FormatoEvento;
  /** Nulos quando o formato e Online. */
  estado: Uf | null;
  cidade: string | null;
  entrada: EntradaEvento;
  areas: Area[];
  temas: Tema[];
  criado_em: string;
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
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
  /** Registro do lote de demonstração. Ausente nos registros de verdade. */
  demo?: boolean;
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
