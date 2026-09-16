/**
 * Lote de demonstração: conta o que foi criado, diz quais páginas de tema
 * ficaram com conteúdo, confere que nenhum card estoura em 390px, e verifica as
 * regras do lote — selo em todo card, perfis que não entram, e apagar que só
 * apaga o que é de exemplo.
 */
import { ir, abrirNavegador, criarParticipante } from './navegador.mjs';

const TEMAS = [
  ['Cultura negra', 'cultura-negra'], ['Cultura afro-brasileira', 'cultura-afro-brasileira'],
  ['LGBTQIA+', 'lgbtqia'], ['Juventude', 'juventude'], ['Periferias', 'periferias'],
  ['Ancestralidade', 'ancestralidade'], ['Memória', 'memoria'], ['Identidade', 'identidade'],
  ['Educação', 'educacao'], ['Direitos humanos', 'direitos-humanos'], ['Outro', 'outro'],
];

const CONTAR = () => {
  const b = JSON.parse(localStorage.getItem('rede-escola-b/v1') ?? '{}');
  const demo = (lista) => (lista ?? []).filter((x) => x.demo).length;
  const real = (lista) => (lista ?? []).filter((x) => !x.demo).length;
  return {
    contas: (b.contas ?? []).length,
    pessoas: { demo: demo(b.participantes), real: real(b.participantes) },
    projetos: { demo: demo(b.projetos), real: real(b.projetos) },
    assuntos: { demo: demo(b.discussoes), real: real(b.discussoes) },
    comentarios: { demo: demo(b.comentarios), real: real(b.comentarios) },
    interesses: { demo: demo(b.interesses), real: real(b.interesses) },
    participacoes: { demo: demo(b.participacoes), real: real(b.participacoes) },
    eventos: { demo: demo(b.eventos), real: real(b.eventos) },
  };
};

const ESTOUROU = () => document.documentElement.scrollWidth > window.innerWidth + 1;

const problemas = [];
const { navegador, pagina: p } = await abrirNavegador();
const errosDeConsole = [];
p.on('pageerror', (e) => errosDeConsole.push(e.message));

// Uma pessoa de verdade, que NÃO faz parte do lote.
await criarParticipante(p, {
  email: 'real@exemplo.org', nome: 'Kawany Feliciano', ocupacao: 'Produtora cultural',
  cidade: 'Salvador, BA', bio: 'Produzo e escrevo sobre cultura negra na Bahia.',
  area: 'Comunicação', habilidades: ['Produção'], temas: ['Ancestralidade'],
});

await ir(p, '/meu-espaco');
await p.getByRole('button', { name: /carregar dados de exemplo/i }).click();
await p.waitForTimeout(900);

const contagem = await p.evaluate(CONTAR);
console.log('REGISTROS CRIADOS (exemplo / de verdade)');
for (const [tipo, n] of Object.entries(contagem)) {
  if (tipo === 'contas') continue;
  console.log(`  ${tipo.padEnd(14)} ${String(n.demo).padStart(2)} / ${n.real}`);
}
console.log(`  contas de login para o lote: ${contagem.contas - 1} ` +
  `(o total inclui 1 conta de verdade)`);

if (contagem.contas !== 1) {
  problemas.push('o lote criou conta de login — os perfis de exemplo deviam ser só leitura');
}
if (contagem.pessoas.real !== 1) {
  problemas.push(`${contagem.pessoas.real} perfis de verdade — deveria ser só o seu`);
}

// --- páginas de tema: quais ficaram com conteúdo ---
console.log('\nPÁGINAS DE TEMA');
const vazios = [];
for (const [nome, slug] of TEMAS) {
  await ir(p, `/temas/${slug}`);
  await p.waitForTimeout(320);
  const blocos = await p.evaluate(() => {
    // Estado vazio também é um .card ("Ninguém marcou este tema ainda"), então
    // contar .card daria 1 em todo bloco. Conteúdo de verdade é o card que
    // leva a uma página de detalhe.
    const ehConteudo = (c) => [...c.querySelectorAll('a[href]')].some(
      (a) => /\/(projetos|eventos|assuntos|pessoas)\/[0-9a-f]{8}-/
        .test(a.getAttribute('href') || ''));
    const secoes = [...document.querySelectorAll('.faixa')].slice(1);
    return secoes.map((s) => [...s.querySelectorAll('.card')].filter(ehConteudo).length);
  });
  // A ordem dos blocos na página do tema: assuntos, eventos, projetos, pessoas.
  const [assuntos = 0, eventos = 0, projetos = 0, pessoas = 0] = blocos;
  const cheio = assuntos + eventos + projetos + pessoas > 0;
  if (!cheio) vazios.push(nome);
  console.log(`  ${cheio ? '✓' : '·'} ${nome.padEnd(24)} ` +
    `assuntos ${assuntos} · eventos ${eventos} · projetos ${projetos} · pessoas ${pessoas}`);
  if (await p.evaluate(ESTOUROU)) problemas.push(`/temas/${slug} rola na horizontal`);
}
console.log(`  → ${TEMAS.length - vazios.length} temas com conteúdo, ` +
  `${vazios.length} vazios${vazios.length ? ': ' + vazios.join(', ') : ''}`);

// --- selo EXEMPLO e estouro horizontal em toda página com dados ---
console.log('\nSELO E LARGURA');
for (const rota of ['/pessoas', '/projetos', '/eventos', '/assuntos', '/temas',
                    '/meu-espaco']) {
  await ir(p, rota);
  await p.waitForTimeout(350);
  const r = await p.evaluate(() => ({
    cards: document.querySelectorAll('.card').length,
    selos: document.querySelectorAll('.selo-exemplo').length,
    estourou: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  console.log(`  ${rota.padEnd(14)} cards ${r.cards} · selos ${r.selos}` +
    `${r.estourou ? '  ESTOUROU' : ''}`);
  if (r.estourou) problemas.push(`${rota} rola na horizontal`);
}

// Todo card de pessoa, projeto, evento e assunto do lote tem selo. No mural são
// quatro: o quinto evento já rolou e só aparece atrás de "Ver o que já rolou".
for (const [rota, esperado] of [['/pessoas', 4], ['/projetos', 4], ['/eventos', 4],
                                ['/assuntos', 4]]) {
  await ir(p, rota);
  await p.waitForTimeout(320);
  const selos = await p.evaluate(() => document.querySelectorAll('.selo-exemplo').length);
  if (selos !== esperado) {
    problemas.push(`${rota}: ${selos} selos EXEMPLO, esperado ${esperado}`);
  }
}

// --- detalhe de cada projeto, assunto e perfil do lote ---
const detalhes = await p.evaluate(() => {
  const b = JSON.parse(localStorage.getItem('rede-escola-b/v1') ?? '{}');
  return {
    projetos: (b.projetos ?? []).filter((x) => x.demo).map((x) => x.id),
    assuntos: (b.discussoes ?? []).filter((x) => x.demo).map((x) => x.id),
    pessoas: (b.participantes ?? []).filter((x) => x.demo).map((x) => x.id),
  };
});
for (const [grupo, prefixo] of [['projetos', '/projetos'], ['assuntos', '/assuntos'],
                                ['pessoas', '/pessoas']]) {
  for (const id of detalhes[grupo]) {
    await ir(p, `${prefixo}/${id}`);
    await p.waitForTimeout(320);
    if (await p.evaluate(ESTOUROU)) problemas.push(`${prefixo}/${id} rola na horizontal`);
  }
}
// A tela de quem chegou junto precisa ser visitável: os projetos do lote são de
// perfis fictícios, e sem a brecha para registros de exemplo ela ficaria fechada.
const comInteressados = await p.evaluate(() => {
  const b = JSON.parse(localStorage.getItem('rede-escola-b/v1') ?? '{}');
  return (b.interesses ?? []).find((i) => i.demo)?.projeto_id ?? null;
});
await ir(p, `/projetos/${comInteressados}/quem-chegou-junto`);
await p.waitForTimeout(500);
const interessados = await p.evaluate(
  () => document.querySelectorAll('.card').length);
console.log(`  quem chegou junto: ${interessados} pessoa(s) na tela`);
if (interessados < 2) {
  problemas.push('a tela de quem chegou junto não mostrou os interessados do lote');
}
if (await p.evaluate(ESTOUROU)) problemas.push('quem-chegou-junto rola na horizontal');
console.log(`  detalhes conferidos: ${detalhes.projetos.length} projetos, ` +
  `${detalhes.assuntos.length} assuntos, ${detalhes.pessoas.length} perfis`);

// --- perfil de exemplo não entra ---
await ir(p, '/meu-espaco');
await p.getByRole('button', { name: /^menu$/i }).click();
await p.locator('.menu-cheio').getByRole('button', { name: /^sair$/i }).click();
await p.getByRole('link', { name: /começar pelo meu perfil/i }).first().waitFor();
await ir(p, '/entrar');
await p.locator('#email').fill('dandara@exemplo.invalido');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /^entrar$/i }).click();
await p.waitForTimeout(600);
const entrou = !/\/entrar$/.test(p.url().replace(/#/, ''));
console.log(`\nPERFIL DE EXEMPLO CONSEGUE ENTRAR: ${entrou ? 'SIM' : 'não'}`);
if (entrou) problemas.push('um perfil de exemplo conseguiu fazer login');

// --- apagar remove só o que é de exemplo ---
await p.locator('#email').fill('real@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /^entrar$/i }).click();
await p.waitForURL('**/pessoas');
await ir(p, '/meu-espaco');
await p.getByRole('button', { name: /apagar dados de exemplo/i }).click();
await p.waitForTimeout(900);
const depois = await p.evaluate(CONTAR);
console.log('\nDEPOIS DE APAGAR (exemplo / de verdade)');
for (const [tipo, n] of Object.entries(depois)) {
  if (tipo === 'contas') continue;
  console.log(`  ${tipo.padEnd(14)} ${String(n.demo).padStart(2)} / ${n.real}`);
}
for (const [tipo, n] of Object.entries(depois)) {
  if (tipo === 'contas') continue;
  if (n.demo !== 0) problemas.push(`sobrou ${n.demo} registro de exemplo em ${tipo}`);
}
if (depois.pessoas.real !== 1) problemas.push('o apagar levou junto um registro de verdade');

if (errosDeConsole.length) problemas.push(`erro de página: ${errosDeConsole[0]}`);

await navegador.close();
console.log(problemas.length === 0
  ? '\n=== lote de exemplo: nenhuma falha ==='
  : `\n=== ${problemas.length} falhas ===\n${problemas.join('\n')}`);
process.exit(problemas.length === 0 ? 0 : 1);
