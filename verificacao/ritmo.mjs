/**
 * Ritmo, proporção e superfície.
 *
 * O app tem dois tipos de página e cada um responde a uma regra diferente.
 *
 * Página-cartaz (a entrada): faixas alternadas de cor, peça de comunicação.
 * Duas regras da identidade que não dá pra conferir a olho: nunca duas faixas
 * da mesma cor coladas, no máximo uma faixa amarela por tela, e o preto como
 * base da maior parte da área pintada.
 *
 * Página-ferramenta (todo o resto): fundo contínuo, lugar onde se permanece e
 * se preenche. Aqui a regra é o oposto — nenhuma faixa pinta fundo próprio, a
 * página inteira tem um fundo só. As ilhas de superfície que sobram entram no
 * relatório, sem cobrança: é o material de trabalho do bloco de superfícies.
 */
import { ir, abrirNavegador, criarParticipante, marcarChip, sair } from './navegador.mjs';

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
 * Área pintada, não altura de faixa: uma faixa amarela cheia de cards pretos
 * pinta muito menos amarelo do que a altura dela sugere. Desconta da faixa a
 * área dos blocos que têm fundo opaco próprio e credita à cor deles.
 *
 * Devolve junto o tipo da página e as ilhas de superfície — blocos com fundo
 * opaco diferente do fundo da página —, que é o que resta de relevo depois que
 * as faixas ficam transparentes.
 */
const MEDIR = () => {
  const opaco = (el) => {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\d.]+/g);
    return m && (m.length < 4 || Number(m[3]) === 1) ? c : null;
  };
  const pagina = document.querySelector('.pagina');
  const tipo = pagina?.classList.contains('pagina--cartaz') ? 'cartaz' : 'app';
  const base = pagina ? opaco(pagina) : null;

  // Cabecalho e rodape sao area pintada da tela como qualquer faixa. Ficavam
  // de fora porque, quando toda pagina era faixa, eram uma constante que nao
  // mudava a comparacao — na pagina-cartaz, que tem tres faixas, mudam.
  const MOLDURA = '.faixa, .cabecalho, .rodape';
  const faixas = [...document.querySelectorAll(MOLDURA)].map((f) => {
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
    return {
      cor: corFaixa, propria: opaco(f), area, altura: Math.round(r.height), dentro,
      cromo: !f.classList.contains('faixa'),
    };
  });

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

  return { tipo, base, faixas, ilhas: [...ilhas].map(([cor, n]) => ({ cor, n })) };
};

/**
 * Telas de leitura longa. A regra de proporção manda o preto dominar, mas a
 * mesma regra manda off-white nos blocos de leitura longa — formulário e texto
 * corrido. Essas telas são quase só isso, então entram no relatório sem cobrar
 * a proporção. Só valem enquanto a tela for página-cartaz.
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

/** Página-cartaz: alternância, uma amarela só, preto dominando a área. */
function conferirCartaz(rota, faixas) {
  const cores = faixas.map((f) => ({ nome: nome(f.cor), altura: f.altura, cromo: f.cromo }));
  if (cores.length === 0) return;

  // Área por cor, já descontando os blocos com fundo próprio.
  const porCor = new Map();
  const somar = (n, area) => porCor.set(n, (porCor.get(n) ?? 0) + area);
  for (const f of faixas) {
    const dentro = f.dentro.reduce((s, d) => s + d.area, 0);
    somar(nome(f.cor), Math.max(0, f.area - dentro));
    for (const d of f.dentro) somar(nome(d.cor), d.area);
  }

  // Alternância é regra da sequência de faixas. Cabeçalho e rodapé entram na
  // conta de área, mas não nesta: o cabeçalho preto colado ao topo preto da
  // entrada é uma massa só de propósito, não duas faixas repetidas.
  const seq = cores.filter((f) => !f.cromo);
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].nome === seq[i - 1].nome) {
      problemas.push(`${rota}: duas faixas ${seq[i].nome} coladas ` +
        `(posições ${i} e ${i + 1} de ${seq.length})`);
    }
  }

  const amarelas = seq.filter((f) => f.nome === 'amarelo').length;
  if (amarelas > 1) {
    problemas.push(`${rota}: ${amarelas} faixas amarelas — o máximo é uma`);
  }

  const total = [...porCor.values()].reduce((s, a) => s + a, 0);
  const escuro = (porCor.get('preto') ?? 0) + (porCor.get('preto-2') ?? 0);
  const proporcao = Math.round((escuro / total) * 100);
  const ehLeitura = LEITURA_LONGA.has(rota) || rota.includes('/editar')
    || rota.includes('/quem-chegou-junto');
  const outras = [...porCor].filter(([n]) => n !== 'preto' && n !== 'preto-2');
  const maiorOutra = outras.sort((a, b) => b[1] - a[1])[0];
  relatorio.push(`cartaz  ${String(proporcao).padStart(3)}% preto  ${rota}` +
    `${ehLeitura ? '  (leitura longa: off-white por regra)' : ''}` +
    `\n                     ${cores.map((f) => `${f.nome}:${f.altura}`).join(' → ')}`);

  // A regra escrita é "o preto é a base da maior parte da área". O piso de 45%
  // era o atalho pra isso quando TODA tela era faixa; hoje a página-ferramenta
  // garante a base por construção (um fundo preto só, 100%) e sobrou um cartaz
  // de três faixas, onde o que dá pra cobrar é a dominância. A percentagem
  // continua impressa acima justamente pra ninguém perder de vista quanto é.
  if (!ehLeitura && maiorOutra && escuro <= maiorOutra[1]) {
    problemas.push(`${rota}: ${maiorOutra[0]} ocupa mais área que o preto ` +
      `(${proporcao}% preto) — a base devia dominar a tela`);
  }
}

/** Página-ferramenta: um fundo só, do topo ao rodapé. */
function conferirApp(rota, base, faixas, ilhas) {
  if (base === null) {
    problemas.push(`${rota}: a página-ferramenta não pinta fundo próprio`);
  } else if (nome(base) !== 'preto') {
    problemas.push(`${rota}: fundo da página é ${nome(base)} — devia ser o preto da marca`);
  }

  const pintadas = faixas.filter((f) => f.propria && f.propria !== base);
  if (pintadas.length > 0) {
    const quais = [...new Set(pintadas.map((f) => nome(f.propria)))].join(', ');
    problemas.push(`${rota}: ${pintadas.length} faixa(s) ainda pintam fundo próprio ` +
      `(${quais}) — página-ferramenta tem um fundo só`);
  }

  relatorio.push(`app     fundo ${nome(base)}  ${rota}` +
    `\n                     ${ilhas.length === 0 ? 'sem ilhas de superfície'
      : `ilhas: ${ilhas.map((i) => `${nome(i.cor)}×${i.n}`).join('  ')}`}`);
}

async function conferir(rota) {
  await p.waitForTimeout(350);
  const { tipo, base, faixas, ilhas } = await p.evaluate(MEDIR);
  const visiveis = faixas.filter((f) => f.altura > 0);

  if (tipo === 'cartaz') conferirCartaz(rota, visiveis);
  else conferirApp(rota, base, visiveis, ilhas);

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

for (const rota of ['/pessoas', '/projetos', '/projetos/novo', '/assuntos',
                    '/assuntos/novo', '/temas', '/temas/ancestralidade',
                    '/meu-espaco', '/meu-perfil']) {
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

/* Entrada, cadastro e login só existem deslogado — logado as três redirecionam
   pra dentro do app. É aqui que a página-cartaz entra na conta. */
await sair(p);
for (const rota of ['/', '/entrar', '/criar-conta']) {
  await ir(p, rota);
  await conferir(rota);
}

await navegador.close();

console.log(relatorio.join('\n'));
console.log(problemas.length === 0
  ? '\n=== ritmo das faixas: nenhuma falha ==='
  : `\n=== ${problemas.length} falhas ===\n${problemas.join('\n')}`);
process.exit(problemas.length === 0 ? 0 : 1);
