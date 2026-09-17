import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import type { PerfilSuspenso } from '../lib/dominio';
import { comArroba, combina, ondeFica, rotuloDaRede } from '../lib/redes';
import { guardarAdiantado } from '../lib/adiantado';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

/** Lista curta: quem procura o próprio nome não precisa de 139 linhas. */
const QUANTOS = 8;

/**
 * A etapa antes do formulário. Quem deixou o @ no grupo não deveria ter que
 * digitar do zero o que a turma já sabe: acha o próprio nome, clica em "sou
 * eu" e o formulário abre com o começo pronto.
 *
 * Nada aqui verifica identidade — e é de propósito. Quem diz que é a pessoa, é
 * a pessoa: a lista é de @ público de um grupo de curso, não de documento.
 */
export function Comecar() {
  const { perfil, sessao } = useSessao();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');

  const lista = useConsulta(() => repo.listarPerfisSuspensos(), []);
  const todos = useMemo(() => lista.dados ?? [], [lista.dados]);

  // Quem já foi reivindicado sai da busca: aquele lugar já tem dona.
  const livres = useMemo(() => todos.filter((p) => !p.reivindicado_por), [todos]);

  const procurando = busca.trim().length >= 2;
  const encontrados = useMemo(
    () => (procurando ? livres.filter((p) => combina(p, busca)).slice(0, QUANTOS) : []),
    [livres, busca, procurando],
  );

  // Quem já tem perfil não passa por aqui: o caminho dela é editar, não começar.
  if (perfil) return <Navigate to="/meu-perfil" replace />;

  function souEu(p: PerfilSuspenso) {
    guardarAdiantado(sessao?.usuario_id ?? 'anon', p);
    navegar('/meu-perfil');
  }

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h1>Já te esperavam<br />por aqui?</h1>
          <p style={{ maxWidth: '32rem' }}>
            Se você deixou seu @ no grupo, seu lugar já tá guardado. Procura seu nome
            ou seu @ que a gente adianta o começo pra você.
          </p>
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno" style={{ maxWidth: '40rem' }}>
          <div className="campo">
            <label className="rotulo" htmlFor="busca-comecar">Seu nome ou seu @</label>
            <input
              id="busca-comecar" type="search" value={busca} autoComplete="off"
              placeholder="Nome ou @" onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {lista.carregando && <Carregando quantidade={2} rotulo="Buscando a lista" />}
          {lista.erro && <Erro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />}

          {!lista.carregando && !lista.erro && (
            <>
              {!procurando && (
                <p className="miudo">
                  Tem {livres.length} {livres.length === 1 ? 'pessoa' : 'pessoas'} na
                  lista esperando. Escreve umas letras do seu nome ou do seu @.
                </p>
              )}

              {procurando && encontrados.length === 0 && (
                <p className="miudo" role="status">
                  Não achamos esse aí. Sem problema: dá pra começar do zero logo abaixo.
                </p>
              )}

              {encontrados.length > 0 && (
                <ul className="redes redes--curta" aria-live="polite">
                  {encontrados.map((p) => (
                    <li className="rede" key={p.id}>
                      <span className="seta seta--amarela" aria-hidden="true" />
                      <div className="rede__quem">
                        <p className="rede__nome">{rotuloDaRede(p)}</p>
                        {ondeFica(p) && <p className="rede__onde">{ondeFica(p)}</p>}
                        {p.handles.length > 0 && (
                          <p className="rede__arrobas">
                            {p.handles.map((h) => (
                              <span key={h} className="rede__sem-link">{comArroba(h)}</span>
                            ))}
                          </p>
                        )}
                      </div>
                      <button type="button" className="botao botao--amarelo botao--pequeno"
                              onClick={() => souEu(p)}>
                        Sou eu
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="acoes">
            <Link className="botao botao--contorno" to="/meu-perfil">
              Não tô na lista, quero começar do zero
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
