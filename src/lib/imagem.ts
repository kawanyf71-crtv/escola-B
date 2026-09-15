/**
 * Compressão de imagem no navegador, antes de qualquer gravação.
 *
 * Isto não é otimização: no modo local a aplicação guarda tudo no localStorage,
 * que tem poucos megabytes de cota. Uma foto de celular sem compressão passa de
 * 3 MB, estoura a cota e derruba a sessão inteira de quem subiu — perfil,
 * projetos e conversas junto.
 */

export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface RegraDeImagem {
  /** Lado maior permitido, em pixels. A proporção original é preservada. */
  larguraMaxima: number;
  alturaMaxima: number;
  bytesMaximos: number;
}

const QUATROCENTOS_KB = 400 * 1024;

export const REGRA_FOTO: RegraDeImagem = {
  larguraMaxima: 512, alturaMaxima: 512, bytesMaximos: QUATROCENTOS_KB,
};

export const REGRA_CAPA: RegraDeImagem = {
  larguraMaxima: 1280, alturaMaxima: 1280, bytesMaximos: QUATROCENTOS_KB,
};

/** Degraus de qualidade: começa em 0,8 e só desce se o arquivo não couber. */
const QUALIDADES = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3];

export interface ImagemComprimida {
  blob: Blob;
  dataUrl: string;
  largura: number;
  altura: number;
  bytes: number;
}

export function tipoAceito(tipo: string): boolean {
  return (TIPOS_ACEITOS as readonly string[]).includes(tipo);
}

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolver(img); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeitar(new Error('Não deu pra abrir essa imagem. Tenta outro arquivo.'));
    };
    img.src = url;
  });
}

function paraBlob(tela: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolver, rejeitar) => {
    tela.toBlob(
      (b) => (b ? resolver(b) : rejeitar(new Error('Não deu pra processar a imagem.'))),
      'image/jpeg',
      qualidade,
    );
  });
}

function lerComoDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(leitor.result as string);
    leitor.onerror = () => rejeitar(new Error('Não deu pra ler a imagem.'));
    leitor.readAsDataURL(blob);
  });
}

/** Cabe na caixa da regra sem esticar: imagem pequena continua no tamanho dela. */
function medidaFinal(img: HTMLImageElement, regra: RegraDeImagem) {
  const escala = Math.min(
    1,
    regra.larguraMaxima / img.naturalWidth,
    regra.alturaMaxima / img.naturalHeight,
  );
  return {
    largura: Math.max(1, Math.round(img.naturalWidth * escala)),
    altura: Math.max(1, Math.round(img.naturalHeight * escala)),
  };
}

export async function comprimir(
  arquivo: File, regra: RegraDeImagem,
): Promise<ImagemComprimida> {
  if (!tipoAceito(arquivo.type)) {
    throw new Error('Essa imagem precisa ser JPG, PNG ou WEBP.');
  }

  const img = await carregar(arquivo);
  const { largura, altura } = medidaFinal(img, regra);

  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;
  const pincel = tela.getContext('2d');
  if (!pincel) throw new Error('Este navegador não consegue processar a imagem.');

  // A saída é JPEG, que não tem transparência: sem este fundo, um PNG
  // transparente sairia com as áreas vazias em preto.
  pincel.fillStyle = '#ffffff';
  pincel.fillRect(0, 0, largura, altura);
  pincel.drawImage(img, 0, 0, largura, altura);

  for (const qualidade of QUALIDADES) {
    const blob = await paraBlob(tela, qualidade);
    if (blob.size <= regra.bytesMaximos) {
      return {
        blob, dataUrl: await lerComoDataUrl(blob), largura, altura, bytes: blob.size,
      };
    }
  }

  throw new Error(
    'Essa imagem ficou grande demais mesmo depois de comprimir. ' +
    'Tenta uma foto menor ou com menos detalhe.',
  );
}
