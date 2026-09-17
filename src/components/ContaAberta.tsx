import { useSessao } from '../lib/sessao';

/**
 * Lembrete de que a conta já existe, e qual é ela.
 *
 * Do cadastro em diante, toda porta (`/`, `/entrar`, `/criar-conta`) leva quem
 * tem sessão e ainda não publicou perfil pra dentro do fluxo — e o fluxo não
 * dizia em lugar nenhum que já havia uma conta, qual era o e-mail dela, nem
 * como voltar. Quem fechava o navegador e voltava caía numa tela que PARECE o
 * primeiro passo e concluía, com razão, que nunca tinha criado conta nenhuma.
 *
 * O e-mail e a senha continuam sendo pedidos uma vez só, em `/criar-conta`.
 * Isto aqui não é passo novo: é o recibo daquele passo, e o único caminho
 * visível pra sair e entrar com outra conta.
 */
export function ContaAberta() {
  const { sessao, perfil, sair } = useSessao();

  // Com perfil publicado, quem cuida disso é Meu espaço.
  if (!sessao || perfil) return null;

  return (
    <div className="conta-aberta">
      <p className="conta-aberta__linha">
        Sua conta já tá criada: <strong>{sessao.email}</strong>. É com esse e-mail e a
        senha que você escolheu que você entra de novo, de qualquer aparelho.
      </p>
      <button type="button" className="ligacao-discreta" onClick={() => { void sair(); }}>
        Não é você? Sair
      </button>
    </div>
  );
}
