# Foto da bio

A foto que aparece ao lado do texto de "Quem construiu", na `/inicio`.

Coloque o arquivo aqui com o nome `kawany`, em qualquer formato que o navegador
abra: `kawany.jpg`, `kawany.jpeg`, `kawany.png` ou `kawany.webp`.

Não precisa mexer em código. A página procura o arquivo na hora do build
(`import.meta.glob` em `src/pages/Inicio.tsx`) e passa a mostrá-lo sozinha. Sem
arquivo, o espaço fica com a inicial dentro da moldura, como um perfil sem foto
— nada quebra e nada fica com cara de imagem faltando.

Proporção: o espaço é 3:4 (retrato) e a imagem é cortada pelo centro
(`object-fit: cover`). Uma foto com o rosto no terço de cima funciona melhor.

Tamanho: o espaço tem 208px de largura no desktop. Uma imagem de ~600px de
largura já cobre telas de alta densidade; acima disso é peso à toa no bundle.
