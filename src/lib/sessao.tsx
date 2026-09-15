import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { repo } from '../data';
import type { Participante } from './dominio';
import type { Sessao } from '../data/tipos';

interface ContextoSessao {
  sessao: Sessao | null;
  perfil: Participante | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarConta: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [perfil, setPerfil] = useState<Participante | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const atual = await repo.sessaoAtual();
    setSessao(atual);
    setPerfil(atual ? await repo.meuPerfil() : null);
  }, []);

  useEffect(() => {
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const nova = await repo.entrar(email, senha);
    setSessao(nova);
    setPerfil(await repo.meuPerfil());
  }, []);

  const criarConta = useCallback(async (email: string, senha: string) => {
    const nova = await repo.criarConta(email, senha);
    setSessao(nova);
    setPerfil(null); // RF-002: sem perfil ainda, a rota leva ao formulario.
  }, []);

  const sair = useCallback(async () => {
    await repo.sair();
    setSessao(null);
    setPerfil(null);
  }, []);

  const excluirConta = useCallback(async () => {
    await repo.excluirConta();
    setSessao(null);
    setPerfil(null);
  }, []);

  const recarregarPerfil = useCallback(async () => {
    setPerfil(await repo.meuPerfil());
  }, []);

  const valor = useMemo<ContextoSessao>(
    () => ({ sessao, perfil, carregando, entrar, criarConta, sair, excluirConta, recarregarPerfil }),
    [sessao, perfil, carregando, entrar, criarConta, sair, excluirConta, recarregarPerfil],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSessao precisa estar dentro de ProvedorSessao.');
  return ctx;
}
