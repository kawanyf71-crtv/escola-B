import { useEffect, useRef, useState } from 'react';

/**
 * RNF "Falhas": formularios longos salvam rascunho. O estado do formulario vai
 * para o localStorage a cada mudanca e volta quando a pessoa reabre a tela —
 * fechar o navegador no meio do preenchimento nao custa o trabalho feito.
 */
export function useRascunho<T extends object>(
  chave: string,
  inicial: T,
): [T, (novo: T | ((anterior: T) => T)) => void, () => void] {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(`rascunho/${chave}`);
      return salvo ? { ...inicial, ...(JSON.parse(salvo) as Partial<T>) } : inicial;
    } catch {
      return inicial;
    }
  });

  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    try {
      localStorage.setItem(`rascunho/${chave}`, JSON.stringify(valor));
    } catch {
      // Cota cheia ou armazenamento bloqueado: o formulario segue funcionando
      // sem rascunho, que e uma conveniencia e nao um requisito do envio.
    }
  }, [chave, valor]);

  function descartar() {
    try { localStorage.removeItem(`rascunho/${chave}`); } catch { /* idem */ }
  }

  return [valor, setValor, descartar];
}
