/**
 * Elementos gráficos da marca usados como quebra onde não há fotografia.
 * A identidade alterna bloco de cor cheia com imagem; sem imagem sobra só a
 * placa, e é isso que estes dois resolvem.
 */

/** Globo em traço grosso, sem preenchimento. Decorativo: não entra na leitura. */
export function Globo({ tamanho = 88, className }: { tamanho?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="42" />
      <ellipse cx="50" cy="50" rx="19" ry="42" />
      <line x1="9" y1="50" x2="91" y2="50" />
      <line x1="17" y1="29" x2="83" y2="29" />
      <line x1="17" y1="71" x2="83" y2="71" />
    </svg>
  );
}

/** Fileira de setas maciças usada como divisor entre blocos. */
export function FileiraDeSetas({ quantidade = 8 }: { quantidade?: number }) {
  return (
    <div className="divisor" aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => <span className="seta" key={i} />)}
    </div>
  );
}
