import { useState } from 'react';
import { Abertura } from '../components/Abertura';

/** Sem espaço, o número do WhatsApp com DDI do Brasil. */
const ZAP = 'https://wa.me/5511940391863';

/**
 * A foto da bio é procurada no build, não pedida ao servidor: se não houver
 * nenhuma imagem em `src/fotos/`, `glob` devolve um objeto vazio e a página nem
 * chega a tentar carregar nada — sem 404 no console e sem imagem quebrada na
 * tela.
 *
 * Vale qualquer nome de arquivo, porque quem sobe a foto pela interface do
 * GitHub não escolhe o nome: é o do arquivo que saiu da câmera. Havendo mais de
 * uma, a primeira em ordem alfabética ganha — ordenado, e não "a que o bundler
 * devolver primeiro", pra que dois builds do mesmo commit deem a mesma página.
 */
const FOTOS = import.meta.glob('../fotos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true, query: '?url', import: 'default',
});
const FOTO = Object.entries(FOTOS)
  .sort(([a], [b]) => a.localeCompare(b))[0]?.[1] as string | undefined;

export function Inicio() {
  const [bioAberta, setBioAberta] = useState(false);

  return (
    <>
      <Abertura dentro />

      <section className="faixa">
        <div className="faixa__interno">
          <h2>Como isso nasceu</h2>
          <p style={{ maxWidth: '36rem' }}>
            Este site não é da Escola B nem do BATEKOO. É um projeto independente
            construído pela aluna Kawany Feliciano.
          </p>
          <p style={{ maxWidth: '36rem' }}>
            Nasceu de uma constatação simples: tem muita gente boa aqui, com projeto
            na mão e talento sobrando, se apresentando no grupo — e nenhum lugar onde
            essas apresentações virem trabalho junto. É isso que este lugar resolve.
            Você diz o que faz, mostra o que tá tocando, e encontra quem tem o que falta.
          </p>
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          <h2>Quem construiu</h2>
          <p className="rotulo">Kawany Feliciano</p>

          <div className="bio">
            <div className="bio__foto">
              {FOTO
                ? <img className="retrato" src={FOTO} alt="Kawany Feliciano" />
                : <div className="retrato retrato--vazio" aria-hidden="true">K</div>}
            </div>

            <div className="bio__texto">
            <p>
              Sempre fui movida pelo criar. A vida sempre me pareceu fascinante pelas
              possibilidades infinitas de combinação — cada segundo vivido é um fragmento
              que compõe um quebra-cabeça muito mais complexo do que podemos imaginar,
              e que nos abre a porta para um universo inteiro de possibilidades.
            </p>

            {/* O resto fica guardado: quem quer saber abre, quem veio pela rede
                segue direto pro que interessa. */}
            <div id="bio-resto" hidden={!bioAberta}>
              <p>
                Como a vida poderia não ser magnífica se eu posso escrever um livro,
                compor uma música, produzir um filme, ensinar alguém, aprender algo novo,
                pintar um quadro, fazer um poema para quem eu amo?<br />
                Como poderia não ser poética, se eu nasci poeta?<br />
                Como poderia não ser arte, se eu nasci artista?<br />
                Esse ímpeto sempre esteve presente em mim desde que me entendo por gente.
              </p>
              <p>
                Comecei a trabalhar aos 15 anos, e desde então nunca fiquei muito tempo
                parada: fui empreendedora, professora, criadora de conteúdo, e encontrei
                na comunicação e no audiovisual o lugar onde toda essa vontade de criar
                finalmente ganhou estrutura e propósito. Construí minha trajetória na
                interseção entre comunicação, criatividade e produção, passando por
                instituições de ensino e empresas onde pude liderar projetos do conceito
                à execução.
              </p>
              <p>
                O que une tudo isso é a mesma pessoa: alguém que pensa em narrativas, que
                se importa genuinamente com quem está do outro lado da tela ou da câmera,
                e que não sabe fazer as coisas pela metade.
              </p>
            </div>

            <button
              type="button"
              className="botao botao--contorno botao--pequeno"
              aria-expanded={bioAberta}
              aria-controls="bio-resto"
              onClick={() => setBioAberta((a) => !a)}
            >
              {bioAberta ? 'Recolher' : 'Ler o resto'}
            </button>
            </div>
          </div>
        </div>
      </section>

      <section className="faixa">
        <div className="faixa__interno">
          <p className="selo-humano">
            Pensado e sentido por humanos<br />e desenvolvido por IA
          </p>
          <p style={{ maxWidth: '36rem' }}>
            Num tempo em que o medo da IA roubar a nossa arte cresce todo dia, escolhi
            usar ela como aliada — ferramenta de expansão da criatividade, não de
            substituição dela.
          </p>
          <p style={{ maxWidth: '36rem' }}>
            Construí esta plataforma sozinha, por vibe coding: escrevendo em português o
            que o sistema precisava fazer e deixando a IA escrever o código. Não sou
            desenvolvedora. A ideia, a estrutura e cada palavra daqui são minhas; a IA
            foi a ferramenta que tirou isso do papel em dias, não em meses.
          </p>
          <p style={{ maxWidth: '36rem' }}>
            Se você acredita que soluções de IA podem ajudar em algo o seu projeto, me
            manda uma mensagem que vai ser um prazer ajudar.
          </p>
          <div className="acoes">
            <a
              className="botao botao--contorno botao--pequeno"
              href={ZAP}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="seta" aria-hidden="true" />
              Me chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
