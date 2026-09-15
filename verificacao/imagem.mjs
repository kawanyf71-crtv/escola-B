/**
 * Upload de imagem: compressão, pré-visualização, remoção, arrastar e soltar,
 * tipo recusado e persistência.
 *
 * O caso que importa é o primeiro: um PNG de 12 MB, do tamanho do que sai de um
 * celular. Sem compressão ele estoura a cota do localStorage e derruba a sessão
 * inteira de quem subiu.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ir, abrirNavegador, marcarChip } from './navegador.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const amostra = (nome) => join(AQUI, 'amostras', nome);

const problemas = [];
const passos = [];
async function checar(nome, fn) {
  try { await fn(); passos.push(`  OK  ${nome}`); }
  catch (e) { problemas.push(`FALHA ${nome}: ${e.message.split('\n')[0]}`); passos.push(`FALHA ${nome}`); }
}

const { navegador, pagina: p } = await abrirNavegador();

await ir(p, '/criar-conta');
await p.locator('#email').fill('foto@exemplo.org');
await p.locator('#senha').fill('senha123');
await p.getByRole('button', { name: /criar conta/i }).click();
await p.waitForURL('**/meu-perfil');

const zona = p.locator('.zona-imagem').first();
const entrada = p.locator('.zona-imagem__entrada');

await checar('O campo começa vazio e convida a escolher', async () => {
  await p.getByText(/Escolhe uma foto do seu celular/i).waitFor({ timeout: 3000 });
  await p.getByText(/ou arrasta e solta aqui/i).waitFor({ timeout: 3000 });
});

await checar('Só aceita JPG, PNG e WEBP', async () => {
  const aceita = await entrada.getAttribute('accept');
  if (aceita !== 'image/jpeg,image/png,image/webp') {
    throw new Error(`accept veio como "${aceita}"`);
  }
});

// --- o caso que justifica a compressão ---
await entrada.setInputFiles(amostra('grande.png'));
await p.locator('.zona-imagem__previa').waitFor({ timeout: 20000 });

const comprimida = await checarImagem();
async function checarImagem() {
  return p.evaluate(() => {
    const src = document.querySelector('.zona-imagem__previa')?.getAttribute('src') ?? '';
    return { formato: src.slice(0, 30), bytes: Math.round(src.length * 0.75) };
  });
}

await checar('PNG de 12 MB é comprimido para JPEG abaixo de 400 KB', () => {
  if (!comprimida.formato.startsWith('data:image/jpeg')) {
    throw new Error(`saiu como ${comprimida.formato}`);
  }
  if (comprimida.bytes > 400 * 1024) {
    throw new Error(`ficou com ${Math.round(comprimida.bytes / 1024)} KB`);
  }
  console.log(`  → 12,4 MB viraram ${Math.round(comprimida.bytes / 1024)} KB`);
});

await checar('Foto de perfil é redimensionada para caber em 512x512', async () => {
  const d = await p.evaluate(() => new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok({ l: img.naturalWidth, a: img.naturalHeight });
    img.src = document.querySelector('.zona-imagem__previa').getAttribute('src');
  }));
  if (d.l > 512 || d.a > 512) throw new Error(`ficou ${d.l}x${d.a}`);
  console.log(`  → redimensionada para ${d.l}x${d.a}`);
});

await checar('Dá pra remover e voltar ao estado vazio', async () => {
  await p.getByRole('button', { name: /remover imagem/i }).click();
  await p.waitForTimeout(300);
  if (await p.locator('.zona-imagem__previa').count() !== 0) {
    throw new Error('a prévia continuou na tela');
  }
  await p.getByText(/ou arrasta e solta aqui/i).waitFor({ timeout: 3000 });
});

await checar('Arrastar e soltar carrega a imagem', async () => {
  const dados = await p.evaluate(async () => {
    // Monta um File no navegador e dispara o drop, como faria o sistema.
    const tela = document.createElement('canvas');
    tela.width = 600; tela.height = 600;
    const pincel = tela.getContext('2d');
    pincel.fillStyle = '#ed3124';
    pincel.fillRect(0, 0, 600, 600);
    const blob = await new Promise((ok) => tela.toBlob(ok, 'image/png'));
    const arquivo = new File([blob], 'solta.png', { type: 'image/png' });
    const transfer = new DataTransfer();
    transfer.items.add(arquivo);
    const zona = document.querySelector('.zona-imagem');
    zona.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
    zona.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
    return true;
  });
  if (!dados) throw new Error('não deu pra montar o arquivo');
  await p.locator('.zona-imagem__previa').waitFor({ timeout: 15000 });
});

await checar('Arquivo que não é imagem é recusado com mensagem clara', async () => {
  await p.getByRole('button', { name: /remover imagem/i }).click();
  await p.waitForTimeout(300);
  await entrada.setInputFiles(amostra('naoimagem.txt'));
  await p.locator('.erro-campo', { hasText: /JPG, PNG ou WEBP/i }).waitFor({ timeout: 5000 });
});

// --- persistência ---
await entrada.setInputFiles(amostra('media.png'));
await p.locator('.zona-imagem__previa').waitFor({ timeout: 15000 });
await p.locator('#nome').fill('Quem Subiu Foto');
await p.locator('#ocupacao').fill('Fotógrafa');
await p.locator('#cidade').fill('Recife, PE');
await p.locator('#mini_bio').fill('Testando o upload.');
await marcarChip(p, 'Áreas', 'Audiovisual');
await marcarChip(p, 'O que você sabe fazer', 'Fotografia');
await p.getByRole('button', { name: /me apresentar pra turma/i }).click();
await p.waitForURL('**/pessoas');

await checar('A foto sobrevive ao salvar e aparece no diretório', async () => {
  const src = await p.locator('.moldura').first().getAttribute('src');
  if (!src?.startsWith('data:image/jpeg')) throw new Error(`o card mostra "${src?.slice(0, 40)}"`);
});

await checar('Publicar sem imagem continua possível', async () => {
  await ir(p, '/projetos/novo');
  await p.locator('#nome').fill('Projeto sem capa');
  await p.locator('#o_que_e').fill('Existe pra provar que a capa é opcional.');
  await p.locator('#sobre').fill('Sem imagem nenhuma.');
  await marcarChip(p, 'Áreas', 'Literatura');
  await marcarChip(p, 'Em que pé está', 'Ideia');
  await p.locator('label.opcao', { hasText: 'Agora não' }).first().click();
  await p.getByRole('button', { name: /publicar pra turma ver/i }).click();
  await p.waitForURL(/\/projetos\/[0-9a-f-]{36}$/, { timeout: 5000 });
});

await checar('Capa de projeto é limitada a 1280px de largura', async () => {
  await ir(p, '/projetos/novo');
  await p.locator('.zona-imagem__entrada').setInputFiles(amostra('grande.png'));
  await p.locator('.zona-imagem__previa').waitFor({ timeout: 20000 });
  const d = await p.evaluate(() => new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok({
      l: img.naturalWidth, a: img.naturalHeight,
      bytes: Math.round(img.src.length * 0.75), formato: img.src.slice(0, 20),
    });
    img.src = document.querySelector('.zona-imagem__previa').getAttribute('src');
  }));
  if (d.l > 1280) throw new Error(`ficou com ${d.l}px de largura`);
  if (d.bytes > 400 * 1024) throw new Error(`ficou com ${Math.round(d.bytes / 1024)} KB`);
  if (!d.formato.startsWith('data:image/jpeg')) throw new Error(`saiu como ${d.formato}`);
  console.log(`  → capa em ${d.l}x${d.a}, ${Math.round(d.bytes / 1024)} KB`);
});

await checar('A zona da capa é 16:9 e a da foto é 1:1', async () => {
  const capa = await p.evaluate(
    () => getComputedStyle(document.querySelector('.zona-imagem')).aspectRatio);
  if (!/16\s*\/\s*9/.test(capa)) throw new Error(`capa veio com aspect-ratio ${capa}`);
  await ir(p, '/meu-perfil');
  await p.waitForTimeout(400);
  const foto = await p.evaluate(
    () => getComputedStyle(document.querySelector('.zona-imagem')).aspectRatio);
  if (!/^1\s*\/?\s*1?$/.test(foto.trim())) throw new Error(`foto veio com aspect-ratio ${foto}`);
});

await checar('Registro antigo com URL http continua sendo exibido', async () => {
  // Compatibilidade: antes do upload, o campo guardava um endereço colado.
  await p.evaluate(() => {
    const chave = 'rede-escola-b/v1';
    const b = JSON.parse(localStorage.getItem(chave));
    b.projetos[0].imagem = 'https://exemplo.invalido/capa-antiga.jpg';
    localStorage.setItem(chave, JSON.stringify(b));
  });
  await ir(p, '/projetos');
  await p.waitForTimeout(500);
  const capas = await p.evaluate(() => [...document.querySelectorAll('.card__capa')]
    .map((i) => i.getAttribute('src')));
  if (!capas.some((c) => c === 'https://exemplo.invalido/capa-antiga.jpg')) {
    throw new Error('a URL antiga sumiu do card');
  }
});

await navegador.close();
console.log(passos.join('\n'));
console.log(problemas.length === 0
  ? `\n=== upload de imagem: ${passos.length} verificações OK ===`
  : `\n=== ${problemas.length} falhas ===\n${problemas.join('\n')}`);
process.exit(problemas.length === 0 ? 0 : 1);
