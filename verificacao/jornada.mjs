/**
 * Percorre as jornadas da spec e confere os criterios de aceite das historias
 * P1 (H1 a H6) e os requisitos funcionais que dependem de interacao.
 * Roda contra o adaptador local, que e o modo padrao do `npm run dev`.
 */
import { ir, abrirNavegador, criarParticipante, marcarChip, sair } from './navegador.mjs';

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

await p.getByRole('link', { name: /criar meu perfil/i }).first().click();
await p.waitForURL('**/criar-conta');
await p.locator('#email').fill('kawany@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /criar conta/i }).click();

await checar('RF-002 primeiro login cai direto no formulário de perfil', () =>
  p.waitForURL('**/meu-perfil', { timeout: 5000 }));

// -------------------------------------------------------------- H1 perfil
await p.locator('#nome').fill('Kawany Feliciano');
await p.locator('#ocupacao').fill('Produtora cultural');
await p.locator('#cidade').fill('Salvador, BA');
await p.locator('#mini_bio').fill('Produzo e escrevo sobre cultura negra na Bahia.');
await marcarChip(p, 'Áreas', 'Comunicação');
await p.getByRole('button', { name: /publicar meu perfil/i }).click();

await checar('H1 perfil sem habilidade não salva e explica por quê', async () => {
  await p.locator('.erro-campo', { hasText: /Escolha ao menos uma/i }).first()
    .waitFor({ timeout: 3000 });
  if (!p.url().includes('/meu-perfil')) throw new Error('saiu da tela mesmo com erro');
});

await marcarChip(p, 'Habilidades que ofereço', 'Produção');
await marcarChip(p, 'Habilidades que ofereço', 'Curadoria');
await marcarChip(p, 'Temas que me interessam', 'Cultura negra');
await p.locator('#instagram').fill('@kawany');
await p.getByRole('button', { name: /publicar meu perfil/i }).click();

await checar('H1 perfil publicado aparece imediatamente no diretório', async () => {
  await p.waitForURL('**/pessoas', { timeout: 5000 });
  await p.getByRole('link', { name: 'Kawany Feliciano' }).first().waitFor({ timeout: 3000 });
});

// ------------------------------------------------------------- H2 filtros
await p.locator('#f-habilidade').selectOption('Produção');
await checar('H2 filtro por habilidade conta o resultado', () =>
  p.locator('.contagem', { hasText: '1 pessoa' }).waitFor({ timeout: 3000 }));

await p.locator('#f-habilidade').selectOption('Fotografia');
await checar('H2 filtro sem resultado sugere afrouxar, não deixa tela em branco', () =>
  p.getByText(/Ninguém com essa combinação/i).waitFor({ timeout: 3000 }));
await p.getByRole('button', { name: /limpar filtros/i }).first().click();

// ------------------------------------------------- H3 projeto e H5 discussão
await ir(p, '/projetos/novo');
await p.locator('#nome').fill('Baile da Ancestralidade');
await p.locator('#o_que_e').fill('Festa-ritual mensal que cruza baile negro e memória de terreiro.');
await p.locator('#sobre').fill('Ocupar praças com som, dança e roda de conversa.');
await marcarChip(p, 'Áreas', 'Eventos');
await marcarChip(p, 'Estágio', 'Em desenvolvimento');
await p.getByRole('button', { name: /^publicar projeto$/i }).click();

await checar('H3/RF-006 "busca pessoas = sim" bloqueia sem tipo e conhecimentos', async () => {
  await p.locator('.erro-campo', { hasText: /diga em que regime/i }).waitFor({ timeout: 3000 });
  await p.locator('.erro-campo', { hasText: /que conhecimentos procura/i }).waitFor({ timeout: 3000 });
});

await p.locator('label.opcao', { hasText: 'Não, por enquanto não' }).click();
await checar('H3/RF-006 com "não" os campos de participação ficam ocultos', async () => {
  if (await p.locator('legend', { hasText: 'Conhecimentos procurados' }).count() !== 0) {
    throw new Error('campos condicionais continuaram visíveis');
  }
});
await p.locator('label.opcao', { hasText: 'Sim, estou buscando' }).click();

await marcarChip(p, 'Tipo de participação', 'Trabalho voluntário');
await marcarChip(p, 'Conhecimentos procurados', 'Fotografia');
await marcarChip(p, 'Conhecimentos procurados', 'Comunicação');
await marcarChip(p, 'Temas', 'Ancestralidade');
await p.locator('#o_que_precisa').fill('Alguém para registrar em foto e cuidar da divulgação.');
await p.locator('label.opcao', { hasText: 'Quero abrir' }).click();
await p.locator('#discussao_titulo').fill('Baile é política de memória?');
await marcarChip(p, 'Tema da discussão', 'Ancestralidade');
await p.locator('#discussao_descricao').fill('Quero discutir se a festa preserva memória ou a consome.');
await p.getByRole('button', { name: /^publicar projeto$/i }).click();

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
await ir(p, '/discussoes');
await checar('RF-013 a mesma discussão aparece na área geral', () =>
  p.getByRole('link', { name: /Baile é política de memória/i }).waitFor({ timeout: 3000 }));
await p.locator('#d-tema').selectOption('Ancestralidade');
await checar('RF-013 o filtro por tema encontra a discussão', () =>
  p.locator('.contagem', { hasText: '1 discussão' }).waitFor({ timeout: 3000 }));
await p.locator('#d-tema').selectOption('Juventude');
await checar('RF-013 tema sem discussão mostra estado de filtro vazio', () =>
  p.getByText(/Ninguém com essa combinação/i).waitFor({ timeout: 3000 }));

// ------------------------------------------------------- RF-015 tema
await ir(p, '/temas/ancestralidade');
await checar('RF-015 a página de tema traz os três blocos', async () => {
  await p.getByRole('heading', { name: /Discussões abertas/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Projetos neste tema/i }).waitFor({ timeout: 3000 });
  await p.getByRole('heading', { name: /Quem se interessa/i }).waitFor({ timeout: 3000 });
});
await checar('RF-015 um bloco vazio não esvazia a página inteira', async () => {
  await p.getByRole('link', { name: 'Baile da Ancestralidade' }).first().waitFor({ timeout: 3000 });
  await p.getByText(/Ninguém declarou ainda/i).waitFor({ timeout: 3000 });
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
  await p.getByRole('heading', { name: /Você serve para cá/i }).waitFor({ timeout: 3000 });
  await p.locator('.faixa--amarelo .chip', { hasText: 'Fotografia' }).first()
    .waitFor({ timeout: 3000 });
});

await marcarChip(p, 'Como você quer participar', 'Trabalho voluntário');
await p.locator('#mensagem').fill('Faço o registro fotográfico de graça, tenho equipamento.');
await p.getByRole('button', { name: /enviar meu interesse/i }).click();
await checar('H4 o interesse fica registrado', () =>
  p.getByText(/Você já manifestou interesse aqui/i).waitFor({ timeout: 4000 }));

await p.reload();
await checar('H4/RN-008 ao voltar, o botão diz que já se candidatou', async () => {
  const b = p.getByRole('button', { name: /interesse registrado/i });
  await b.waitFor({ timeout: 4000 });
  if (!(await b.isDisabled())) throw new Error('o botão não está desabilitado');
});

// ------------------------------------------------ RN-006 e H6 discussão
await ir(p, '/discussoes');
await p.getByRole('link', { name: /Baile é política de memória/i }).click();
await p.waitForURL(/\/discussoes\/[0-9a-f-]{36}$/);
await checar('H6 discussão sem respostas convida a ser a primeira voz', () =>
  p.getByRole('heading', { name: /Seja a primeira voz/i }).waitFor({ timeout: 3000 }));
await p.getByRole('button', { name: /^participar$/i }).click();
await checar('RN-006 quem não tem relação com o projeto entra na discussão', () =>
  p.getByText(/Você está nesta conversa/i).waitFor({ timeout: 4000 }));
await p.locator('#comentario').fill('Preserva se der crédito e pagar quem carrega a memória.');
await p.getByRole('button', { name: /^enviar$/i }).click();
await checar('H6 o comentário entra na conversa', () =>
  p.getByText(/preserva se der crédito/i).waitFor({ timeout: 4000 }));

// ----------------------------------------------------- RF-010 interessados
await sair(p);
await ir(p, '/entrar');
await p.locator('#email').fill('kawany@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /^entrar$/i }).click();
await p.waitForURL('**/pessoas');

await p.goto(`${urlProjeto}/interessados`);
await checar('RF-010 a autora vê perfil completo e mensagem de quem chegou', async () => {
  await p.getByRole('link', { name: 'Rafa Lima' }).first().waitFor({ timeout: 4000 });
  await p.getByText(/Faço o registro fotográfico de graça/i).waitFor({ timeout: 3000 });
  await p.getByText(/Bate com o que você procura/i).waitFor({ timeout: 3000 });
});

// -------------------------------------------------- responsividade 390px
await checar('Nenhuma tela rola na horizontal a 390px', async () => {
  for (const rota of ['/pessoas', '/projetos', '/discussoes', '/temas',
                      '/temas/ancestralidade', '/meu-espaco', '/meu-perfil', urlProjeto]) {
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
