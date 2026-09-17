/**
 * Percorre as jornadas da spec e confere os criterios de aceite das historias
 * P1 (H1 a H6) e os requisitos funcionais que dependem de interacao.
 * Roda contra o adaptador local, que e o modo padrao do `npm run dev`.
 */
import {
  ir, abrirNavegador, criarEvento, criarParticipante, daquiAUmAno, marcarChip, sair,
} from './navegador.mjs';

const passos = [];
const erros = [];

async function checar(nome, fn) {
  try { await fn(); passos.push(`  OK  ${nome}`); }
  catch (e) { erros.push(`FALHA ${nome}: ${e.message.split('\n')[0]}`); passos.push(`FALHA ${nome}`); }
}

const { navegador, pagina: p } = await abrirNavegador();
const problemasDeConsole = [];
p.on('console', (m) => { if (m.type() === 'error') problemasDeConsole.push(m.text()); });
p.on('pageerror', (e) => problemasDeConsole.push(`pageerror: ${e.message}`));

// ---------------------------------------------------------------- entrada
await ir(p, '/');
await checar('Entrada apresenta os três caminhos', () =>
  p.getByRole('heading', { name: /três caminhos/i }).waitFor({ timeout: 5000 }));

await p.getByRole('link', { name: /começar pelo meu perfil/i }).first().click();
await p.waitForURL('**/criar-conta');
await p.locator('#email').fill('kawany@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /criar conta/i }).click();

// A etapa do "já te esperavam por aqui?" entrou ANTES do formulário: quem
// deixou o @ no grupo não digita de novo o que a turma já sabe. Quem não está
// na lista chega ao formulário em branco por um clique, na mesma tela.
await checar('RF-002 primeiro login cai no começo do cadastro, não numa home vazia', () =>
  p.waitForURL('**/comecar', { timeout: 5000 }));

// O e-mail e a senha continuam sendo pedidos uma vez, em /criar-conta. O que
// faltava era o fluxo LEMBRAR disso: com sessão e sem perfil, toda porta leva
// pra cá, e a tela parecia o primeiro passo de quem nunca criou conta.
await checar('O cadastro diz qual é a conta criada', () =>
  p.getByText('kawany@exemplo.org').first().waitFor({ timeout: 3000 }));

await checar('Dá pra sair do meio do cadastro e voltar com o mesmo e-mail e senha', async () => {
  await p.getByRole('button', { name: /não é você\? sair/i }).click();
  await p.waitForURL('**/entrar', { timeout: 5000 });
  await p.locator('#email').fill('kawany@exemplo.org');
  await p.locator('#senha').fill('senha123');
  await p.getByRole('button', { name: /^entrar$/i }).click();
  await p.waitForURL('**/comecar', { timeout: 5000 });
});

await checar('Lista da turma: "sou eu" adianta nome, cidade e @ no formulário', async () => {
  await p.locator('#busca-comecar').fill('kawany');
  await p.locator('.rede').first().getByRole('button', { name: /^sou eu$/i })
    .click({ timeout: 5000 });
  await p.waitForURL('**/meu-perfil', { timeout: 5000 });
  await p.getByText(/A gente já tava te esperando/i).waitFor({ timeout: 3000 });
  const nome = await p.locator('#nome').inputValue();
  const insta = await p.locator('#instagram').inputValue();
  const cidade = await p.locator('#cidade').inputValue();
  if (nome !== 'Kawany Feliciano') throw new Error(`nome veio "${nome}"`);
  if (insta !== '@kawany_feliciano') throw new Error(`instagram veio "${insta}"`);
  if (cidade !== 'SP') throw new Error(`cidade veio "${cidade}"`);
  // O recibo da conta acompanha até o formulário: é a última tela antes de
  // publicar, e a última chance de alguém reparar que entrou na conta errada.
  await p.getByText('kawany@exemplo.org').first().waitFor({ timeout: 3000 });
});

// -------------------------------------------------------------- H1 perfil
await p.locator('#nome').fill('Kawany Feliciano');
await p.locator('#ocupacao').fill('Produtora cultural');
await p.locator('#cidade').fill('Salvador, BA');
await p.locator('#mini_bio').fill('Produzo e escrevo sobre cultura negra na Bahia.');
await marcarChip(p, 'Áreas', 'Comunicação');
await p.getByRole('button', { name: /me apresentar pra turma/i }).click();

await checar('H1 perfil sem habilidade não salva e explica por quê', async () => {
  await p.locator('.erro-campo', { hasText: /Marca ao menos uma/i }).first()
    .waitFor({ timeout: 3000 });
  if (!p.url().includes('/meu-perfil')) throw new Error('saiu da tela mesmo com erro');
});

await marcarChip(p, 'O que você sabe fazer', 'Produção');
await marcarChip(p, 'O que você sabe fazer', 'Curadoria');
await marcarChip(p, 'O que te move', 'Cultura negra');
await p.locator('#instagram').fill('@kawany');
await p.getByRole('button', { name: /me apresentar pra turma/i }).click();

await checar('H1 perfil publicado aparece imediatamente no diretório', async () => {
  await p.waitForURL('**/pessoas', { timeout: 5000 });
  await p.getByRole('link', { name: 'Kawany Feliciano' }).first().waitFor({ timeout: 3000 });
});

// ------------------------------------------------------------- H2 filtros
await p.locator('#f-habilidade').selectOption('Produção');
await checar('H2 filtro por habilidade conta o resultado', () =>
  p.locator('.contagem', { hasText: '1 pessoa na roda' }).waitFor({ timeout: 3000 }));

await p.locator('#f-habilidade').selectOption('Fotografia');
await checar('H2 filtro sem resultado sugere afrouxar, não deixa tela em branco', async () => {
  // getByRole usa o nome acessível, que resolve os <br> do título empilhado;
  // getByText leria o textContent, que concatena as linhas sem espaço.
  await p.getByRole('heading', { name: /Não achamos ninguém assim/i })
    .waitFor({ timeout: 3000 });
  await p.getByText(/Tira um filtro e tenta de novo/i).waitFor({ timeout: 3000 });
});
await p.getByRole('button', { name: /limpar filtros/i }).first().click();

// ------------------------------------------------------- as redes da turma
await checar('Gente leva pra lista de @ da turma', async () => {
  await ir(p, '/pessoas');
  await p.getByRole('link', { name: /confira as redes da turma aqui/i })
    .click({ timeout: 5000 });
  await p.waitForURL('**/gente/redes', { timeout: 5000 });
  await p.getByRole('heading', { name: /As redes da turma/i }).waitFor({ timeout: 3000 });
});

await checar('A lista traz os 139 registros e conta quem já chegou', async () => {
  const linhas = await p.locator('.rede').count();
  if (linhas !== 139) throw new Error(`${linhas} linhas, esperava 139`);
  await p.locator('.contagem', { hasText: /139 pessoas na lista/i })
    .waitFor({ timeout: 3000 });
  await p.locator('.contagem', { hasText: /1 já chegou/i }).waitFor({ timeout: 3000 });
});

await checar('Quem reivindicou aparece com "já tá aqui" e link pro perfil', async () => {
  const chip = p.locator('.rede', { hasText: '@kawany_feliciano' })
    .getByRole('link', { name: /já tá aqui/i });
  await chip.waitFor({ timeout: 3000 });
  const destino = await chip.getAttribute('href');
  if (!destino.includes('/pessoas/')) throw new Error(`link vai pra ${destino}`);
});

await checar('A busca acha por nome e por @, sem acento e sem caixa', async () => {
  await p.locator('#busca-rede').fill('GRAZIELA');
  await p.locator('.rede').first().waitFor({ timeout: 3000 });
  if (await p.locator('.rede').count() !== 1) throw new Error('busca por nome falhou');
  await p.locator('#busca-rede').fill('@mussssurana');
  if (await p.locator('.rede').count() !== 1) throw new Error('busca por @ com arroba falhou');
  await p.locator('#busca-rede').fill('');
});

await checar('O filtro de estado só oferece as UFs que existem na lista', async () => {
  const quantas = await p.locator('#uf-rede option').count();
  // 19 UFs na lista + a opção "Todos".
  if (quantas !== 20) throw new Error(`${quantas} opções, esperava 20`);
  await p.locator('#uf-rede').selectOption('BA');
  const linhas = await p.locator('.rede').count();
  if (linhas === 0 || linhas === 139) throw new Error(`filtro de UF trouxe ${linhas}`);
  await p.locator('#uf-rede').selectOption('');
});

await checar('@ abre o Instagram em aba nova, e o que parece site não vira link', async () => {
  const primeiro = p.locator('.rede__arrobas a').first();
  const href = await primeiro.getAttribute('href');
  if (!href.startsWith('https://instagram.com/')) throw new Error(`link é ${href}`);
  if (await primeiro.getAttribute('rel') !== 'noopener noreferrer') {
    throw new Error('link sem rel="noopener noreferrer"');
  }
  if (await primeiro.getAttribute('target') !== '_blank') {
    throw new Error('link não abre em aba nova');
  }
  await p.locator('#busca-rede').fill('fauxtino');
  const linha = p.locator('.rede').first();
  await linha.waitFor({ timeout: 3000 });
  if (await linha.locator('a[href*="instagram.com"]').count() > 0) {
    throw new Error('fauxtino.com.br virou link');
  }
  await p.getByText('@fauxtino.com.br').waitFor({ timeout: 3000 });
  await p.locator('#busca-rede').fill('');
});

await checar('Dá pra sair da lista sem login e sem aprovação de ninguém', async () => {
  await p.getByRole('button', { name: /esse @ é meu e eu não quero estar aqui/i }).click();
  await p.locator('#saida-handle').fill('@verdemel_');
  await p.getByRole('button', { name: /tirar da lista/i }).click();
  await p.getByText(/saiu da lista/i).waitFor({ timeout: 5000 });
  await ir(p, '/gente/redes');
  await p.locator('.rede').first().waitFor({ timeout: 3000 });
  if (await p.locator('.rede', { hasText: '@verdemel_' }).count() > 0) {
    throw new Error('o @ removido continua na lista');
  }
  await p.locator('.contagem', { hasText: /138 pessoas na lista/i })
    .waitFor({ timeout: 3000 });
});

await checar('Quem já tem perfil não repete a etapa do começo', async () => {
  await ir(p, '/comecar');
  // Quem tem perfil não passa por essa etapa: é redirecionada pro formulário.
  await p.waitForURL('**/meu-perfil', { timeout: 5000 });
});

// ------------------------------------------------- H3 projeto e H5 discussão
await ir(p, '/projetos/novo');
await p.locator('#nome').fill('Baile da Ancestralidade');
await p.locator('#o_que_e').fill('Festa-ritual mensal que cruza baile negro e memória de terreiro.');
await p.locator('#sobre').fill('Ocupar praças com som, dança e roda de conversa.');
await marcarChip(p, 'Áreas', 'Eventos');
await marcarChip(p, 'Em que pé está', 'Em desenvolvimento');
await p.getByRole('button', { name: /publicar pra turma ver/i }).click();

await checar('H3/RF-006 "busca pessoas = sim" bloqueia sem tipo e conhecimentos', async () => {
  await p.locator('.erro-campo', { hasText: /diz como seria participar/i }).waitFor({ timeout: 3000 });
  await p.locator('.erro-campo', { hasText: /diz quem você procura/i }).waitFor({ timeout: 3000 });
});

await p.locator('label.opcao', { hasText: 'Agora não' }).first().click();
await checar('H3/RF-006 com "não" os campos de participação ficam ocultos', async () => {
  if (await p.locator('legend', { hasText: 'Quem você procura' }).count() !== 0) {
    throw new Error('campos condicionais continuaram visíveis');
  }
});
await p.locator('label.opcao', { hasText: 'Tô procurando' }).click();

await marcarChip(p, 'Como seria participar', 'Trabalho voluntário');
await marcarChip(p, 'Quem você procura', 'Fotografia');
await marcarChip(p, 'Quem você procura', 'Comunicação');
await marcarChip(p, 'Temas', 'Ancestralidade');
await p.locator('#o_que_precisa').fill('Alguém para registrar em foto e cuidar da divulgação.');
await p.locator('label.opcao', { hasText: 'Quero abrir' }).click();
await p.locator('#discussao_titulo').fill('Baile é política de memória?');
await marcarChip(p, 'Tema', 'Ancestralidade');
await p.locator('#discussao_descricao').fill('Quero discutir se a festa preserva memória ou a consome.');
await p.getByRole('button', { name: /publicar pra turma ver/i }).click();

await checar('H3 projeto publicado abre a própria página', async () => {
  await p.waitForURL(/\/projetos\/[0-9a-f-]{36}$/, { timeout: 5000 });
  await p.getByRole('heading', { name: 'Baile da Ancestralidade' }).waitFor({ timeout: 3000 });
});
const urlProjeto = p.url();
if (!/\/projetos\/[0-9a-f-]{36}$/.test(urlProjeto)) {
  throw new Error(`o projeto não publicou; parou em ${urlProjeto}`);
}

await checar('RF-012 a discussão aparece na página do projeto de origem', () =>
  p.getByRole('link', { name: /Baile é política de memória/i }).waitFor({ timeout: 3000 }));

// ---------------------------------------------------- RF-013 área geral
await ir(p, '/assuntos');
await checar('RF-013 a mesma discussão aparece na área geral', () =>
  p.getByRole('link', { name: /Baile é política de memória/i }).waitFor({ timeout: 3000 }));
await p.locator('#d-tema').selectOption('Ancestralidade');
await checar('RF-013 o filtro por tema encontra a discussão', () =>
  p.locator('.contagem', { hasText: '1 assunto aberto' }).waitFor({ timeout: 3000 }));
await p.locator('#d-tema').selectOption('Juventude');
await checar('RF-013 tema sem discussão mostra estado de filtro vazio', () =>
  p.getByRole('heading', { name: /Não achamos ninguém assim/i })
    .waitFor({ timeout: 3000 }));

// ------------------------------------------------------- RF-015 tema
await ir(p, '/temas/ancestralidade');
await checar('RF-015 a página de tema traz os três blocos', async () => {
  await p.getByRole('heading', { name: /Assuntos abertos/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Projetos neste tema/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Quem se interessa/i }).waitFor({ timeout: 3000 });
});
await checar('RF-015 um bloco vazio não esvazia a página inteira', async () => {
  await p.getByRole('link', { name: 'Baile da Ancestralidade' }).first().waitFor({ timeout: 3000 });
  await p.getByText(/Ninguém marcou este tema ainda/i).waitFor({ timeout: 3000 });
});

// ------------------------------------------------ segunda pessoa na rede
await sair(p);
await criarParticipante(p, {
  email: 'rafa@exemplo.org', nome: 'Rafa Lima', ocupacao: 'Fotógrafo',
  cidade: 'Salvador, BA', bio: 'Fotografo festa, rua e o que mais aparecer.',
  area: 'Artes Visuais', habilidades: ['Fotografia'], temas: ['Ancestralidade'],
});

// --------------------------------------------------- RF-008 e H4 interesse
await p.goto(urlProjeto);
await checar('RF-008 o projeto sinaliza a correspondência de habilidade', async () => {
  await p.getByRole('heading', { name: /Você tem exatamente o que este projeto tá procurando/i })
    .waitFor({ timeout: 3000 });
  await p.locator('.correspondencia .chip', { hasText: 'Fotografia' }).first()
    .waitFor({ timeout: 3000 });
});

await marcarChip(p, 'Como você topa entrar', 'Trabalho voluntário');
await p.locator('#mensagem').fill('Faço o registro fotográfico de graça, tenho equipamento.');
await p.getByRole('button', { name: /^quero chegar junto$/i }).click();
await checar('H4 o interesse fica registrado', () =>
  p.getByText(/Você já chegou junto aqui/i).waitFor({ timeout: 4000 }));

await p.reload();
await checar('H4/RN-008 ao voltar, o botão diz que já se candidatou', async () => {
  const b = p.getByRole('button', { name: /^você já chegou junto$/i });
  await b.waitFor({ timeout: 4000 });
  if (!(await b.isDisabled())) throw new Error('o botão não está desabilitado');
});

// ------------------------------------------------ RN-006 e H6 discussão
await ir(p, '/assuntos');
await p.getByRole('link', { name: /Baile é política de memória/i }).click();
await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/);
await checar('H6 discussão sem respostas convida a ser a primeira voz', () =>
  p.getByRole('heading', { name: /Seja a primeira voz/i }).waitFor({ timeout: 3000 }));
await p.getByRole('button', { name: /^participar$/i }).click();
await checar('RN-006 quem não tem relação com o projeto entra na discussão', () =>
  p.getByText(/Você tá nessa/i).waitFor({ timeout: 4000 }));
await p.locator('#comentario').fill('Preserva se der crédito e pagar quem carrega a memória.');
await p.getByRole('button', { name: /^mandar$/i }).click();
await checar('H6 o comentário entra na conversa', () =>
  p.getByText(/preserva se der crédito/i).waitFor({ timeout: 4000 }));

// ------------------------------------------- assunto solto, sem projeto
await ir(p, '/assuntos');
await p.getByRole('link', { name: /puxar um assunto/i }).first().click();
await p.waitForURL(/\/assuntos\/novo$/);

await checar('Assunto solto: sem projeto publicado, o campo de projeto nem aparece', async () => {
  // Rafa não publicou projeto nenhum, então não há o que ligar.
  if (await p.locator('#projeto').count() !== 0) {
    throw new Error('o campo de projeto apareceu sem projeto pra ligar');
  }
});

await p.locator('#titulo').fill('Cachê justo em coletivo é possível?');
await marcarChip(p, 'Tema da conversa', 'Periferias');
await p.locator('#descricao').fill('Quero conversar sobre como dividir grana sem furar ninguém.');
await p.getByRole('button', { name: /^puxar assunto$/i }).click();

await checar('Assunto solto é criado sem projeto de origem', async () => {
  await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/, { timeout: 5000 });
  await p.getByRole('heading', { name: /Cachê justo em coletivo/i }).waitFor({ timeout: 3000 });
});
const urlAssuntoSolto = p.url();

await checar('Assunto solto não mostra nada no lugar da origem', async () => {
  if (await p.getByText(/a partir de/i).count() !== 0) {
    throw new Error('mostrou origem num assunto sem projeto');
  }
});

await ir(p, '/assuntos');
await checar('Área geral mostra o assunto solto e o ligado', async () => {
  await p.getByRole('link', { name: /Cachê justo em coletivo/i }).waitFor({ timeout: 3000 });
  await p.getByRole('link', { name: /Baile é política de memória/i }).waitFor({ timeout: 3000 });
});

await checar('Assunto ligado mostra "a partir de" com link para o projeto', async () => {
  const card = p.locator('.card', { hasText: 'Baile é política de memória' }).first();
  await card.getByText(/a partir de/i).waitFor({ timeout: 3000 });
  await card.getByRole('link', { name: 'Baile da Ancestralidade' }).waitFor({ timeout: 3000 });
});

await ir(p, '/temas/periferias');
await checar('Página de tema mostra o assunto solto', () =>
  p.getByRole('link', { name: /Cachê justo em coletivo/i }).waitFor({ timeout: 3000 }));

await p.goto(urlProjeto);
await checar('Página do projeto mostra só os assuntos ligados a ele', async () => {
  await p.getByRole('link', { name: /Baile é política de memória/i }).waitFor({ timeout: 3000 });
  const secao = p.locator('section.faixa').filter({
    has: p.getByRole('heading', { name: /Assuntos deste projeto/i }),
  });
  if (await secao.count() === 0) throw new Error('não achei a seção de assuntos do projeto');
  if (await secao.getByRole('link', { name: /Cachê justo em coletivo/i }).count() !== 0) {
    throw new Error('o assunto solto vazou para a página do projeto');
  }
});

// ----------------------------------------------------- RF-010 interessados
await sair(p);
await ir(p, '/entrar');
await p.locator('#email').fill('kawany@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /^entrar$/i }).click();
await p.waitForURL('**/pessoas');

await p.goto(`${urlProjeto}/quem-chegou-junto`);
await checar('RF-010 a autora vê perfil completo e mensagem de quem chegou', async () => {
  await p.getByRole('link', { name: 'Rafa Lima' }).first().waitFor({ timeout: 4000 });
  await p.getByText(/Faço o registro fotográfico de graça/i).waitFor({ timeout: 3000 });
  await p.getByText(/Bate com quem você procura/i).waitFor({ timeout: 3000 });
});

await ir(p, '/assuntos/novo');
await checar('Com projeto publicado, o campo "Ligar a um projeto meu" aparece', async () => {
  await p.locator('#projeto').waitFor({ timeout: 3000 });
  const opcoes = await p.locator('#projeto option').allInnerTexts();
  if (!opcoes.some((o) => /nenhum/i.test(o))) throw new Error('faltou a opção "nenhum"');
  if (!opcoes.includes('Baile da Ancestralidade')) throw new Error('faltou o projeto dela');
});

await checar('RF-017 quem abriu o assunto pode apagá-lo', async () => {
  await p.goto(urlProjeto);
  await p.getByRole('link', { name: /Baile é política de memória/i }).click();
  await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/);
  await p.getByRole('button', { name: /apagar este assunto/i }).waitFor({ timeout: 3000 });
});

// ------------------------------------------------------ mural de eventos
await checar('O mural começa vazio dizendo o que fazer', async () => {
  await ir(p, '/eventos');
  await p.getByRole('heading', { name: /ainda não tem nada no mural/i })
    .waitFor({ timeout: 3000 });
});

await checar('O formulário não publica sem cartaz, data, link e área', async () => {
  await ir(p, '/eventos/novo');
  await p.getByRole('button', { name: /publicar no mural/i }).click();
  for (const esperado of [/falta o cartaz/i, /falta o nome/i, /quando começa/i,
                          /falta o link/i, /ao menos uma área/i]) {
    await p.locator('.erro-campo', { hasText: esperado }).first().waitFor({ timeout: 3000 });
  }
});

await checar('Online esconde estado e cidade e não os exige', async () => {
  await p.locator('label.opcao', { hasText: /^Presencial$/ }).first().click();
  await p.locator('#estado').waitFor({ timeout: 3000 });
  await p.locator('label.opcao', { hasText: /^Online$/ }).first().click();
  await p.locator('#estado').waitFor({ state: 'detached', timeout: 3000 });
  if (await p.locator('#cidade').count() !== 0) throw new Error('a cidade continuou na tela');
});

const urlEvento = await criarEvento(p, {
  titulo: 'Baile da Virada Preta', inicio: daquiAUmAno('11-28'), hora: '19:00',
  uf: 'BA', cidade: 'Salvador', entrada: 'Gratuito',
  areas: ['Música', 'Cultura Popular', 'Dança'], temas: ['Ancestralidade'],
  link: 'instagram.com/bailedaviradapreta',
});

await checar('O link colado sem http vira https em vez de ser recusado', async () => {
  const destino = await p.getByRole('link', { name: /ir para o evento/i })
    .getAttribute('href');
  if (destino !== 'https://instagram.com/bailedaviradapreta') {
    throw new Error(`href é ${destino}`);
  }
});

await checar('O botão do evento abre fora, em outra aba', async () => {
  const botao = p.getByRole('link', { name: /ir para o evento/i });
  if (await botao.getAttribute('target') !== '_blank'
      || await botao.getAttribute('rel') !== 'noopener noreferrer') {
    throw new Error('o link de saída não está protegido');
  }
});

await checar('O mural mostra o evento agrupado por mês', async () => {
  await ir(p, '/eventos');
  await p.getByRole('heading', { name: /Baile da Virada Preta/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /NOVEMBRO DE/i }).waitFor({ timeout: 3000 });
  await p.getByText(/1 evento chegando/i).waitFor({ timeout: 3000 });
});

await checar('O card do evento traz selo de data, lugar e entrada', async () => {
  const card = p.locator('.card--evento').first();
  await card.locator('.selo-data', { hasText: '28' }).waitFor({ timeout: 3000 });
  await card.getByText('Salvador, BA').waitFor({ timeout: 3000 });
  await card.getByText(/^Grátis$/).waitFor({ timeout: 3000 });
  // Duas áreas no máximo; o resto vira "+N".
  await card.getByText('+1').waitFor({ timeout: 3000 });
});

await checar('Filtro sem resultado sugere tirar um filtro, não some com a página', async () => {
  await p.locator('#ev-entrada').selectOption('Pago');
  await p.getByRole('heading', { name: /não tem nada assim por aqui/i })
    .waitFor({ timeout: 3000 });
  await p.getByRole('button', { name: /limpar filtros/i }).first().click();
  await p.getByRole('heading', { name: /Baile da Virada Preta/i }).waitFor({ timeout: 3000 });
});

await checar('Evento que já rolou sai do mural e fica atrás do link', async () => {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const p2 = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}`
    + `-${String(ontem.getDate()).padStart(2, '0')}`;
  await criarEvento(p, {
    titulo: 'Roda Que Já Passou', inicio: p2, uf: 'BA', cidade: 'Salvador',
    entrada: 'Gratuito', areas: ['Música'], link: 'instagram.com/roda',
  });
  await ir(p, '/eventos');
  if (await p.getByRole('heading', { name: /Roda Que Já Passou/i }).count() !== 0) {
    throw new Error('evento vencido ficou na listagem principal');
  }
  await p.getByRole('button', { name: /ver o que já rolou/i }).click();
  await p.getByRole('heading', { name: /Roda Que Já Passou/i }).waitFor({ timeout: 3000 });
});

await checar('O tema junta o evento com as pessoas e os projetos', async () => {
  await ir(p, '/temas/ancestralidade');
  await p.getByRole('heading', { name: /Eventos com este tema/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Baile da Virada Preta/i }).waitFor({ timeout: 3000 });
});

await checar('Meu espaço lista os meus eventos com editar', async () => {
  await ir(p, '/meu-espaco');
  await p.getByRole('heading', { name: /Meus eventos/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Baile da Virada Preta/i }).waitFor({ timeout: 3000 });
});

await checar('Só a autora vê apagar, e apagar pede confirmação', async () => {
  await p.goto(urlEvento);
  await p.getByRole('button', { name: /^apagar$/i }).click();
  await p.getByRole('heading', { name: /apagar este evento/i }).waitFor({ timeout: 3000 });
  await p.getByRole('button', { name: /deixa pra lá/i }).click();
  await p.getByRole('button', { name: /^apagar$/i }).waitFor({ timeout: 3000 });
});

await checar('A barra do celular troca Meu espaço pelo mural', async () => {
  await ir(p, '/pessoas');
  const barra = p.locator('.barra-baixo');
  await barra.getByRole('link', { name: 'Eventos' }).waitFor({ timeout: 3000 });
  if (await barra.getByRole('link', { name: 'Meu espaço' }).count() !== 0) {
    throw new Error('Meu espaço continuou na barra — são cinco alvos em 390px');
  }
  // Ele virou o avatar no canto do cabeçalho.
  await p.getByRole('link', { name: 'Meu espaço' }).click();
  await p.waitForURL('**/meu-espaco', { timeout: 3000 });
});

// -------------------------------------------------------- marca e rodapé
await checar('O lema anda com a marca sem entrar no nome do link', async () => {
  await ir(p, '/pessoas');
  await p.locator('.marca__lema').waitFor({ timeout: 3000 });
  await p.getByText('(É tudo que nóiz tem)').waitFor({ timeout: 3000 });
  // Dentro do link, o lema viraria o nome acessível do botão de voltar pra
  // home, repetido em toda tela por quem navega por leitor de tela.
  const nome = await p.getByRole('link', { name: /^Nóiz$/i }).count();
  if (nome !== 1) throw new Error('o link da marca deixou de se chamar só "Nóiz"');
});

await checar('O rodapé diz quem construiu, com nome', async () => {
  await p.locator('.rodape')
    .getByText(/projeto independente construído pela aluna Kawany Feliciano/i)
    .waitFor({ timeout: 3000 });
});

// ---------------------------------------------------------------- home
await checar('A marca leva à home de quem já está dentro', async () => {
  await ir(p, '/pessoas');
  await p.getByRole('link', { name: /^Nóiz$/i }).click();
  await p.waitForURL('**/inicio', { timeout: 3000 });
  await p.getByRole('heading', { name: /ainda não\s*se encontrou/i }).waitFor({ timeout: 3000 });
});

await checar('A home troca os botões de fora pelos de dentro', async () => {
  await p.getByRole('link', { name: /Ver a turma/i }).waitFor({ timeout: 3000 });
  if (await p.getByRole('link', { name: /Começar pelo meu perfil/i }).count() > 0) {
    throw new Error('a home oferece criar conta a quem já entrou');
  }
});

await checar('A home diz que o site não é da Escola B', () =>
  p.getByText(/não é da Escola B nem do BATEKOO/i).waitFor({ timeout: 3000 }));

await checar('A mini bio começa recolhida e abre no clique', async () => {
  const resto = p.locator('#bio-resto');
  const botao = p.getByRole('button', { name: /Ler o resto/i });
  if (await resto.isVisible()) throw new Error('o resto da bio já começa aberto');
  await botao.click();
  await resto.waitFor({ state: 'visible', timeout: 3000 });
  await p.getByText(/não sabe fazer as coisas pela metade/i).waitFor({ timeout: 3000 });
  await p.getByRole('button', { name: /Recolher/i }).click();
  await resto.waitFor({ state: 'hidden', timeout: 3000 });
});

await checar('A bio tem o espaço da foto ao lado do texto', async () => {
  const retrato = p.locator('.retrato');
  await retrato.waitFor({ timeout: 3000 });
  const foto = await retrato.boundingBox();
  const texto = await p.locator('.bio__texto').boundingBox();
  // Com ou sem o arquivo da foto, o espaço existe. Acima de 40rem ele fica ao
  // lado do texto; a suíte roda a 390px, onde as duas colunas viram uma.
  if (foto.width < 100) throw new Error(`o espaço da foto ficou com ${foto.width}px`);
  if (foto.y + foto.height > texto.y + 1) {
    throw new Error('a foto não está antes do texto');
  }
});

await checar('O botão do WhatsApp aponta pro número certo, em outra aba', async () => {
  const zap = p.getByRole('link', { name: /WhatsApp/i });
  const destino = await zap.getAttribute('href');
  if (destino !== 'https://wa.me/5511940391863') throw new Error(`href é ${destino}`);
  if (await zap.getAttribute('rel') !== 'noopener noreferrer') {
    throw new Error('link externo sem rel="noopener noreferrer"');
  }
});

// ------------------------------------------------- navegacao do celular
await ir(p, '/pessoas');

await checar('A barra do celular leva de uma seção a outra', async () => {
  await p.locator('.barra-baixo').getByRole('link', { name: 'Projetos' }).click();
  await p.waitForURL('**/projetos', { timeout: 3000 });
});

await checar('A barra diz em que seção a pessoa está', async () => {
  const atual = p.locator('.barra-baixo a[aria-current="page"]');
  await atual.waitFor({ timeout: 3000 });
  const texto = (await atual.innerText()).trim();
  if (!/projetos/i.test(texto)) throw new Error(`marcou "${texto}", não Projetos`);
});

await checar('O menu guarda só o que é secundário', async () => {
  await p.getByRole('button', { name: /^Menu$/i }).click();
  const menu = p.getByRole('dialog', { name: /menu/i });
  await menu.getByRole('link', { name: /Temas/i }).waitFor({ timeout: 3000 });
  await menu.getByRole('button', { name: /^Sair$/i }).waitFor({ timeout: 3000 });
  // O que está na barra não se repete aqui: seriam dois caminhos pro mesmo lugar.
  if (await menu.getByRole('link', { name: 'Gente' }).count() > 0) {
    throw new Error('o menu repete um item que já está na barra');
  }
});

await checar('Dá pra fechar o menu e continuar de onde estava', async () => {
  await p.getByRole('button', { name: /fechar/i }).click();
  await p.getByRole('dialog', { name: /menu/i }).waitFor({ state: 'hidden', timeout: 3000 });
  if (!p.url().includes('/projetos')) throw new Error('saiu da página ao abrir o menu');
});

// -------------------------------------------------- responsividade 390px
await checar('Nenhuma tela rola na horizontal a 390px', async () => {
  for (const rota of ['/pessoas', '/projetos', '/assuntos', '/temas',
                      '/temas/ancestralidade', '/meu-espaco', '/meu-perfil',
                      '/eventos', '/eventos/novo', '/gente/redes',
                      urlProjeto, urlEvento]) {
    await (rota.startsWith('http') ? p.goto(rota) : ir(p, rota));
    await p.waitForTimeout(250);
    const estoura = await p.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (estoura) throw new Error(`${rota} rola na horizontal`);
  }
});

await navegador.close();

console.log(passos.join('\n'));
if (problemasDeConsole.length) {
  console.log('\nErros de console do navegador:');
  console.log(problemasDeConsole.slice(0, 10).join('\n'));
}
const ok = passos.filter((s) => s.startsWith('  OK')).length;
console.log(`\n=== ${ok} verificações OK, ${erros.length} falhas ===`);
if (erros.length || problemasDeConsole.length) {
  if (erros.length) console.log(erros.join('\n'));
  process.exit(1);
}
