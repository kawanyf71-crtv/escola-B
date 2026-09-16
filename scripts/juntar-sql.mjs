/**
 * Gera `supabase/instalar.sql`: as migrações emendadas na ordem, num arquivo só.
 *
 * As migrações continuam sendo a fonte — este arquivo é derivado e nunca deve
 * ser editado à mão. Ele existe porque instalar o banco é uma tarefa de
 * navegador: quem abre o SQL Editor do Supabase quer colar uma coisa e apertar
 * Run, não abrir quatro arquivos e acertar a ordem de cada um.
 *
 *   npm run sql
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PASTA = join(import.meta.dirname, '..', 'supabase', 'migrations');
const SAIDA = join(import.meta.dirname, '..', 'supabase', 'instalar.sql');

const arquivos = readdirSync(PASTA).filter((n) => n.endsWith('.sql')).sort();

const cabecalho = `-- NÓIS — instalação do banco, tudo num arquivo só
--
-- ARQUIVO GERADO. Não edite aqui: mexa nas migrações em supabase/migrations/ e
-- rode \`npm run sql\`. As migrações são a fonte; este é o atalho pra quem está
-- no SQL Editor do Supabase e quer colar uma coisa só.
--
-- Como usar: copie ESTE arquivo inteiro, cole no SQL Editor e aperte Run.
-- Roda uma vez, num banco novo. As ${arquivos.length} migrações, nesta ordem:
${arquivos.map((n) => `--   ${n}`).join('\n')}
`;

const corpo = arquivos.map((nome) => {
  const linha = '-'.repeat(74);
  return `\n\n-- ${linha}\n-- ${nome}\n-- ${linha}\n\n${readFileSync(join(PASTA, nome), 'utf8').trim()}`;
}).join('');

writeFileSync(SAIDA, `${cabecalho}${corpo}\n`);
console.log(`supabase/instalar.sql: ${arquivos.length} migrações emendadas`);
