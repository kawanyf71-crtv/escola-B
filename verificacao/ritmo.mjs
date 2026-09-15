/**
 * Ritmo e proporção das faixas.
 *
 * Duas regras da identidade que não dá pra conferir a olho em treze telas:
 * nunca duas faixas da mesma cor coladas, no máximo uma faixa amarela por tela,
 * e o preto como base da maior parte da área. Formulários são a exceção
 * declarada — leitura longa vai em off-white —, então entram só no relatório.
 */
import { ir, abrirNavegador, criarParticipante, marcarChip } from './navegador.mjs';

const PALETA = {
  'rgb(17, 17, 17)': 'preto',
  'rgb(34, 34, 34)': 'preto-2',
  'rgb(255, 212, 0)': 'amarelo',
  'rgb(237, 49, 36)': 'vermelho',
  'rgb(241, 241, 241)': 'off-white',
};

/**
 * Área pintada, não altura de faixa: uma faixa amarela cheia de cards pretos
 * pinta muito menos amarelo do que a altura dela sugere. Desconta da faixa a
 * área dos blocos que têm fundo opaco próprio e credita à cor deles.
 */
const MEDIR = () => {
  const opaco = (el) => {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\d.]+/g);
    return m && (m.length < 4 || Number(m[3]) === 1) ? c : null;
  };
  return [...document.querySelectorAll('.faixa')].map((f) => {
    const corFaixa = getComputedStyle(f).backgroundColor;
    const r = f.getBoundingClientRect();
    const area = Math.round(r.width * r.height);
    const dentro = [];
    f.querySelectorAll('.card, .cartaz, .correspondencia, .esqueleto').forEach((el) => {
      const cor = opaco(el);
      if (!cor || cor === corFaixa) return;
      // Só blocos de primeiro nível dentro da faixa, pra não contar duas vezes.
      if (el.parentElement?.closest('.card, .cartaz, .correspondencia')) return;
      const rr = el.getBoundingClientRect();
      dentro.push({ cor, area: Math.round(rr.width * rr.height) });
    });
    return { cor: corFaixa, area, altura: Math.round(r.height), dentro };
  });
};

/**
 * Telas de leitura longa. A regra de proporção manda o preto dominar, mas a
 * mesma regra manda off-white nos blocos de leitura longa — formulário e texto
 * corrido. Essas telas são quase só isso, então entram no relatório sem cobrar
 * a proporção.
 */
const LEITURA_LONGA = new Set(['/meu-perfil', '/projetos/novo', '/assuntos/novo',
                               '/entrar', '/criar-conta']);

/**
 * Botão que se confunde com a superfície atrás dele. O auditor de contraste
 * olha texto contra fundo e aprova um botão vermelho sobre faixa vermelha,
 * porque a tinta do rótulo continua legível — mas o botão some como objeto.
 * A WCAG pede 3:1 entre um componente e o que está atrás (critério 1.4.11).
 */
const BOTOES_SUMIDOS = () => {
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const cor = (s) => {
    const m = s.match(/[\d.]+/g);
    if (!m) return null;
    const a = m.length > 3 ? Number(m[3]) : 1;
    return a === 0 ? null : m.slice(0, 3).map(Number);
  };
  const fundoAtras = (el) => {
    let no = el.parentElement;
    while (no) {
      const c = cor(getComputedStyle(no).backgroundColor);
      if (c) return c;
      no = no.parentElement;
    }
    return [255, 255, 255];
  };
  const achados = [];
  for (const b of document.querySelectorAll('.botao')) {
    const frente = cor(getComputedStyle(b).backgroundColor);
    if (!frente) continue; // botão de contorno não tem preenchimento
    const atras = fundoAtras(b);
    const [x, y] = [lum(frente), lum(atras)].sort((m, n) => n - m);
    const razao = (x + 0.05) / (y + 0.05);
    if (razao < 3) {
      achados.push(`"${b.textContent.trim().slice(0, 32)}" — ` +
        `${razao.toFixed(2)}:1 entre o botão e a superfície atrás`);
    }
  }
  return achados;
};

const { navegador, pagina: p } = await abrirNavegador();
const problemas = [];
const relatorio = [];

async function conferir(rota) {
  await p.waitForTimeout(350);
  const medidas = (await p.evaluate(MEDIR)).filter((f) => f.altura > 0);
  const faixas = medidas.map((f) => ({ nome: PALETA[f.cor] ?? f.cor, altura: f.altura }));

  if (faixas.length === 0) return;

  // Área por cor, já descontando os blocos com fundo próprio.
  const porCor = new Map();
  const somar = (nome, area) => porCor.set(nome, (porCor.get(nome) ?? 0) + area);
  for (const f of medidas) {
    const dentro = f.dentro.reduce((s, d) => s + d.area, 0);
    somar(PALETA[f.cor] ?? f.cor, Math.max(0, f.area - dentro));
    for (const d of f.dentro) somar(PALETA[d.cor] ?? d.cor, d.area);
  }

  for (let i = 1; i < faixas.length; i++) {
    if (faixas[i].nome === faixas[i - 1].nome) {
      problemas.push(`${rota}: duas faixas ${faixas[i].nome} coladas ` +
        `(posições ${i} e ${i + 1} de ${faixas.length})`);
    }
  }

  const amarelas = faixas.filter((f) => f.nome === 'amarelo').length;
  if (amarelas > 1) {
    problemas.push(`${rota}: ${amarelas} faixas amarelas — o máximo é uma`);
  }

  const total = [...porCor.values()].reduce((s, a) => s + a, 0);
  const escuro = (porCor.get('preto') ?? 0) + (porCor.get('preto-2') ?? 0);
  const proporcao = Math.round((escuro / total) * 100);
  const ehLeitura = LEITURA_LONGA.has(rota) || rota.includes('/editar')
    || rota.includes('/quem-chegou-junto');
  relatorio.push(`${String(proporcao).padStart(3)}% preto  ${rota}` +
    `${ehLeitura ? '  (leitura longa: off-white por regra)' : ''}` +
    `\n           ${faixas.map((f) => `${f.nome}:${f.altura}`).join(' → ')}`);

  if (!ehLeitura && proporcao < 45) {
    problemas.push(`${rota}: só ${proporcao}% de preto — a base devia dominar a tela`);
  }

  for (const aviso of await p.evaluate(BOTOES_SUMIDOS)) {
    problemas.push(`${rota}: botão ${aviso}`);
  }
}

await criarParticipante(p, {
  email: 'k@x.org', nome: 'Kawany Feliciano', ocupacao: 'Produtora cultural',
  cidade: 'Salvador, BA', bio: 'Produzo e escrevo sobre cultura negra.',
  area: 'Comunicação', habilidades: ['Produção'], temas: ['Ancestralidade'],
});

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

for (const rota of ['/', '/entrar', '/criar-conta', '/pessoas', '/projetos',
                    '/projetos/novo', '/assuntos', '/assuntos/novo', '/temas',
                    '/temas/ancestralidade', '/meu-espaco', '/meu-perfil']) {
  await ir(p, rota);
  await conferir(rota);
}

for (const url of [projeto, `${projeto}/quem-chegou-junto`]) {
  await p.goto(url);
  await conferir(url.replace(/^.*?(\/projetos.*)$/, '$1'));
}

await ir(p, '/assuntos');
await p.getByRole('link', { name: /Baile é política de memória/i }).click();
await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/);
await conferir('/assuntos/:id');

await ir(p, '/pessoas');
await p.getByRole('link', { name: 'Kawany Feliciano' }).first().click();
await p.waitForURL(/\/pessoas\/[0-9a-f-]{36}$/);
await conferir('/pessoas/:id');

await navegador.close();

console.log(relatorio.join('\n'));
console.log(problemas.length === 0
  ? '\n=== ritmo das faixas: nenhuma falha ==='
  : `\n=== ${problemas.length} falhas ===\n${problemas.join('\n')}`);
process.exit(problemas.length === 0 ? 0 : 1);
