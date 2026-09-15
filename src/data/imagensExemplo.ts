/**
 * Imagens do lote de demonstração, geradas em SVG e codificadas como data URI.
 * Nada de URL externa: o lote precisa abrir sem rede e sem depender de terceiro.
 *
 * Nota sobre a tipografia: um SVG dentro de `<img>` renderiza isolado e não
 * alcança o @font-face da página, então a Archivo Black auto-hospedada não vale
 * aqui. A pilha cai em fontes pesadas do sistema, e o `textLength` garante que
 * as iniciais ocupem a mesma largura do quadro independente de qual delas
 * renderizar.
 */

const PILHA_TITULO =
  "'Archivo Black','Arial Black','Helvetica Neue',Impact,sans-serif";

function paraDataUri(svg: string): string {
  const limpo = svg.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(limpo)}`;
}

/** Avatar 1:1: cor chapada da marca e as iniciais ocupando o quadro. */
function avatar(iniciais: string, fundo: string, tinta: string): string {
  return paraDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="${fundo}"/>
      <text x="100" y="100" fill="${tinta}"
            font-family="${PILHA_TITULO}" font-weight="900" font-size="104"
            text-anchor="middle" dominant-baseline="central"
            textLength="150" lengthAdjust="spacingAndGlyphs">${iniciais}</text>
    </svg>`);
}

/** Seta triangular maciça, sem contorno, apontando para a direita. */
function seta(x: number, y: number, largura: number, altura: number, cor: string): string {
  return `<polygon points="${x},${y} ${x + largura},${y + altura / 2} ${x},${y + altura}"
           fill="${cor}"/>`;
}

/** Capa 16:9: cor chapada com composição geométrica da identidade por cima. */
function capaComSetas(fundo: string, tinta: string, quantidade: number): string {
  const setas = Array.from({ length: quantidade }, (_, i) =>
    seta(60 + i * 110, 90, 78, 90, tinta)).join('');
  return paraDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
      <rect width="480" height="270" fill="${fundo}"/>
      ${setas}
      <rect x="0" y="232" width="480" height="38" fill="${tinta}"/>
    </svg>`);
}

/** Capa 16:9 com o globo em traço grosso, sem preenchimento. */
function capaComGlobo(fundo: string, tinta: string): string {
  return paraDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
      <rect width="480" height="270" fill="${fundo}"/>
      <g fill="none" stroke="${tinta}" stroke-width="13">
        <circle cx="240" cy="135" r="88"/>
        <ellipse cx="240" cy="135" rx="39" ry="88"/>
        <line x1="152" y1="135" x2="328" y2="135"/>
        <line x1="170" y1="90" x2="310" y2="90"/>
        <line x1="170" y1="180" x2="310" y2="180"/>
      </g>
      ${seta(28, 108, 62, 54, tinta)}
      ${seta(390, 108, 62, 54, tinta)}
    </svg>`);
}

const PRETO = '#111111';
const AMARELO = '#ffd400';
const VERMELHO = '#ed3124';
const OFF_WHITE = '#f1f1f1';

// Sobre vermelho a tinta é preta: o amarelo daria 2,90:1 e some.
export const AVATARES = {
  dandara: avatar('DV', PRETO, AMARELO),
  joel: avatar('JB', AMARELO, PRETO),
  rita: avatar('RS', VERMELHO, PRETO),
  taina: avatar('TC', PRETO, AMARELO),
};

export const CAPAS = {
  aparelhagem: capaComSetas(PRETO, AMARELO, 3),
  corpoFechado: capaComSetas(VERMELHO, OFF_WHITE, 3),
  escolaLivre: capaComGlobo(AMARELO, VERMELHO),
  antologia: capaComSetas(PRETO, VERMELHO, 4),
};
