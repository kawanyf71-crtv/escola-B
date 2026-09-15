import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Caminhos relativos: o site funciona servido da raiz de um dominio ou de
  // uma subpasta, sem precisar saber onde vai ser hospedado.
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
});
