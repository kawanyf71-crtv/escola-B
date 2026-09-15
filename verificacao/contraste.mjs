/**
 * Contraste AA (WCAG 2.1, criterio 1.4.3) em todo texto visivel, incluindo os
 * estados vazio, de erro e sem sessao. A spec pede contraste minimo AA, e a
 * paleta da marca tem combinacoes que reprovam — #F1F1F1 sobre #ED3124 da
 * 3,67:1 —, entao a conferencia precisa ser automatica.
 */
import { ir, abrirNavegador, marcarChip } from './navegador.mjs';

const AUDITOR = () => {
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const rgba = (s) => {
    const m = s.match(/[\d.]+/g);
    return m ? { c: m.slice(0, 3).map(Number), a: m.length > 3 ? Number(m[3]) : 1 } : null;
  };
  const mistura = (frente, fundo, alfa) =>
    frente.map((v, i) => Math.round(v * alfa + fundo[i] * (1 - alfa)));

  /** Sobe o DOM ate achar o primeiro fundo opaco de verdade. */
  function fundoEfetivo(el) {
    let no = el, acumulado = null;
    while (no) {
      const cor = rgba(getComputedStyle(no).backgroundColor);
      if (cor && cor.a > 0) {
        if (cor.a === 1) return cor.c;
        acumulado = cor.c;
      }
      no = no.parentElement;
    }
    return acumulado ?? [255, 255, 255];
  }

  const achados = [];
  for (const el of document.querySelectorAll('body *')) {
    const temTexto = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!temTexto) continue;
    const e = getComputedStyle(el);
    if (e.visibility === 'hidden' || e.display === 'none' || Number(e.opacity) === 0) continue;
    const caixa = el.getBoundingClientRect();
    if (caixa.width < 2 || caixa.height < 2) continue;

    const frente = rgba(e.color);
    if (!frente) continue;
    const fundo = fundoEfetivo(el);
    const tinta = frente.a < 1 ? mistura(frente.c, fundo, frente.a) : frente.c;
    const [claro, escuro] = [lum(tinta), lum(fundo)].sort((x, y) => y - x);
    const razao = (claro + 0.05) / (escuro + 0.05);

    const px = parseFloat(e.fontSize);
    const peso = Number(e.fontWeight) || 400;
    // WCAG: "texto grande" e >=24px, ou >=18.66px com peso >=700.
    const exigido = (px >= 24 || (px >= 18.66 && peso >= 700)) ? 3 : 4.5;

    if (razao < exigido - 0.01) {
      achados.push(`${razao.toFixed(2)}:1 (precisa ${exigido}) ${px}px/${peso} ` +
        `<${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)}> ` +
        `${e.color} sobre rgb(${fundo.join(',')}) — "${el.textContent.trim().slice(0, 40)}"`);
    }
  }
  return achados;
};

const { navegador, pagina: p } = await abrirNavegador();
let total = 0;

async function auditar(titulo) {
  await p.waitForTimeout(300);
  const achados = await p.evaluate(AUDITOR);
  if (achados.length) {
    total += achados.length;
    console.log(`\n### ${titulo}`);
    achados.forEach((a) => console.log('  ' + a));
  }
}

for (const r of ['/', '/entrar', '/criar-conta']) { await ir(p, r); await auditar(r); }

await ir(p, '/criar-conta');
await p.locator('#email').fill('a@b.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /criar conta/i }).click();
await p.waitForURL('**/meu-perfil');
await auditar('/meu-perfil (conta criada, perfil ainda vazio)');

await p.locator('#nome').fill('Kawany Feliciano');
await p.locator('#ocupacao').fill('Produtora cultural');
await p.locator('#cidade').fill('Salvador, BA');
await p.locator('#mini_bio').fill('Produzo e escrevo sobre cultura negra.');
await marcarChip(p, 'Áreas', 'Comunicação');
await marcarChip(p, 'O que você sabe fazer', 'Produção');
await marcarChip(p, 'O que te move', 'Ancestralidade');
await p.getByRole('button', { name: /me apresentar pra turma/i }).click();
await p.waitForURL('**/pessoas');

await ir(p, '/projetos/novo');
await p.locator('#nome').fill('Baile da Ancestralidade');
await p.locator('#o_que_e').fill('Festa-ritual mensal que cruza baile negro e memória.');
await p.locator('#sobre').fill('Ocupar praças com som, dança e roda de conversa.');
await marcarChip(p, 'Áreas', 'Eventos');
await marcarChip(p, 'Em que pé está', 'Em desenvolvimento');
await marcarChip(p, 'Como seria participar', 'Trabalho voluntário');
await marcarChip(p, 'Quem você procura', 'Produção');
await marcarChip(p, 'Temas', 'Ancestralidade');
await p.locator('label.opcao', { hasText: 'Quero abrir' }).click();
await p.locator('#discussao_titulo').fill('Baile é política de memória?');
await marcarChip(p, 'Tema', 'Ancestralidade');
await p.locator('#discussao_descricao').fill('Preserva memória ou consome?');
await p.getByRole('button', { name: /publicar pra turma ver/i }).click();
await p.waitForURL(/\/projetos\/[0-9a-f-]{36}$/);
const projeto = p.url();

// Com o lote de demonstração carregado a auditoria vê conteúdo de verdade —
// cards cheios, selo EXEMPLO, capas — e não só estado vazio.
await ir(p, '/meu-espaco');
await p.getByRole('button', { name: /carregar dados de exemplo/i }).click();
await p.waitForTimeout(900);
await auditar('/meu-espaco (com o lote de exemplo)');

for (const r of ['/temas/memoria', '/temas/periferias', '/temas/outro']) {
  await ir(p, r);
  await auditar(r);
}

for (const r of ['/inicio', '/pessoas', '/projetos', '/assuntos', '/temas',
                 '/temas/ancestralidade',
                 '/meu-espaco', '/meu-perfil', '/projetos/novo', '/assuntos/novo',
                 projeto, `${projeto}/quem-chegou-junto`]) {
  await (r.startsWith('http') ? p.goto(r) : ir(p, r));
  await auditar(r);
}

await ir(p, '/assuntos');
await p.getByRole('link', { name: /Baile é política de memória/i }).click();
await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/);
await auditar('detalhe do assunto');

await ir(p, '/pessoas');
await p.locator('#f-habilidade').selectOption('Fotografia');
await auditar('estado de filtro vazio');

await ir(p, '/projetos/novo');
await p.getByRole('button', { name: /publicar pra turma ver/i }).click();
await auditar('erros de validação do formulário');

await navegador.close();
console.log(total === 0 ? '\n=== contraste AA: nenhuma falha ===' : `\n=== ${total} falhas de contraste ===`);
process.exit(total === 0 ? 0 : 1);
