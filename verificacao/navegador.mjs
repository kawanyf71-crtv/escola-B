import { chromium } from 'playwright';

export const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

/**
 * ROTEADOR=hash confere a mesma jornada no build estatico, onde as rotas
 * moram depois do # (veja VITE_ROTEADOR em src/App.tsx).
 */
export const HASH = process.env.ROTEADOR === 'hash';

/** Monta a URL de uma rota no modo de roteamento em uso. */
export function endereco(rota) {
  return HASH ? `${BASE}/#${rota}` : `${BASE}${rota}`;
}

/** Navega ate uma rota da aplicacao. */
export function ir(pagina, rota) {
  return pagina.goto(endereco(rota));
}

/**
 * Abre o Chromium em 390px, a largura de referencia da spec.
 * PLAYWRIGHT_CHROMIUM permite apontar para um binario ja instalado, util em
 * ambientes onde `npx playwright install` nao roda.
 */
export async function abrirNavegador() {
  const navegador = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  });
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'pt-BR',
  });
  return { navegador, contexto, pagina: await contexto.newPage() };
}

/** Marca uma opcao num grupo de chips, achando o grupo pela legenda exata. */
export async function marcarChip(pagina, legenda, valor) {
  const grupo = pagina.locator('fieldset', {
    has: pagina.locator('legend', {
      hasText: new RegExp(`^${legenda}\\s*\\*?\\s*(\\(obrigatório\\))?$`, 'i'),
    }),
  }).first();
  await grupo.locator('label.opcao', { hasText: new RegExp(`^${valor}$`) }).first().click();
}

/** Cria conta e publica um perfil completo, devolvendo o e-mail usado. */
export async function criarParticipante(pagina, { email, nome, ocupacao, cidade, bio,
                                                  area, habilidades, temas = [] }) {
  await ir(pagina, '/criar-conta');
  await pagina.locator('#email').fill(email);
  await pagina.locator('#senha').fill('senha123');
  await pagina.getByRole('button', { name: /criar conta/i }).click();
  await pagina.waitForURL('**/meu-perfil');
  await pagina.locator('#nome').fill(nome);
  await pagina.locator('#ocupacao').fill(ocupacao);
  await pagina.locator('#cidade').fill(cidade);
  await pagina.locator('#mini_bio').fill(bio);
  await marcarChip(pagina, 'Áreas', area);
  for (const h of habilidades) await marcarChip(pagina, 'O que você sabe fazer', h);
  for (const t of temas) await marcarChip(pagina, 'O que te move', t);
  await pagina.getByRole('button', { name: /me apresentar pra turma/i }).click();
  await pagina.waitForURL('**/pessoas');
  return email;
}

/** Em 390px o Sair mora dentro do menu de tela cheia. */
export async function sair(pagina) {
  await pagina.getByRole('button', { name: /^menu$/i }).click();
  await pagina.locator('.menu-cheio').getByRole('button', { name: /^sair$/i }).click();
  // Esperar a entrada renderizar e mais firme do que casar a URL, que muda
  // de forma entre os dois modos de roteamento.
  await pagina.getByRole('link', { name: /começar pelo meu perfil/i }).first()
    .waitFor({ timeout: 5000 });
}

/**
 * Publica um evento pelo formulário e devolve a URL dele. O cartaz é
 * obrigatório, então sobe uma amostra de verdade — é o mesmo caminho que a
 * turma percorre.
 */
export async function criarEvento(pagina, {
  titulo, inicio, fim = '', hora = '', formato = 'Presencial',
  uf = 'BA', cidade = 'Salvador', entrada = 'Gratuito',
  areas = ['Música'], temas = [], link = 'instagram.com/oevento',
}) {
  await ir(pagina, '/eventos/novo');
  await pagina.locator('input[type=file]')
    .setInputFiles(new URL('./amostras/media.png', import.meta.url).pathname);
  await pagina.locator('.zona-imagem__previa').waitFor({ timeout: 20000 });
  await pagina.locator('#titulo').fill(titulo);
  await pagina.locator('#data_inicio').fill(inicio);
  if (hora) await pagina.locator('#horario').fill(hora);
  if (fim) await pagina.locator('#data_fim').fill(fim);
  await pagina.locator('label.opcao', { hasText: new RegExp(`^${formato}$`) }).first().click();
  if (formato !== 'Online') {
    await pagina.locator('#estado').selectOption(uf);
    await pagina.locator('#cidade').fill(cidade);
  }
  await pagina.locator('label.opcao', { hasText: new RegExp(`^${entrada}$`) }).first().click();
  await pagina.locator('#link').fill(link);
  for (const a of areas) await marcarChip(pagina, 'Áreas', a);
  for (const t of temas) await marcarChip(pagina, 'Temas', t);
  await pagina.getByRole('button', { name: /publicar no mural/i }).click();
  await pagina.waitForURL(/\/eventos\/[0-9a-f-]{36}$/, { timeout: 10000 });
  return pagina.url();
}

/** Um ano à frente: evento de teste nunca vence enquanto a suíte existir. */
export function daquiAUmAno(mesDia) {
  return `${new Date().getFullYear() + 1}-${mesDia}`;
}
