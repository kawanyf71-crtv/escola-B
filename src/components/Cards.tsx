import { Link } from 'react-router-dom';
import type { Participante } from '../lib/dominio';
import { slugTema } from '../lib/dominio';
import type { DiscussaoCompleta, ParticipanteResumo, ProjetoComAutor } from '../data/tipos';

export function Foto({ pessoa, grande = false }: {
  pessoa: { nome: string; foto: string | null };
  grande?: boolean;
}) {
  const classe = grande ? 'moldura moldura--grande' : 'moldura';
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
      <ul className="chips" aria-label="Habilidades que oferece">
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
          <ul className="chips" aria-label="Conhecimentos procurados">
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

export function CardDiscussao({ discussao }: { discussao: DiscussaoCompleta }) {
  return (
    <article className="card">
      <p style={{ margin: '0 0 0.5rem' }}>
        <Link className="chip" to={`/temas/${slugTema(discussao.tema)}`}>{discussao.tema}</Link>
      </p>
      <h3 className="card__titulo">
        <span className="seta" aria-hidden="true" />
        <Link to={`/discussoes/${discussao.id}`}>{discussao.titulo}</Link>
      </h3>
      <p className="card__meta">
        {discussao.autor ? `Aberta por ${discussao.autor.nome}` : 'Aberta na rede'}
        {discussao.projeto ? ' · nasceu de ' : ''}
        {discussao.projeto && (
          <Link to={`/projetos/${discussao.projeto.id}`}>{discussao.projeto.nome}</Link>
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
