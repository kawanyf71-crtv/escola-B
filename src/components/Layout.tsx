import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSessao } from '../lib/sessao';

/**
 * `barra` marca o que cabe na barra fixa do celular. São quatro — mais que isso
 * e cada alvo fica menor que o dedo. O que sobra vai pro menu de tela cheia,
 * que deixa de ser a navegação e passa a ser só o que se usa de vez em quando.
 */
const LINKS = [
  { para: '/inicio', texto: 'Início', barra: false },
  { para: '/pessoas', texto: 'Gente', barra: true },
  { para: '/projetos', texto: 'Projetos', barra: true },
  { para: '/assuntos', texto: 'Assuntos', barra: true },
  { para: '/temas', texto: 'Temas', barra: false },
  { para: '/meu-espaco', texto: 'Meu espaço', barra: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { sessao, perfil, sair } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);
  const local = useLocation();
  const navegar = useNavigate();

  useEffect(() => { setMenuAberto(false); }, [local.pathname]);

  // O menu de tela cheia trava a rolagem do fundo enquanto esta aberto.
  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAberto]);

  const logado = Boolean(sessao && perfil);

  async function encerrar() {
    await sair();
    navegar('/');
  }

  return (
    <div className={`pagina${logado ? ' pagina--com-barra' : ''}`}>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>

      <header className="cabecalho">
        <div className="cabecalho__barra">
          <Link className="marca" to={logado ? '/inicio' : '/'}>
            <span className="seta seta--amarela" aria-hidden="true" />
            Nóis
          </Link>

          {logado && (
            <>
              <nav className="nav-desktop" aria-label="Principal">
                {LINKS.map((l) => (
                  <NavLink key={l.para} to={l.para}>{l.texto}</NavLink>
                ))}
                <button type="button" className="nav-sair" onClick={encerrar}>Sair</button>
              </nav>
              <button
                type="button"
                className="menu-botao menu-botao--discreto"
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto(true)}
              >
                <span className="seta seta--baixo" aria-hidden="true" />
                Menu
              </button>
            </>
          )}

          {/* Com sessao aberta e perfil ainda por preencher, oferecer "Entrar"
              confundiria: o que falta e o formulario, e a saida e sair. */}
          {!logado && sessao && (
            <nav aria-label="Acesso">
              <button type="button" className="nav-sair" onClick={encerrar}>Sair</button>
            </nav>
          )}

          {!sessao && (
            <nav aria-label="Acesso">
              <Link className="menu-botao" to="/entrar">Entrar</Link>
            </nav>
          )}
        </div>
      </header>

      {menuAberto && (
        <div className="menu-cheio" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="menu-cheio__topo">
            <button type="button" className="botao botao--preto"
                    onClick={() => setMenuAberto(false)} autoFocus>
              Fechar
            </button>
          </div>
          {/* Sair é item do menu, não botão solto embaixo dele: aqui só mora o
              que é secundário, e os secundários têm o mesmo peso entre si. */}
          <nav aria-label="Mais">
            {LINKS.filter((l) => !l.barra).map((l) => (
              <NavLink key={l.para} to={l.para}>
                <span className="seta" aria-hidden="true" />
                {l.texto}
              </NavLink>
            ))}
            <button type="button" onClick={encerrar}>
              <span className="seta" aria-hidden="true" />
              Sair
            </button>
          </nav>
        </div>
      )}

      <main className="conteudo" id="conteudo">{children}</main>

      {/* A navegação do celular era um menu amarelo de tela cheia: pra trocar de
          seção a pessoa saía da página e voltava sem referência de onde estava.
          Aqui ela fica à vista o tempo todo, e o lugar onde se está também. */}
      {logado && (
        <nav className="barra-baixo" aria-label="Principal">
          {LINKS.filter((l) => l.barra).map((l) => (
            <NavLink key={l.para} to={l.para}>
              <span className="seta" aria-hidden="true" />
              {l.texto}
            </NavLink>
          ))}
        </nav>
      )}

      <footer className="rodape">
        <div className="faixa__interno">
          <p className="rotulo">Nóis</p>
          <p className="miudo" style={{ maxWidth: '34rem' }}>
            Feito por uma aluna da turma, pra turma. O curso acaba em novembro — o que
            a gente construir aqui não precisa acabar junto.
          </p>
        </div>
      </footer>
    </div>
  );
}
