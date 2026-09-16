import { Link } from 'react-router-dom';
import type { Participante } from '../lib/dominio';
import { slugTema } from '../lib/dominio';
import { diaEMes, quandoPorExtenso, selo } from '../lib/datas';
import type {
  DiscussaoCompleta, EventoComAutor, ParticipanteResumo, ProjetoComAutor,
} from '../data/tipos';

/** Marca visível de que o registro veio do lote de demonstração. */
export function SeloExemplo({ mostrar }: { mostrar?: boolean }) {
  if (!mostrar) return null;
  return <span className="selo-exemplo">Exemplo</span>;
}

export function Foto({ pessoa, grande = false, mini = false }: {
  pessoa: { nome: string; foto: string | null };
  grande?: boolean;
  /** Tamanho de cabeçalho: alvo de toque sem virar uma foto de perfil. */
  mini?: boolean;
}) {
  const classe = ['moldura', grande && 'moldura--grande', mini && 'moldura--mini']
    .filter(Boolean).join(' ');
  if (pessoa.foto) {
    return <img className={classe} src={pessoa.foto} alt={`Foto de ${pessoa.nome}`} />;
  }
  return (
    <div className={`${classe} moldura--vazia`} aria-hidden="true">
      {pessoa.nome.trim().charAt(0) || '?'}
    </div>
  );
}

export function CardPessoa({ pessoa }: { pessoa: Participante }) {
  return (
    <article className="card">
      <SeloExemplo mostrar={pessoa.demo} />
      <div className="pessoa-linha">
        <Foto pessoa={pessoa} />
        <div style={{ minWidth: 0 }}>
          <h3 className="card__titulo">
            <span className="seta" aria-hidden="true" />
            <Link to={`/pessoas/${pessoa.id}`}>{pessoa.nome}</Link>
          </h3>
          <p className="card__meta">
            {pessoa.ocupacao} · {pessoa.cidade}
          </p>
        </div>
      </div>
      <p className="miudo">{pessoa.mini_bio}</p>
      <ul className="chips" aria-label="O que sabe fazer">
        {pessoa.habilidades_oferecidas.map((h) => (
          <li key={h}><span className="chip">{h}</span></li>
        ))}
      </ul>
    </article>
  );
}

export function CardPessoaCompacto({ pessoa }: { pessoa: ParticipanteResumo }) {
  return (
    <article className="card">
      <div className="pessoa-linha">
        <Foto pessoa={pessoa} />
        <div style={{ minWidth: 0 }}>
          <h3 className="card__titulo">
            <span className="seta" aria-hidden="true" />
            <Link to={`/pessoas/${pessoa.id}`}>{pessoa.nome}</Link>
          </h3>
          <p className="card__meta">{pessoa.ocupacao} · {pessoa.cidade}</p>
        </div>
      </div>
    </article>
  );
}

export function CardProjeto({ projeto }: { projeto: ProjetoComAutor }) {
  return (
    <article className="card">
      <SeloExemplo mostrar={projeto.demo} />
      {projeto.imagem && (
        <img className="card__capa" src={projeto.imagem} alt={`Capa de ${projeto.nome}`} />
      )}
      <h3 className="card__titulo">
        <span className="seta" aria-hidden="true" />
        <Link to={`/projetos/${projeto.id}`}>{projeto.nome}</Link>
      </h3>
      <p className="card__meta">
        {projeto.estagio}
        {projeto.onde_cidade ? ` · ${projeto.onde_cidade}` : ''}
        {projeto.autor ? ` · por ${projeto.autor.nome}` : ''}
      </p>
      <p className="miudo">{projeto.o_que_e}</p>
      {projeto.busca_pessoas ? (
        <>
          <span className="rotulo" style={{ marginTop: '0.75rem' }}>Procura quem sabe</span>
          <ul className="chips" aria-label="Quem o projeto procura">
            {projeto.conhecimentos_procurados.map((c) => (
              <li key={c}><span className="chip">{c}</span></li>
            ))}
          </ul>
        </>
      ) : (
        <p className="miudo" style={{ marginTop: '0.75rem' }}>
          <span className="chip chip--inverso">Não tá procurando gente agora</span>
        </p>
      )}
    </article>
  );
}

/**
 * Selo de data sobre o banner. Um dia só empilha dia e mês, que é o que se lê
 * de longe numa grade; um intervalo vira uma linha só, menor, porque empilhar
 * quatro pedaços viraria um bloco maior que o próprio cartaz.
 */
function SeloDeData({ evento }: { evento: EventoComAutor }) {
  if (evento.data_fim) {
    return (
      <span className="selo-data selo-data--intervalo">
        {diaEMes(evento.data_inicio)} — {diaEMes(evento.data_fim)}
      </span>
    );
  }
  const { dia, mes } = selo(evento.data_inicio);
  return (
    <span className="selo-data">
      <strong>{dia}</strong>
      {mes}
    </span>
  );
}

/**
 * "Não informado" não vira chip: um selo dizendo que não se sabe ocupa espaço
 * pra não informar nada. Devolve null, e quem chama não cria o item da lista.
 */
export function chipDeEntrada(entrada: EventoComAutor['entrada']) {
  if (entrada === 'Gratuito') return <span className="chip">Grátis</span>;
  if (entrada === 'Pago') return <span className="chip chip--inverso">Pago</span>;
  return null;
}

export function CardEvento({ evento, passado = false }: {
  evento: EventoComAutor;
  passado?: boolean;
}) {
  const onde = evento.formato === 'Online'
    ? 'Online'
    : `${evento.cidade}, ${evento.estado}`;
  const areas = evento.areas.slice(0, 2);
  const sobrando = evento.areas.length - areas.length;
  const entrada = chipDeEntrada(evento.entrada);

  return (
    <article className={passado ? 'card card--evento card--passado' : 'card card--evento'}>
      <SeloExemplo mostrar={evento.demo} />
      <div className="card__banner">
        <img className="card__capa" src={evento.banner} alt={`Cartaz de ${evento.titulo}`} />
        <SeloDeData evento={evento} />
      </div>
      <h3 className="card__titulo card__titulo--evento">
        <Link to={`/eventos/${evento.id}`}>{evento.titulo}</Link>
      </h3>
      <p className="card__meta">
        <span className="seta" aria-hidden="true" />
        {onde}
      </p>
      <p className="card__meta">{quandoPorExtenso(evento)}</p>
      <ul className="chips" aria-label="Entrada e áreas">
        {entrada && <li>{entrada}</li>}
        {areas.map((a) => <li key={a}><span className="chip chip--inverso">{a}</span></li>)}
        {sobrando > 0 && (
          <li><span className="chip chip--inverso">+{sobrando}</span></li>
        )}
      </ul>
    </article>
  );
}

export function CardDiscussao({ discussao }: { discussao: DiscussaoCompleta }) {
  return (
    <article className="card">
      <SeloExemplo mostrar={discussao.demo} />
      <p style={{ margin: '0 0 0.5rem' }}>
        <Link className="chip" to={`/temas/${slugTema(discussao.tema)}`}>{discussao.tema}</Link>
      </p>
      <h3 className="card__titulo">
        <span className="seta" aria-hidden="true" />
        <Link to={`/assuntos/${discussao.id}`}>{discussao.titulo}</Link>
      </h3>
      <p className="card__meta">
        {discussao.autor ? `Puxado por ${discussao.autor.nome}` : 'Puxado na rede'}
        {/* Assunto solto nao mostra nada no lugar da origem. */}
        {discussao.projeto && (
          <>
            {' · a partir de '}
            <Link to={`/projetos/${discussao.projeto.id}`}>{discussao.projeto.nome}</Link>
          </>
        )}
      </p>
      <p className="miudo">
        {discussao.total_participantes === 1
          ? '1 pessoa na conversa'
          : `${discussao.total_participantes} pessoas na conversa`}
      </p>
    </article>
  );
}
