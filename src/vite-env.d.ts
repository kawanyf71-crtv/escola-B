/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ROTEADOR?: 'hash' | 'browser';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Verdadeiro so no build que a Vercel faz. Definido em vite.config.ts. */
declare const __NA_VERCEL__: boolean;
