import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /**
   * Caminho relativo por padrao: o site funciona servido da raiz de um dominio
   * ou de uma subpasta, sem precisar saber onde vai ser hospedado.
   *
   * No Vercel isso nao serve. La as URLs sao limpas (/eventos/abc) e o fallback
   * de SPA entrega o mesmo index.html em qualquer rota — entao um caminho
   * relativo `./assets/x.js` sairia de dentro de /eventos/abc e viraria
   * /eventos/assets/x.js, que nao existe. A pagina abriria em branco.
   *
   * O Vercel exporta VERCEL=1 durante o build, entao da pra acertar sozinho em
   * vez de depender de alguem lembrar de configurar.
   */
  base: process.env.VERCEL ? '/' : './',
  plugins: [react()],
  server: { host: true, port: 5173 },
});
