/**
 * Superfície e fundo.
 *
 * O app tem um tipo de página só: fundo preto contínuo, do topo ao rodapé. A
 * faixa existe como ritmo vertical e não pinta nada. É isso que se cobra aqui —
 * nenhuma faixa com fundo próprio, e o fundo da página sendo o preto da marca.
 * As ilhas de superfície que sobram em cada tela entram no relatório sem
 * cobrança: são o material de trabalho de quem for mexer em superfície.
 *
 * Cobra também o critério 1.4.11 da WCAG nos dois sentidos: nenhum botão que
 * suma na superfície atrás dele, nenhum campo ou chip de opção sem 3:1 entre o
 * que o identifica e o fundo.
 */
import {
  ir, abrirNavegador, criarEvento, criarParticipante, daquiAUmAno, marcarChip, sair,
} from './navegador.mjs';

const PALETA = {
  'rgb(17, 17, 17)': 'preto',
  'rgb(34, 34, 34)': 'preto-2',
  'rgb(255, 212, 0)': 'amarelo',
  'rgb(237, 49, 36)': 'vermelho',
  'rgb(241, 241, 241)': 'off-white',
  'rgb(255, 255, 255)': 'branco',
  'rgb(25, 25, 25)': 'superficie',
  'rgb(32, 32, 32)': 'superficie-2',
};
const nome = (c) => PALETA[c] ?? c;

/**
 * O fundo da página e o de cada faixa, mais as ilhas de superfície — blocos com
 * fundo opaco diferente do fundo da página. As ilhas são o que resta de relevo
 * depois que as faixas param de pintar.
 */
const MEDIR = () => {
  const opaco = (el) => {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\d.]+/g);
    return m && (m.length < 4 || Number(m[3]) === 1) ? c : null;
  };
  const pagina = document.querySelector('.pagina');
  const base = pagina ? opaco(pagina) : null;

  const faixas = [...document.querySelectorAll('.faixa')].map((f) => ({
    propria: opaco(f),
    altura: Math.round(f.getBoundingClientRect().height),
  }));

  const ilhas = new Map();
  const ALVO = '.card, .cartaz, .correspondencia, .zona-imagem, .esqueleto,' +
    ' input, textarea, select';
  for (const el of document.querySelectorAll(ALVO)) {
    const cor = opaco(el);
    if (!cor || cor === base) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height === 0) continue;
    ilhas.set(cor, (ilhas.get(cor) ?? 0) + 1);
  }

  return { base, faixas, ilhas: [...ilhas].map(([cor, n]) => ({ cor, n })) };
};

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

/**
 * Campo de formulario que se confunde com o fundo. Mesmo criterio 1.4.11 do
 * botao, do outro lado: um campo de texto precisa ser identificavel como campo
 * antes de receber foco. O que o identifica e o preenchimento OU a borda — basta
 * um dos dois chegar a 3:1 contra a superficie atras.
 */
const CONTROLES_SUMIDOS = () => {
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
  const razao = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
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
  const ALVO = "input[type='text'], input[type='email'], input[type='password']," +
    " input[type='url'], select, textarea, .opcao span";
  const achados = [];
  for (const c of document.querySelectorAll(ALVO)) {
    const e = getComputedStyle(c);
    const atras = fundoAtras(c);
    const opcoes = [];
    const preenchimento = cor(e.backgroundColor);
    if (preenchimento) opcoes.push(['preenchimento', razao(preenchimento, atras)]);
    const borda = cor(e.borderTopColor);
    if (borda && parseFloat(e.borderTopWidth) > 0) opcoes.push(['borda', razao(borda, atras)]);
    if (opcoes.length === 0) continue;
    const melhor = opcoes.sort((a, b) => b[1] - a[1])[0];
    if (melhor[1] < 3) {
      const nome = c.id || c.textContent.trim().slice(0, 24) || c.tagName.toLowerCase();
      achados.push(`"${nome}" — ${melhor[1].toFixed(2)}:1 no ${melhor[0]}, ` +
        `o melhor dos dois, contra a superficie atras`);
    }
  }
  return achados;
};

const { navegador, pagina: p } = await abrirNavegador();
const problemas = [];
const relatorio = [];

async function conferir(rota) {
  await p.waitForTimeout(350);
  const { base, faixas, ilhas } = await p.evaluate(MEDIR);

  if (base === null) {
    problemas.push(`${rota}: a página não pinta fundo próprio`);
  } else if (nome(base) !== 'preto') {
    problemas.push(`${rota}: fundo da página é ${nome(base)} — devia ser o preto da marca`);
  }

  const pintadas = faixas.filter((f) => f.altura > 0 && f.propria && f.propria !== base);
  if (pintadas.length > 0) {
    const quais = [...new Set(pintadas.map((f) => nome(f.propria)))].join(', ');
    problemas.push(`${rota}: ${pintadas.length} faixa(s) pintam fundo próprio ` +
      `(${quais}) — a página tem um fundo só`);
  }

  relatorio.push(`fundo ${nome(base)}  ${rota}` +
    `\n                ${ilhas.length === 0 ? 'sem ilhas de superfície'
      : `ilhas: ${ilhas.map((i) => `${nome(i.cor)}×${i.n}`).join('  ')}`}`);

  for (const aviso of await p.evaluate(BOTOES_SUMIDOS)) {
    problemas.push(`${rota}: botão ${aviso}`);
  }
  for (const aviso of await p.evaluate(CONTROLES_SUMIDOS)) {
    problemas.push(`${rota}: campo ${aviso}`);
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

await criarEvento(p, {
  titulo: 'Baile da Virada Preta', inicio: daquiAUmAno('11-28'), hora: '19:00',
  uf: 'BA', cidade: 'Salvador', entrada: 'Gratuito',
  areas: ['Música', 'Cultura Popular', 'Dança'], temas: ['Ancestralidade'],
});
const evento = p.url();

for (const rota of ['/inicio', '/eventos', '/eventos/novo',
                    '/pessoas', '/projetos', '/projetos/novo', '/assuntos',
                    '/assuntos/novo', '/temas', '/temas/ancestralidade',
                    '/meu-espaco', '/meu-perfil', '/gente/redes']) {
  await ir(p, rota);
  await conferir(rota);
}

for (const url of [projeto, `${projeto}/quem-chegou-junto`, evento]) {
  await p.goto(url);
  await conferir(url.replace(/^.*?(\/(?:projetos|eventos).*)$/, '$1'));
}

await ir(p, '/assuntos');
await p.getByRole('link', { name: /Baile é política de memória/i }).click();
await p.waitForURL(/\/assuntos\/[0-9a-f-]{36}$/);
await conferir('/assuntos/:id');

await ir(p, '/pessoas');
await p.getByRole('link', { name: 'Kawany Feliciano' }).first().click();
await p.waitForURL(/\/pessoas\/[0-9a-f-]{36}$/);
await conferir('/pessoas/:id');

/* O menu de tela cheia e a unica superficie que so existe depois de um clique —
   e por isso a unica que nunca era medida. Botao preto sobre ele ja sumiu uma
   vez. */
await ir(p, '/pessoas');
await p.getByRole('button', { name: /^Menu$/i }).click();
await p.waitForTimeout(300);
for (const aviso of await p.evaluate(BOTOES_SUMIDOS)) {
  problemas.push(`/pessoas (menu aberto): botão ${aviso}`);
}
await p.getByRole('button', { name: /^Fechar$/i }).click();

/* Entrada, cadastro e login só existem deslogado — logado as três redirecionam
   pra dentro. */
await sair(p);
for (const rota of ['/', '/entrar', '/criar-conta', '/gente/redes']) {
  await ir(p, rota);
  await conferir(rota);
}

await navegador.close();

console.log(relatorio.join('\n'));
console.log(problemas.length === 0
  ? '\n=== ritmo das faixas: nenhuma falha ==='
  : `\n=== ${problemas.length} falhas ===\n${problemas.join('\n')}`);
process.exit(problemas.length === 0 ? 0 : 1);
