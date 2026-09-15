import { chromium } from 'playwright';

export const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

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
  await pagina.goto(`${BASE}/criar-conta`);
  await pagina.locator('#email').fill(email);
  await pagina.locator('#senha').fill('senha123');
  await pagina.getByRole('button', { name: /criar conta/i }).click();
  await pagina.waitForURL('**/meu-perfil');
  await pagina.locator('#nome').fill(nome);
  await pagina.locator('#ocupacao').fill(ocupacao);
  await pagina.locator('#cidade').fill(cidade);
  await pagina.locator('#mini_bio').fill(bio);
  await marcarChip(pagina, 'Áreas', area);
  for (const h of habilidades) await marcarChip(pagina, 'Habilidades que ofereço', h);
  for (const t of temas) await marcarChip(pagina, 'Temas que me interessam', t);
  await pagina.getByRole('button', { name: /publicar meu perfil/i }).click();
  await pagina.waitForURL('**/pessoas');
  return email;
}

/** Em 390px o Sair mora dentro do menu de tela cheia. */
export async function sair(pagina) {
  await pagina.getByRole('button', { name: /^menu$/i }).click();
  await pagina.locator('.menu-cheio').getByRole('button', { name: /^sair$/i }).click();
  await pagina.waitForURL(`${BASE}/`);
}
