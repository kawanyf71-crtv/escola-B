import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Carregando, Erro } from '../components/Estados';
import { UFS, type Uf } from '../lib/dominio';
import type { PerfilSuspenso } from '../lib/dominio';
import {
  combina, comArroba, limparHandle, linkDoInstagram, ondeFica, rotuloDaRede, viraLink,
} from '../lib/redes';
import { repo } from '../data';
import { useConsulta } from '../lib/useConsulta';
import { useSessao } from '../lib/sessao';

/**
 * Uma pessoa por linha, não um card. A lista é de @, não de perfil: cada linha
 * tem uma informação e meia, e uma grade de cards pra isso viraria 139
 * retângulos quase vazios.
 */
function Linha({ perfil }: { perfil: PerfilSuspenso }) {
  const onde = ondeFica(perfil);
  return (
    <li className="rede">
      <span className="seta seta--amarela" aria-hidden="true" />
      <div className="rede__quem">
        <p className="rede__nome">{rotuloDaRede(perfil)}</p>
        {(onde || perfil.ocupacao) && (
          <p className="rede__onde">
            {[onde, perfil.ocupacao].filter(Boolean).join(' · ')}
          </p>
        )}
        {perfil.handles.length > 0 && (
          <p className="rede__arrobas">
            {perfil.handles.map((h) => (viraLink(perfil, h) ? (
              <a key={h} href={linkDoInstagram(h)} target="_blank" rel="noopener noreferrer">
                {comArroba(h)}
              </a>
            ) : (
              /* Handle que parece endereço de site: aparece como texto, sem
                 link, até a dona confirmar qual é o @ certo. Mandar alguém pra
                 um perfil errado é pior do que não mandar. */
              <span key={h} className="rede__sem-link">{comArroba(h)}</span>
            )))}
          </p>
        )}
      </div>
      {perfil.reivindicado_por && (
        <Link className="chip rede__chip" to={`/pessoas/${perfil.reivindicado_por}`}>
          Já tá aqui
        </Link>
      )}
    </li>
  );
}

/**
 * "Esse @ é meu e eu não quero estar aqui." Não pede login, não pede prova e
 * não passa por aprovação de ninguém: quem está nesta lista, por definição,
 * ainda não tem conta aqui — exigir login pra sair seria exigir entrar pra
 * poder sair. A lista foi montada sem ninguém pedir pra entrar; sair dela
 * precisa ser mais fácil do que entrar.
 */
function Saida({ aoSair }: { aoSair: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [handle, setHandle] = useState('');
  const [estado, setEstado] = useState<'parado' | 'indo' | 'feito' | 'nao-achou'>('parado');
  const [falha, setFalha] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpo = limparHandle(handle);
    if (!limpo) return;
    setEstado('indo');
    setFalha(null);
    try {
      const saiu = await repo.sairDaLista(limpo);
      setEstado(saiu ? 'feito' : 'nao-achou');
      if (saiu) aoSair();
    } catch (erro) {
      setEstado('parado');
      setFalha(erro instanceof Error ? erro.message : 'Não deu pra fazer isso agora.');
    }
  }

  if (estado === 'feito') {
    return (
      <p className="saida__pronto" role="status">
        Pronto: <strong>{comArroba(limparHandle(handle))}</strong> saiu da lista.
        Ninguém mais vê esse @ aqui.
      </p>
    );
  }

  return (
    <div className="saida">
      <button
        type="button"
        className="ligacao-discreta"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        Esse @ é meu e eu não quero estar aqui
      </button>

      {aberto && (
        <form className="saida__forma" onSubmit={enviar}>
          <div className="campo">
            <label className="rotulo" htmlFor="saida-handle">Seu @</label>
            <input
              id="saida-handle" type="text" value={handle} placeholder="@seuperfil"
              autoComplete="off" onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <button className="botao botao--vermelho botao--pequeno" type="submit"
                  disabled={estado === 'indo'}>
            {estado === 'indo' ? 'Tirando…' : 'Tirar da lista'}
          </button>
          {estado === 'nao-achou' && (
            <p className="miudo" role="status">
              Esse @ não tá na lista. Confere se escreveu igualzinho — ou já saiu daqui.
            </p>
          )}
          {falha && <p className="miudo" role="alert">{falha}</p>}
        </form>
      )}
    </div>
  );
}

export function Redes() {
  // Esta é a única tela de dentro do site aberta a quem não entrou, e a volta
  // muda com isso: quem tem conta volta pra turma, quem não tem volta pro
  // começo — mandar alguém deslogado pra /pessoas seria mandar pro login.
  const { sessao } = useSessao();
  const [busca, setBusca] = useState('');
  const [uf, setUf] = useState<Uf | ''>('');

  const lista = useConsulta(() => repo.listarPerfisSuspensos(), []);
  const todos = useMemo(() => lista.dados ?? [], [lista.dados]);

  // Só as UFs que aparecem: um filtro com 27 estados pra uma lista que tem 19
  // é um filtro que devolve vazio de propósito.
  const ufs = useMemo(() => {
    const presentes = new Set(todos.map((p) => p.uf).filter(Boolean) as Uf[]);
    return UFS.filter((u) => presentes.has(u.sigla));
  }, [todos]);

  const encontrados = useMemo(
    () => todos.filter((p) => (!uf || p.uf === uf) && combina(p, busca)),
    [todos, uf, busca],
  );

  const chegaram = todos.filter((p) => p.reivindicado_por).length;
  const filtrando = Boolean(busca.trim() || uf);

  return (
    <>
      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <Link className="migalha" to={sessao ? '/pessoas' : '/'}>
            <span className="seta" aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            {sessao ? 'Voltar pra turma' : 'Voltar pro começo'}
          </Link>
          <h1>As redes<br />da turma</h1>
          <p className="miudo">
            Os @ que a galera foi deixando no grupo. Se o seu tá aqui, tem um lugar
            guardado pra você.
          </p>
          {!lista.carregando && !lista.erro && (
            <p className="contagem contagem--amarela">
              {todos.length} {todos.length === 1 ? 'pessoa' : 'pessoas'} na lista
              {' · '}
              {chegaram} já {chegaram === 1 ? 'chegou' : 'chegaram'}
            </p>
          )}
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <h2 className="visualmente-oculto">Procurar na lista</h2>
          <div className="filtros filtros--dois">
            <div>
              <label className="rotulo" htmlFor="busca-rede">Procura por nome ou @</label>
              <input
                id="busca-rede" type="search" value={busca} placeholder="Nome ou @"
                autoComplete="off" onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="uf-rede">Estado</label>
              <select id="uf-rede" value={uf}
                      onChange={(e) => setUf(e.target.value as Uf | '')}>
                <option value="">Todos</option>
                {ufs.map((u) => (
                  <option key={u.sigla} value={u.sigla}>{u.sigla} — {u.nome}</option>
                ))}
              </select>
            </div>
          </div>
          {filtrando && (
            <div className="filtros__rodape">
              <p className="miudo" aria-live="polite">
                {encontrados.length === 1
                  ? '1 pessoa encontrada'
                  : `${encontrados.length} pessoas encontradas`}
              </p>
              <button type="button" className="botao botao--preto botao--pequeno"
                      onClick={() => { setBusca(''); setUf(''); }}>
                Limpar
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          {lista.carregando && <Carregando quantidade={4} rotulo="Buscando a lista" />}
          {lista.erro && <Erro mensagem={lista.erro} aoTentarDeNovo={lista.recarregar} />}

          {!lista.carregando && !lista.erro && encontrados.length === 0 && (
            <div className="cartaz cartaz--vermelho">
              <span className="seta seta--cartaz" aria-hidden="true" />
              <h3>Não achamos<br />esse @ aqui</h3>
              <p>
                Tenta escrever só um pedaço do nome, ou tira o filtro de estado.
              </p>
            </div>
          )}

          {!lista.carregando && !lista.erro && encontrados.length > 0 && (
            <ul className="redes">
              {encontrados.map((p) => <Linha key={p.id} perfil={p} />)}
            </ul>
          )}
        </div>
      </section>

      <section className="faixa faixa--fina">
        <div className="faixa__interno">
          <Saida aoSair={lista.recarregar} />
        </div>
      </section>
    </>
  );
}
