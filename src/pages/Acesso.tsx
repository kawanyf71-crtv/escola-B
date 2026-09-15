import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Campo } from '../components/Campos';
import { useSessao } from '../lib/sessao';

const SENHA_MINIMA = 6;

function FormularioAcesso({ modo }: { modo: 'entrar' | 'criar' }) {
  const { entrar, criarConta } = useSessao();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const criando = modo === 'criar';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (!email.trim()) novos.email = 'Informe seu e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      novos.email = 'Esse e-mail não parece válido.';
    }
    if (!senha) novos.senha = 'Informe uma senha.';
    else if (criando && senha.length < SENHA_MINIMA) {
      novos.senha = `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`;
    }
    setErros(novos);
    setFalha(null);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      if (criando) {
        await criarConta(email.trim(), senha);
        navegar('/meu-perfil'); // RF-002: direto ao formulario de perfil.
      } else {
        await entrar(email.trim(), senha);
        navegar('/pessoas');
      }
    } catch (e2) {
      setFalha(e2 instanceof Error ? e2.message : 'Não foi possível continuar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="faixa faixa--preto">
        <div className="faixa__interno">
          <h1>{criando ? 'Criar\nconta' : 'Entrar'}</h1>
        </div>
      </section>

      <section className="faixa faixa--claro">
        <div className="faixa__interno" style={{ maxWidth: '34rem' }}>
          {criando && (
            <div className="cartaz" style={{ marginBottom: '1.5rem' }}>
              <h3>Antes de começar</h3>
              <p className="miudo">
                Seu perfil, seus projetos e seus assuntos ficam visíveis pra toda a
                turma que entrar. Nada aqui vem de fora — tudo é o que você mesma
                escreve. Dá pra apagar a conta quando quiser, pelo Meu espaço.
              </p>
            </div>
          )}

          <form onSubmit={enviar} noValidate>
            {falha && <p className="aviso" role="alert">{falha}</p>}

            <Campo id="email" rotulo="E-mail" erro={erros.email} obrigatorio>
              <input
                id="email" type="email" value={email} autoComplete="email"
                aria-describedby={erros.email ? 'email-erro' : undefined}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Campo>

            <Campo
              id="senha" rotulo="Senha" erro={erros.senha} obrigatorio
              dica={criando ? `Pelo menos ${SENHA_MINIMA} caracteres.` : undefined}
            >
              <input
                id="senha" type="password" value={senha}
                autoComplete={criando ? 'new-password' : 'current-password'}
                aria-describedby={erros.senha ? 'senha-erro' : undefined}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Campo>

            <button className="botao botao--vermelho botao--bloco" type="submit" disabled={enviando}>
              <span className="seta" aria-hidden="true" />
              {enviando ? 'Um instante…' : criando ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem' }}>
            {criando ? (
              <>Já tem conta? <Link to="/entrar">Entrar</Link>.</>
            ) : (
              <>Primeira vez? <Link to="/criar-conta">Criar meu perfil</Link>.</>
            )}
          </p>
        </div>
      </section>
    </>
  );
}

export function CriarConta() { return <FormularioAcesso modo="criar" />; }
export function Entrar() { return <FormularioAcesso modo="entrar" />; }
