/**
 * Datas de evento são data pura (AAAA-MM-DD), sem hora e sem fuso: um evento no
 * dia 28 é dia 28 em qualquer lugar do país. Por isso nada aqui usa `new
 * Date(texto)` — o construtor lê "2026-11-28" como meia-noite UTC e, no fuso do
 * Brasil, devolve o dia 27. A conversão é sempre explícita, campo a campo.
 */

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                      'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
               'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
              'Quinta-feira', 'Sexta-feira', 'Sábado'];

/** AAAA-MM-DD → Date no fuso local, à meia-noite. */
export function paraData(texto: string): Date {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1);
}

/** Date → AAAA-MM-DD, sem passar por UTC. */
export function paraTexto(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hoje(): string {
  return paraTexto(new Date());
}

/** O dia em que o evento deixa de estar por vir: o fim, ou o começo se não há fim. */
export function ultimoDia(e: { data_inicio: string; data_fim: string | null }): string {
  return e.data_fim ?? e.data_inicio;
}

/** Já rolou quando o último dia ficou para trás. O próprio dia ainda conta. */
export function jaRolou(
  e: { data_inicio: string; data_fim: string | null }, referencia = hoje(),
): boolean {
  return ultimoDia(e) < referencia;
}

/** "28" e "NOV" — as duas linhas do selo sobre o banner. */
export function selo(data: string): { dia: string; mes: string } {
  const d = paraData(data);
  return {
    dia: String(d.getDate()).padStart(2, '0'),
    mes: MESES_CURTOS[d.getMonth()].toUpperCase(),
  };
}

/** "28 NOV" — usado no selo de intervalo, que cabe em uma linha só. */
export function diaEMes(data: string): string {
  const { dia, mes } = selo(data);
  return `${dia} ${mes}`;
}

/** "Sábado, 28 de novembro" — o "de 2026" só entra se não for o ano corrente. */
export function porExtenso(data: string): string {
  const d = paraData(data);
  const ano = d.getFullYear() === new Date().getFullYear() ? '' : ` de ${d.getFullYear()}`;
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}${ano}`;
}

/** "19h" ou "19h30" — ninguém escreve "19:00" num cartaz. */
export function horaPorExtenso(horario: string): string {
  const [h, m] = horario.split(':');
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`;
}

/** A linha inteira do card: data por extenso mais a hora, quando houver. */
export function quandoPorExtenso(
  e: { data_inicio: string; data_fim: string | null; horario: string | null },
): string {
  const inicio = porExtenso(e.data_inicio);
  const fim = e.data_fim ? ` até ${porExtenso(e.data_fim)}` : '';
  const hora = e.horario ? ` às ${horaPorExtenso(e.horario)}` : '';
  return `${inicio}${fim}${hora}`;
}

/** Chave e rótulo do grupo de mês: "2026-11" e "NOVEMBRO DE 2026". */
export function mesDe(data: string): { chave: string; rotulo: string } {
  const d = paraData(data);
  return {
    chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    rotulo: `${MESES[d.getMonth()]} de ${d.getFullYear()}`.toUpperCase(),
  };
}

export const JANELAS = ['Esta semana', 'Este mês', 'Próximos três meses'] as const;
export type Janela = (typeof JANELAS)[number];

/**
 * O último dia que ainda cabe na janela escolhida. "Esta semana" são sete dias
 * corridos a partir de hoje, não a semana do calendário: quem abre o mural na
 * quinta quer saber do fim de semana, não que a semana acabe no sábado.
 */
export function fimDaJanela(janela: Janela, referencia = hoje()): string {
  const d = paraData(referencia);
  if (janela === 'Esta semana') d.setDate(d.getDate() + 7);
  else if (janela === 'Este mês') d.setMonth(d.getMonth() + 1);
  else d.setMonth(d.getMonth() + 3);
  return paraTexto(d);
}

/** Aceita o endereço colado sem esquema, em vez de reprovar por causa disso. */
export function normalizarLink(bruto: string): string {
  const texto = bruto.trim();
  if (!texto) return texto;
  return /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
}
