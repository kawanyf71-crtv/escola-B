import { useCallback, useEffect, useRef, useState } from 'react';

export interface Consulta<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

/**
 * Carrega dados assincronos guardando os tres estados que toda tela precisa
 * tratar (RNF "Falhas"): carregando, erro e resultado. `deps` segue a mesma
 * regra do useEffect.
 */
export function useConsulta<T>(buscar: () => Promise<T>, deps: unknown[]): Consulta<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const ultimaChamada = useRef(0);

  // `buscar` costuma ser uma arrow nova a cada render; as deps declaradas pela
  // tela e que definem quando refazer a consulta.
  const executar = useRef(buscar);
  executar.current = buscar;

  useEffect(() => {
    const chamada = ++ultimaChamada.current;
    setCarregando(true);
    setErro(null);
    executar.current()
      .then((resultado) => {
        if (chamada !== ultimaChamada.current) return; // resposta obsoleta
        setDados(resultado);
      })
      .catch((e: unknown) => {
        if (chamada !== ultimaChamada.current) return;
        setErro(e instanceof Error ? e.message : 'Travou aqui. Tenta de novo.');
      })
      .finally(() => {
        if (chamada !== ultimaChamada.current) return;
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tentativa]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  return { dados, carregando, erro, recarregar };
}
