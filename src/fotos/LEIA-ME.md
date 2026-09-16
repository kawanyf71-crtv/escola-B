# Foto da bio

A foto que aparece ao lado do texto de "Quem construiu", na `/inicio`.

## Como colocar

Jogue a imagem nesta pasta. **Qualquer nome serve** — `IMG_4821.jpg` está ótimo,
não precisa renomear. Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`.

Pelo navegador, sem baixar o projeto:
https://github.com/kawanyf71-crtv/escola-B/upload/claude/mvp-spec-vybd9z/src/fotos

Arrasta o arquivo, escreve qualquer mensagem de commit e confirma. Não precisa
mexer em código: a página varre esta pasta na hora do build
(`import.meta.glob` em `src/pages/Inicio.tsx`) e passa a mostrar a imagem.

Havendo mais de uma foto aqui, vale a primeira em ordem alfabética. Pra trocar,
apague a antiga.

## Sem arquivo

O espaço fica com a inicial dentro da moldura, como um perfil sem foto — nada
quebra, nada dá 404 e nada fica com cara de imagem faltando. É um estado, não um
placeholder.

## Enquadramento e peso

O espaço é 3:4 (retrato) e a imagem é cortada pelo centro (`object-fit: cover`).
Uma foto com o rosto no terço de cima funciona melhor.

No desktop o espaço tem 208px de largura. Uma imagem de ~600px de largura já
cobre tela de alta densidade; acima disso é peso à toa no bundle, porque esta
imagem entra no build e não passa pela compressão do upload de perfil.
