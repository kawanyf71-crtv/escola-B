/**
 * Lote de demonstração. Todos os registros são FICTÍCIOS e carregam `demo:
 * true`, que é o que permite apagá-los de uma vez sem tocar no que é de
 * verdade. As pessoas do lote não têm conta: são registros de leitura e não
 * conseguem entrar.
 *
 * Os links sociais apontam para "#" e os handles levam o prefixo "demo." de
 * propósito — nenhum deles pode cair numa conta real de ninguém.
 */
import type {
  Comentario, Discussao, Evento, Interesse, Participante, Projeto,
} from '../lib/dominio';
import { AVATARES, CAPAS, CARTAZES } from './imagensExemplo';

/** Ids fixos: o lote precisa ser recarregável e as relações, estáveis. */
const id = (grupo: string, n: number) =>
  `0de0${grupo}00-0000-4000-8000-${String(n).padStart(12, '0')}`;

const PESSOA = {
  dandara: id('a1', 1),
  joel: id('a1', 2),
  rita: id('a1', 3),
  taina: id('a1', 4),
};

const PROJETO = {
  aparelhagem: id('b2', 1),
  corpoFechado: id('b2', 2),
  escolaLivre: id('b2', 3),
  antologia: id('b2', 4),
};

const ASSUNTO = {
  registrar: id('c3', 1),
  cache: id('c3', 2),
  comunidade: id('c3', 3),
  autoras: id('c3', 4),
};

const EVENTO = {
  rodaDeSamba: id('d4', 1),
  aparelhagem3Noites: id('d4', 2),
  oficinaEdital: id('d4', 3),
  curtasRecife: id('d4', 4),
  antologiaPiloto: id('d4', 5),
};

/** Datas fixas e espaçadas, pra lista ordenada por data não sair embolada. */
const quando = (dia: number) => `2026-09-${String(dia).padStart(2, '0')}T12:00:00.000Z`;

export const PARTICIPANTES_EXEMPLO: Participante[] = [
  {
    id: PESSOA.dandara,
    nome: 'Dandara Vieira',
    email: 'dandara@exemplo.invalido',
    foto: AVATARES.dandara,
    cidade: 'Belém, PA',
    ocupacao: 'Produtora musical e pesquisadora de cena',
    mini_bio:
      'Trabalho com aparelhagem há doze anos, primeiro carregando caixa e depois ' +
      'produzindo. Hoje pesquiso e registro a história dos DJs que sustentam essa ' +
      'cena no Pará e quase nunca aparecem em lugar nenhum.',
    areas: ['Música', 'Pesquisa', 'Eventos'],
    habilidades_oferecidas: ['Produção', 'Pesquisa', 'Música', 'Captação de recursos'],
    temas_interesse: ['Ancestralidade', 'Memória', 'Periferias'],
    disponibilidade: ['Remunerado', 'Colaboração'],
    instagram: '@demo.dandara',
    linkedin: 'demo.dandaravieira',
    site: null,
    criado_em: quando(1),
    demo: true,
  },
  {
    id: PESSOA.joel,
    nome: 'Joel Okonkwo Bastos',
    email: 'joel@exemplo.invalido',
    foto: AVATARES.joel,
    cidade: 'Recife, PE',
    ocupacao: 'Diretor de fotografia e montador',
    mini_bio:
      'Comecei filmando festa de rua com câmera emprestada. Hoje faço fotografia e ' +
      'montagem de curta e documentário, e sigo preferindo trabalhar com quem tá ' +
      'contando a própria história.',
    areas: ['Audiovisual', 'Artes Visuais'],
    habilidades_oferecidas: ['Audiovisual', 'Fotografia', 'Design'],
    temas_interesse: ['Juventude', 'Periferias', 'Identidade'],
    disponibilidade: ['Remunerado', 'Voluntário'],
    instagram: '@demo.joelokb',
    linkedin: null,
    site: null,
    criado_em: quando(2),
    demo: true,
  },
  {
    id: PESSOA.rita,
    nome: 'Rita Sanfins',
    email: 'rita@exemplo.invalido',
    foto: AVATARES.rita,
    cidade: 'Salvador, BA',
    ocupacao: 'Produtora executiva e captadora de recursos',
    mini_bio:
      'Sou a pessoa que lê edital inteiro e entende o que tá escrito nas entrelinhas. ' +
      'Já captei para festival, ocupação e escola livre. Acredito que projeto de ' +
      'cultura negra tem que pagar quem trabalha nele.',
    areas: ['Eventos', 'Teatro', 'Educação'],
    habilidades_oferecidas: ['Produção', 'Gestão', 'Captação de recursos', 'Comunicação'],
    temas_interesse: ['Cultura afro-brasileira', 'Direitos humanos', 'Educação'],
    disponibilidade: ['Remunerado', 'Colaboração intelectual'],
    instagram: '@demo.ritasanfins',
    linkedin: 'demo.ritasanfins',
    site: null,
    criado_em: quando(3),
    demo: true,
  },
  {
    id: PESSOA.taina,
    nome: 'Tainá Bispo do Carmo',
    email: 'taina@exemplo.invalido',
    foto: AVATARES.taina,
    cidade: 'Diadema, SP',
    ocupacao: 'Escritora, educadora e curadora de literatura',
    mini_bio:
      'Dou aula de literatura em escola pública de manhã e organizo sarau no quintal ' +
      'de casa aos sábados. Escrevo desde criança e publico pouco, mas publico.',
    areas: ['Literatura', 'Educação', 'Comunicação'],
    habilidades_oferecidas: ['Curadoria', 'Pesquisa', 'Comunicação', 'Produção'],
    temas_interesse: ['Cultura negra', 'Memória', 'Educação', 'LGBTQIA+'],
    disponibilidade: ['Voluntário', 'Colaboração', 'Colaboração intelectual'],
    instagram: '@demo.tainabispo',
    linkedin: null,
    site: null,
    criado_em: quando(4),
    demo: true,
  },
];

export const PROJETOS_EXEMPLO: Projeto[] = [
  {
    id: PROJETO.aparelhagem,
    autor_id: PESSOA.dandara,
    nome: 'Aparelhagem Memória',
    o_que_e:
      'Mapa sonoro e audiovisual das aparelhagens do Pará, contado pelos DJs que ' +
      'sustentam a cena há décadas.',
    areas: ['Música', 'Pesquisa'],
    sobre:
      'A aparelhagem paraense move milhares de pessoas todo fim de semana e quase não ' +
      'existe registro sério sobre quem faz isso acontecer. O projeto grava entrevistas ' +
      'em vídeo com vinte DJs e técnicos de som de Belém e região metropolitana, monta ' +
      'um acervo sonoro aberto e termina numa exposição itinerante que volta para os ' +
      'bairros onde as entrevistas foram feitas. O que eu não quero é fazer mais um ' +
      'documentário que só roda em festival de cidade grande.',
    estagio: 'Em desenvolvimento',
    temas: ['Ancestralidade', 'Memória', 'Periferias'],
    quando: 'Primeiro semestre de 2027',
    onde_cidade: 'Belém, PA',
    onde_modalidade: 'Híbrido',
    ja_existiu: true,
    ja_existiu_links: 'Piloto com três entrevistas em 2025\n#',
    imagem: CAPAS.aparelhagem,
    busca_pessoas: true,
    tipo_participacao: ['Trabalho remunerado', 'Colaboração'],
    conhecimentos_procurados: ['Audiovisual', 'Design', 'Captação de recursos'],
    o_que_precisa:
      'Alguém pra filmar e montar as entrevistas, e alguém que saiba escrever projeto ' +
      'pra edital — a parte da captação é onde eu mais empaco.',
    estado: 'publicado',
    criado_em: quando(5),
    demo: true,
  },
  {
    id: PROJETO.corpoFechado,
    autor_id: PESSOA.joel,
    nome: 'Corpo Fechado',
    o_que_e:
      'Curta-metragem de ficção sobre três irmãos que herdam a casa da avó e descobrem ' +
      'o que ela guardava no quarto dos fundos.',
    areas: ['Audiovisual'],
    sobre:
      'Roteiro pronto, equipe parcial, locação garantida na casa da minha família em ' +
      'Olinda. É um filme sobre herança — a que se recebe em papel e a que se recebe ' +
      'sem escolher. Quero rodar em sete diárias, em película digital, com equipe ' +
      'pequena e gente da região. Tenho câmera e luz; falta som, produção de set e trilha.',
    estagio: 'Em produção',
    temas: ['Juventude', 'Identidade', 'Periferias'],
    quando: 'Março de 2027',
    onde_cidade: 'Olinda, PE',
    onde_modalidade: 'Presencial',
    ja_existiu: false,
    ja_existiu_links: null,
    imagem: CAPAS.corpoFechado,
    busca_pessoas: true,
    tipo_participacao: ['Trabalho voluntário', 'Colaboração'],
    conhecimentos_procurados: ['Produção', 'Música', 'Fotografia'],
    o_que_precisa:
      'Produção de set pra sete diárias e alguém pra compor a trilha. É voluntário com ' +
      'divisão de resultado — não tenho patrocínio e não vou fingir que tenho.',
    estado: 'publicado',
    criado_em: quando(6),
    demo: true,
  },
  {
    id: PROJETO.escolaLivre,
    autor_id: PESSOA.rita,
    nome: 'Escola Livre de Produção',
    o_que_e:
      'Curso gratuito de produção cultural para jovens de bairros periféricos de ' +
      'Salvador, com turma presencial de trinta pessoas.',
    areas: ['Educação', 'Eventos'],
    sobre:
      'Tá na terceira turma. A gente ensina o que ninguém ensina de graça: como ler ' +
      'edital, montar planilha de custo, prestar conta, contratar artista sem se ' +
      'enrolar. Todo mundo que dá aula recebe. Meu problema agora não é conteúdo, é ' +
      'comunicação — a gente não consegue alcançar quem mais precisa e continua ' +
      'enchendo a turma com quem já tava no meio.',
    estagio: 'Em execução',
    temas: ['Educação', 'Direitos humanos', 'Cultura afro-brasileira'],
    quando: 'Turmas semestrais, a próxima em fevereiro de 2027',
    onde_cidade: 'Salvador, BA',
    onde_modalidade: 'Presencial',
    ja_existiu: true,
    ja_existiu_links: 'Duas turmas concluídas\n#',
    imagem: CAPAS.escolaLivre,
    busca_pessoas: true,
    tipo_participacao: ['Trabalho remunerado', 'Colaboração intelectual'],
    conhecimentos_procurados: ['Comunicação', 'Pesquisa', 'Gestão'],
    o_que_precisa:
      'Alguém que entenda de comunicação pra periferia de verdade, não de campanha de ' +
      'Instagram. E alguém pra me ajudar a medir se o curso tá mudando a vida de quem ' +
      'passa por ele.',
    estado: 'publicado',
    criado_em: quando(7),
    demo: true,
  },
  {
    id: PROJETO.antologia,
    autor_id: PESSOA.taina,
    nome: 'Antologia Quintal',
    o_que_e:
      'Antologia impressa com textos de autoras negras que nunca publicaram fora de sarau.',
    areas: ['Literatura'],
    sobre:
      'Faço sarau no quintal de casa há quatro anos e já ouvi coisa que merecia estar ' +
      'em livro. A ideia é reunir vinte autoras da região do ABC, fazer oficina de ' +
      'preparação de texto com elas e publicar uma tiragem pequena, com lançamento no ' +
      'próprio quintal. Ainda é ideia: não tenho orçamento, não tenho editora, não ' +
      'tenho prazo. Tenho as autoras.',
    estagio: 'Ideia',
    temas: ['Cultura negra', 'Memória', 'LGBTQIA+'],
    quando: null,
    onde_cidade: 'Diadema, SP',
    onde_modalidade: 'Presencial',
    ja_existiu: false,
    ja_existiu_links: null,
    imagem: CAPAS.antologia,
    busca_pessoas: false,
    tipo_participacao: [],
    conhecimentos_procurados: [],
    o_que_precisa: null,
    estado: 'publicado',
    criado_em: quando(8),
    demo: true,
  },
];

export const DISCUSSOES_EXEMPLO: Discussao[] = [
  {
    id: ASSUNTO.registrar,
    titulo: 'Como registrar uma cena que não quer ser arquivada?',
    tema: 'Memória',
    descricao:
      'Metade dos DJs que eu procuro não quer ser gravado. Dizem que pesquisador some ' +
      'com o material e nunca mais volta — e eles têm razão, já aconteceu antes com ' +
      'gente de universidade. Como vocês construíram confiança em pesquisa com ' +
      'comunidade? O que vocês prometeram e conseguiram cumprir?',
    projeto_origem_id: PROJETO.aparelhagem,
    autor_id: PESSOA.dandara,
    criado_em: quando(9),
    demo: true,
  },
  {
    id: ASSUNTO.cache,
    titulo: 'Dá pra pagar cachê justo em edital pequeno?',
    tema: 'Educação',
    descricao:
      'Todo edital pequeno que eu pego tem teto de cachê que não fecha com o que a ' +
      'pessoa merece receber. Ou eu pago mal e me sinto péssima, ou eu corto atividade ' +
      'pra pagar bem e entrego menos. Como vocês resolvem isso na prática? Existe ' +
      'caminho ou é só escolher de que jeito perder?',
    projeto_origem_id: PROJETO.escolaLivre,
    autor_id: PESSOA.rita,
    criado_em: quando(10),
    demo: true,
  },
  {
    id: ASSUNTO.comunidade,
    titulo: 'Até onde vai a responsabilidade de quem filma a própria comunidade?',
    tema: 'Identidade',
    descricao:
      'Filmo o lugar onde cresci e conheço todo mundo que aparece no quadro. Isso me dá ' +
      'acesso que ninguém de fora teria e me dá um peso que ninguém de fora carregaria. ' +
      'Quando o filme sai, eu continuo morando ali. Quem mais aqui filma o próprio ' +
      'quintal e como vocês lidam com isso?',
    projeto_origem_id: PROJETO.corpoFechado,
    autor_id: PESSOA.joel,
    criado_em: quando(11),
    demo: true,
  },
  {
    id: ASSUNTO.autoras,
    titulo: 'Quem são as autoras negras que vocês leram e ninguém comenta?',
    tema: 'Cultura negra',
    descricao:
      'Não é sobre quem já é canônica. É sobre aquela autora que você leu, achou ' +
      'absurda de boa, e não acha ninguém pra conversar sobre ela. Traz o nome e por ' +
      'que te marcou. Quero montar uma lista com o que sair daqui.',
    projeto_origem_id: null, // assunto solto, sem projeto de origem
    autor_id: PESSOA.taina,
    criado_em: quando(12),
    demo: true,
  },
];

export const COMENTARIOS_EXEMPLO: Comentario[] = [
  {
    id: id('d4', 1),
    discussao_id: ASSUNTO.registrar,
    autor_id: PESSOA.rita,
    texto:
      'A gente resolveu com contrato simples, uma página, em português de gente: o que ' +
      'vai ser gravado, onde vai ficar, quem pode usar e como a pessoa tira o material ' +
      'de circulação se mudar de ideia. Deu muito mais efeito que qualquer conversa.',
    criado_em: quando(13),
    demo: true,
  },
  {
    id: id('d4', 2),
    discussao_id: ASSUNTO.registrar,
    autor_id: PESSOA.taina,
    texto:
      'Uma coisa que funcionou no sarau foi mostrar o material bruto pra pessoa antes ' +
      'de qualquer edição. Dá trabalho e atrasa, mas nunca mais ninguém desconfiou da gente.',
    criado_em: quando(14),
    demo: true,
  },
  {
    id: id('d4', 3),
    discussao_id: ASSUNTO.cache,
    autor_id: PESSOA.dandara,
    texto:
      'Eu passei a colocar o cachê real na planilha e mostrar o buraco. Às vezes o ' +
      'proponente do edital consegue remanejar, às vezes não, mas pelo menos para de ' +
      'parecer que o valor baixo é escolha minha.',
    criado_em: quando(15),
    demo: true,
  },
  {
    id: id('d4', 4),
    discussao_id: ASSUNTO.cache,
    autor_id: PESSOA.joel,
    texto:
      'No audiovisual a gente usa muito divisão de resultado, mas só funciona se for ' +
      'escrito antes e se todo mundo entender o risco. Verbal não vale.',
    criado_em: quando(16),
    demo: true,
  },
  {
    id: id('d4', 5),
    discussao_id: ASSUNTO.comunidade,
    autor_id: PESSOA.taina,
    texto:
      'Eu escrevo sobre a minha rua e sinto exatamente isso. O que me ajudou foi parar ' +
      'de tratar as pessoas como personagem e começar a mostrar o texto pra elas antes.',
    criado_em: quando(17),
    demo: true,
  },
  {
    id: id('d4', 6),
    discussao_id: ASSUNTO.autoras,
    autor_id: PESSOA.rita,
    texto: 'Topo demais essa lista. Me guarda uma cópia da antologia quando sair.',
    criado_em: quando(18),
    demo: true,
  },
];

export const INTERESSES_EXEMPLO: Interesse[] = [
  {
    id: id('e5', 1),
    projeto_id: PROJETO.aparelhagem,
    participante_id: PESSOA.joel,
    tipo_participacao: 'Colaboração',
    mensagem:
      'Faço fotografia e montagem. Vinte entrevistas dá pra organizar num esquema de ' +
      'blocos por região, isso me parece bem factível. Topo conversar.',
    estado: 'enviado',
    criado_em: quando(19),
    demo: true,
  },
  {
    id: id('e5', 2),
    projeto_id: PROJETO.aparelhagem,
    participante_id: PESSOA.rita,
    tipo_participacao: 'Trabalho remunerado',
    mensagem:
      'Captação é comigo. Já escrevi projeto aprovado em edital estadual de cultura ' +
      'duas vezes e sei os prazos do Pará.',
    estado: 'enviado',
    criado_em: quando(20),
    demo: true,
  },
  {
    id: id('e5', 3),
    projeto_id: PROJETO.corpoFechado,
    participante_id: PESSOA.taina,
    tipo_participacao: 'Trabalho voluntário',
    mensagem:
      'Nunca produzi set, mas produzo sarau há quatro anos e sei organizar gente e ' +
      'comida. Se servir, tô dentro.',
    estado: 'enviado',
    criado_em: quando(21),
    demo: true,
  },
  {
    id: id('e5', 4),
    projeto_id: PROJETO.escolaLivre,
    participante_id: PESSOA.dandara,
    tipo_participacao: 'Colaboração intelectual',
    mensagem:
      'Pesquisa é o que eu faço. Posso ajudar a montar o jeito de medir o que acontece ' +
      'com quem sai do curso.',
    estado: 'enviado',
    criado_em: quando(22),
    demo: true,
  },
];

/** Quem entra em cada conversa: a autora, mais quem comentou nela. */
/**
 * Eventos do lote. Os quatro primeiros ainda vão acontecer e aparecem no mural;
 * o último já passou e só aparece atrás de "Ver o que já rolou" — é o que
 * permite conferir as duas seções com o lote carregado.
 *
 * As datas são fixas, como todo o resto do lote. Elas envelhecem: passado
 * outubro de 2026, os quatro primeiros migram sozinhos para "Já rolou" e o
 * mural do lote fica vazio. Para um lote de demonstração isso é aceitável — o
 * que não pode é a data mudar a cada carregamento e o lote deixar de ser
 * recarregável igual a si mesmo.
 *
 * Os links apontam para "#", como os sociais: nenhum pode cair num lugar real.
 */
export const EVENTOS_EXEMPLO: Evento[] = [
  {
    id: EVENTO.rodaDeSamba,
    autor_id: PESSOA.taina,
    banner: CARTAZES.rodaDeSamba,
    titulo: 'Roda de Samba do Quintal',
    data_inicio: '2026-10-03',
    data_fim: null,
    horario: '19:00',
    link: '#',
    formato: 'Presencial',
    estado: 'SP',
    cidade: 'Diadema',
    entrada: 'Gratuito',
    areas: ['Música', 'Cultura Popular'],
    temas: ['Cultura negra', 'Periferias'],
    criado_em: quando(6),
    demo: true,
  },
  {
    id: EVENTO.aparelhagem3Noites,
    autor_id: PESSOA.dandara,
    banner: CARTAZES.aparelhagem3Noites,
    titulo: 'Mostra Aparelhagem: 3 Noites',
    data_inicio: '2026-10-16',
    data_fim: '2026-10-18',
    horario: '22:00',
    link: '#',
    formato: 'Presencial',
    estado: 'PA',
    cidade: 'Belém',
    entrada: 'Pago',
    areas: ['Música', 'Eventos'],
    temas: ['Ancestralidade', 'Memória', 'Periferias'],
    criado_em: quando(7),
    demo: true,
  },
  {
    id: EVENTO.oficinaEdital,
    autor_id: PESSOA.rita,
    banner: CARTAZES.oficinaEdital,
    titulo: 'Oficina: Como Ler um Edital de Cultura',
    data_inicio: '2026-10-24',
    data_fim: null,
    horario: '14:00',
    link: '#',
    formato: 'Online',
    // Online não tem lugar: é a mesma regra que o formulário e o banco aplicam.
    estado: null,
    cidade: null,
    entrada: 'Gratuito',
    areas: ['Educação', 'Pesquisa'],
    temas: ['Educação', 'Direitos humanos'],
    criado_em: quando(8),
    demo: true,
  },
  {
    id: EVENTO.curtasRecife,
    autor_id: PESSOA.joel,
    banner: CARTAZES.curtasRecife,
    titulo: 'Sessão de Curtas do Recife',
    data_inicio: '2026-11-08',
    data_fim: null,
    horario: '20:00',
    link: '#',
    formato: 'Presencial',
    estado: 'PE',
    cidade: 'Olinda',
    entrada: 'Gratuito',
    areas: ['Audiovisual'],
    temas: ['Juventude', 'Identidade'],
    criado_em: quando(9),
    demo: true,
  },
  {
    id: EVENTO.antologiaPiloto,
    autor_id: PESSOA.taina,
    banner: CARTAZES.antologiaPiloto,
    titulo: 'Lançamento: Antologia Piloto',
    data_inicio: '2026-08-22',
    data_fim: null,
    horario: null,
    link: '#',
    formato: 'Presencial',
    estado: 'SP',
    cidade: 'Diadema',
    entrada: 'Gratuito',
    areas: ['Literatura'],
    temas: ['Cultura negra', 'Memória'],
    criado_em: quando(4),
    demo: true,
  },
];

export const PARTICIPACOES_EXEMPLO = (() => {
  const pares = new Map<string, { discussao_id: string; participante_id: string }>();
  for (const d of DISCUSSOES_EXEMPLO) {
    pares.set(`${d.id}/${d.autor_id}`, { discussao_id: d.id, participante_id: d.autor_id });
  }
  for (const c of COMENTARIOS_EXEMPLO) {
    pares.set(`${c.discussao_id}/${c.autor_id}`,
      { discussao_id: c.discussao_id, participante_id: c.autor_id });
  }
  return [...pares.values()].map((x, i) => ({ ...x, criado_em: quando(23 + i), demo: true }));
})();
