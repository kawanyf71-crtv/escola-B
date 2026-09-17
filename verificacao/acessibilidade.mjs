/**
 * Alvo de toque de 44px, rotulo em todo controle, texto alternativo em toda
 * imagem, um h1 por pagina e navegacao por teclado — os requisitos nao-funcionais
 * de acessibilidade da spec que dao para conferir sozinho.
 */
import {
  ir, abrirNavegador, irAoFormularioDePerfil, marcarChip,
} from './navegador.mjs';

const AUDITOR = () => {
  const achados = [];
  const visivel = (el) => {
    const e = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return e.display !== 'none' && e.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
    if (!visivel(el)) continue;

    // WCAG 2.5.8 isenta o link que corre dentro de uma frase: esticar cada
    // palavra-link para 44px quebraria a entrelinha do texto corrido.
    if (el.tagName === 'A') {
      const bloco = el.closest('p, li');
      if (bloco && bloco.textContent.trim() !== el.textContent.trim()) continue;
    }

    // Caixa e radio ficam transparentes sobre o <span> que os desenha:
    // o alvo real e o <label> inteiro.
    const tipo = el.getAttribute('type');
    const alvo = (tipo === 'checkbox' || tipo === 'radio') ? (el.closest('label') ?? el) : el;
    const r = alvo.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) {
      achados.push(`alvo ${Math.round(r.width)}x${Math.round(r.height)} ` +
        `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}> ` +
        `"${(el.textContent || el.value || '').trim().slice(0, 30)}"`);
    }

    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
      const temRotulo = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`))
        || el.closest('label') || el.getAttribute('aria-label')
        || el.getAttribute('aria-labelledby');
      if (!temRotulo) achados.push(`sem rótulo <${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>`);
    }
  }

  for (const img of document.querySelectorAll('img')) {
    if (visivel(img) && img.getAttribute('alt') === null) achados.push(`sem alt <img>`);
  }
  if (document.querySelectorAll('h1').length === 0) achados.push('página sem h1');
  return achados;
};

const { navegador, pagina: p } = await abrirNavegador();
let total = 0;

async function auditar(titulo) {
  await p.waitForTimeout(280);
  const achados = await p.evaluate(AUDITOR);
  if (achados.length) {
    total += achados.length;
    console.log(`\n### ${titulo}`);
    achados.forEach((a) => console.log('  ' + a));
  }
}

for (const r of ['/', '/entrar', '/criar-conta', '/gente/redes']) {
  await ir(p, r);
  await auditar(r);
}

// A etapa do começo só existe pra quem entrou e ainda não tem perfil: depois
// dela a rota redireciona, então ou se audita aqui, ou não se audita nunca.
await ir(p, '/criar-conta');
await p.locator('#email').fill('a@b.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /criar conta/i }).click();
await p.waitForURL('**/comecar');
await p.locator('#busca-comecar').fill('kawany');
await p.locator('.rede').first().waitFor({ timeout: 5000 });
await auditar('/comecar');
await irAoFormularioDePerfil(p);

await p.locator('#nome').fill('Kawany Feliciano');
await p.locator('#ocupacao').fill('Produtora cultural');
await p.locator('#cidade').fill('Salvador, BA');
await p.locator('#mini_bio').fill('Produzo e escrevo sobre cultura negra.');
await marcarChip(p, 'Áreas', 'Comunicação');
await marcarChip(p, 'O que você sabe fazer', 'Produção');
await marcarChip(p, 'O que te move', 'Ancestralidade');
await p.getByRole('button', { name: /me apresentar pra turma/i }).click();
await p.waitForURL('**/pessoas');

for (const r of ['/inicio', '/eventos', '/eventos/novo',
                 '/pessoas', '/projetos', '/projetos/novo', '/assuntos',
                 '/assuntos/novo',
                 '/temas', '/temas/ancestralidade', '/meu-espaco', '/meu-perfil',
                 '/gente/redes']) {
  await ir(p, r);
  await auditar(r);
}

// O link de pulo e o primeiro foco de uma carga nova. Em roteamento por hash
// a navegacao entre rotas nao recarrega o documento, entao a recarga aqui e
// explicita — senao o teste mediria a ordem de tabulacao da tela anterior.
await ir(p, '/pessoas');
await p.reload();
await p.keyboard.press('Tab');
const primeiro = await p.evaluate(() => document.activeElement?.textContent?.trim());
if (!/pular para o conteúdo/i.test(primeiro || '')) {
  total++;
  console.log(`\n### teclado\n  o primeiro Tab foi para "${primeiro}", esperado o link de pulo`);
}

await navegador.close();
console.log(total === 0 ? '\n=== acessibilidade: nenhuma falha ===' : `\n=== ${total} falhas ===`);
process.exit(total === 0 ? 0 : 1);
