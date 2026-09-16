import { useEffect } from 'react';
import {
  BrowserRouter, HashRouter, Link, Navigate, Route, Routes, useLocation,
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { CriarConta, Entrar } from './pages/Acesso';
import { Discussao } from './pages/Discussao';
import { Discussoes } from './pages/Discussoes';
import { Entrada } from './pages/Entrada';
import { FormularioProjeto } from './pages/FormularioProjeto';
import { Inicio } from './pages/Inicio';
import { Interessados } from './pages/Interessados';
import { MeuEspaco } from './pages/MeuEspaco';
import { MeuPerfil } from './pages/MeuPerfil';
import { NovoAssunto } from './pages/NovoAssunto';
import { Perfil } from './pages/Perfil';
import { Pessoas } from './pages/Pessoas';
import { Projeto } from './pages/Projeto';
import { Projetos } from './pages/Projetos';
import { Tema } from './pages/Tema';
import { Temas } from './pages/Temas';
import { ProvedorSessao, useSessao } from './lib/sessao';

function AoTrocarDeRota() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Espera() {
  return (
    <section className="faixa">
      <div className="faixa__interno">
        <h1>Só um<br />segundo…</h1>
        <span className="visualmente-oculto" role="status">Buscando a rede…</span>
      </div>
    </section>
  );
}

/**
 * RF-002: quem entrou mas ainda não tem perfil vai direto ao formulário, não a
 * uma home vazia. RN-009: só quem tem perfil publicado vê a rede.
 */
function Protegida({ children, exigePerfil = true }: {
  children: React.ReactNode;
  exigePerfil?: boolean;
}) {
  const { sessao, perfil, carregando } = useSessao();
  if (carregando) return <Espera />;
  if (!sessao) return <Navigate to="/entrar" replace />;
  if (exigePerfil && !perfil) return <Navigate to="/meu-perfil" replace />;
  return <>{children}</>;
}

/** A entrada e as telas de acesso não fazem sentido para quem já está dentro. */
function SoVisitante({ children }: { children: React.ReactNode }) {
  const { sessao, perfil, carregando } = useSessao();
  if (carregando) return <Espera />;
  if (sessao && !perfil) return <Navigate to="/meu-perfil" replace />;
  if (sessao) return <Navigate to="/pessoas" replace />;
  return <>{children}</>;
}

function Rotas() {
  return (
    <Layout>
      <AoTrocarDeRota />
      <Routes>
        <Route path="/" element={<SoVisitante><Entrada /></SoVisitante>} />
        <Route path="/entrar" element={<SoVisitante><Entrar /></SoVisitante>} />
        <Route path="/criar-conta" element={<SoVisitante><CriarConta /></SoVisitante>} />

        <Route path="/inicio" element={<Protegida><Inicio /></Protegida>} />

        <Route
          path="/meu-perfil"
          element={<Protegida exigePerfil={false}><MeuPerfil /></Protegida>}
        />

        <Route path="/pessoas" element={<Protegida><Pessoas /></Protegida>} />
        <Route path="/pessoas/:id" element={<Protegida><Perfil /></Protegida>} />

        <Route path="/projetos" element={<Protegida><Projetos /></Protegida>} />
        <Route path="/projetos/novo" element={<Protegida><FormularioProjeto /></Protegida>} />
        <Route path="/projetos/:id" element={<Protegida><Projeto /></Protegida>} />
        <Route
          path="/projetos/:id/editar"
          element={<Protegida><FormularioProjeto /></Protegida>}
        />
        <Route
          path="/projetos/:id/quem-chegou-junto"
          element={<Protegida><Interessados /></Protegida>}
        />

        <Route path="/assuntos" element={<Protegida><Discussoes /></Protegida>} />
        <Route path="/assuntos/novo" element={<Protegida><NovoAssunto /></Protegida>} />
        <Route path="/assuntos/:id" element={<Protegida><Discussao /></Protegida>} />

        <Route path="/temas" element={<Protegida><Temas /></Protegida>} />
        <Route path="/temas/:slug" element={<Protegida><Tema /></Protegida>} />

        <Route path="/meu-espaco" element={<Protegida><MeuEspaco /></Protegida>} />

        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Layout>
  );
}

function NaoEncontrada() {
  return (
    <section className="faixa">
      <div className="faixa__interno">
        <h1>Essa página<br />não existe</h1>
        <div className="acoes">
          <Link className="botao botao--preto" to="/">
            <span className="seta" aria-hidden="true" />Voltar ao começo
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Com VITE_ROTEADOR=hash as rotas viram /#/projetos e o site roda em qualquer
 * hospedagem estatica sem configurar fallback de SPA. O padrao continua sendo
 * URL limpa, para quem servir de um dominio proprio com o fallback ligado.
 */
const Roteador = import.meta.env.VITE_ROTEADOR === 'hash' ? HashRouter : BrowserRouter;

export function App() {
  return (
    <Roteador>
      <ProvedorSessao>
        <Rotas />
      </ProvedorSessao>
    </Roteador>
  );
}
