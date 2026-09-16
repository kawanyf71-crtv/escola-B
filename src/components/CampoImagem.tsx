import { useId, useRef, useState, type DragEvent } from 'react';
import { comprimir, tipoAceito, type RegraDeImagem } from '../lib/imagem';
import { repo } from '../data';

const ACEITOS = 'image/jpeg,image/png,image/webp';

/**
 * Campo de imagem reutilizável: clique ou arrastar e soltar, pré-visualização
 * antes de salvar e remoção. Sempre opcional.
 *
 * A imagem é comprimida no navegador antes de qualquer gravação e só então vai
 * para o repositório, que decide onde ela mora — Storage do Supabase ou data
 * URL. A tela não sabe qual dos dois aconteceu.
 */
export function CampoImagem({
  rotulo, dica, proporcao, regra, pasta, valor, aoMudar,
}: {
  rotulo: string;
  dica: string;
  proporcao: '1:1' | '16:9';
  regra: RegraDeImagem;
  pasta: 'perfis' | 'projetos' | 'eventos';
  /** URL ou data URL já guardada. Registros antigos com URL http continuam valendo. */
  valor: string | null;
  aoMudar: (novo: string | null) => void;
}) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function receber(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    if (!tipoAceito(arquivo.type)) {
      setErro('Essa imagem precisa ser JPG, PNG ou WEBP.');
      return;
    }
    setProcessando(true);
    try {
      const imagem = await comprimir(arquivo, regra);
      aoMudar(await repo.enviarImagem(imagem.blob, imagem.dataUrl, pasta));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu pra usar essa imagem.');
    } finally {
      setProcessando(false);
      // Permite escolher o mesmo arquivo de novo depois de remover.
      if (entrada.current) entrada.current.value = '';
    }
  }

  function soltar(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    receber(e.dataTransfer.files?.[0]);
  }

  const classeZona = [
    'zona-imagem',
    `zona-imagem--${proporcao === '1:1' ? 'quadrada' : 'larga'}`,
    arrastando ? 'zona-imagem--arrastando' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={erro ? 'campo campo--erro' : 'campo'}>
      <span className="rotulo" id={`${id}-rotulo`}>{rotulo}</span>
      <p className="campo__dica" id={`${id}-dica`}>{dica}</p>

      <div
        className={classeZona}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={soltar}
      >
        {valor ? (
          <img className="zona-imagem__previa" src={valor} alt="Prévia da imagem escolhida" />
        ) : (
          <>
            <input
              ref={entrada}
              id={id}
              className="zona-imagem__entrada"
              type="file"
              accept={ACEITOS}
              aria-labelledby={`${id}-rotulo`}
              aria-describedby={`${id}-dica`}
              disabled={processando}
              onChange={(e) => receber(e.target.files?.[0])}
            />
            <span className="zona-imagem__convite" aria-hidden="true">
              <span className="seta seta--grande" />
              {processando ? 'Preparando…' : 'Escolher imagem'}
            </span>
            <span className="zona-imagem__dica" aria-hidden="true">
              ou arrasta e solta aqui
            </span>
          </>
        )}
      </div>

      {valor && (
        <div className="acoes" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="botao botao--contorno botao--pequeno"
                  disabled={processando}
                  onClick={() => entrada.current?.click()}>
            {processando ? 'Preparando…' : 'Trocar imagem'}
          </button>
          <button type="button" className="botao botao--contorno botao--pequeno"
                  disabled={processando}
                  onClick={() => { aoMudar(null); setErro(null); }}>
            Remover imagem
          </button>
          {/* Fica fora da zona pra que a prévia ocupe a moldura inteira. */}
          <input
            ref={entrada}
            className="visualmente-oculto"
            type="file"
            accept={ACEITOS}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => receber(e.target.files?.[0])}
          />
        </div>
      )}

      {erro && <strong className="erro-campo">{erro}</strong>}
    </div>
  );
}
