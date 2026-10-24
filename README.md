# Presence Insights — em pausa

Projeto guardado para terminar depois. A referência visual é a imagem de 6 telas do dono: Início, Importar, Seguidores, Comparar, Relatórios e Conta/Plano.

## Como funciona

- **Origem dos dados:** o arquivo "Baixar suas informações" que a própria pessoa baixa do Instagram (.zip, formato JSON). Não pede senha.
- **Privacidade:** o arquivo é lido no próprio celular e não é enviado para nenhum servidor.

## O que já existe

- **`src/zip.js`:** leitor de .zip feito no próprio navegador, com a descompressão nativa (DecompressionStream).
- **`src/instagram.js`:** lê seguidores, quem a pessoa segue e o nome de usuário, nos dois formatos que o Instagram já usou. Também corrige os acentos estragados do arquivo.
- **`src/relatorio.js`:**
  - Calcula novos seguidores, quem deixou de seguir e quem não segue de volta.
  - Aplica a regra do plano Free (1 relatório por mês).
  - Formata as datas.

## O que falta

1. A interface das 6 telas (`src/app.js` e o CSS).
2. O Worker que serve o app.
3. Os testes.
4. A publicação em `presence.senhoramorim.com.br`.

O ramo `ecossistema-amorim` deste repositório é outro projeto (o Ecossistema Amorim, já no ar) e não tem relação com este.
