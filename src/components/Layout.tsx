import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSessao } from '../lib/sessao';

const LINKS = [
  { para: '/pessoas', texto: 'Pessoas' },
  { para: '/projetos', texto: 'Projetos' },
  { para: '/discussoes', texto: 'Discussões' },
  { para: '/temas', texto: 'Temas' },
  { para: '/meu-espaco', texto: 'Meu espaço' },
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
    <div className="pagina">
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>

      <header className="cabecalho">
        <div className="cabecalho__barra">
          <Link className="marca" to={logado ? '/pessoas' : '/'}>
            <span className="seta seta--amarela" aria-hidden="true" />
            Rede Escola B
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
                className="menu-botao"
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
          <nav aria-label="Principal">
            {LINKS.map((l) => (
              <NavLink key={l.para} to={l.para}>
                <span className="seta" aria-hidden="true" />
                {l.texto}
              </NavLink>
            ))}
          </nav>
          <div className="acoes">
            <button type="button" className="botao botao--preto" onClick={encerrar}>
              <span className="seta" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      )}

      <main className="conteudo" id="conteudo">{children}</main>

      <footer className="rodape">
        <div className="faixa__interno">
          <p className="rotulo">Rede Escola B</p>
          <p className="miudo" style={{ maxWidth: '34rem' }}>
            Feito por uma aluna da turma, pra turma. O curso acaba em novembro — o que
            a gente construir aqui não precisa acabar junto.
          </p>
        </div>
      </footer>
    </div>
  );
}
