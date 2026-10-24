# Ecossistema Amorim — ARF

A ficha de cada projeto do ecossistema Sr. Amorim e quem acessa o quê.

- **No ar:** <https://ecossistema.senhoramorim.com.br> (Worker `ecossistema-amorim`)
- **`arf.json`:** o ARF (Amorim Registry File). Nome, problema que resolve, stack, categoria, plano (free, pro ou admin), etapa, endereço e uma checklist de cinco itens.
- **`src/tree-access.js`:** a árvore de acesso. Os planos são uma escada (`pro` vê o que é `free`; `admin` vê tudo). Daqui saem também `pronto` (a percentagem da checklist cumprida, nunca escrita à mão) e `validar` (confere a coerência do ARF).
- **`src/worker.js`:** serve a página e a API.
  - `GET /`: o mapa por plano (`?plano=free|pro`).
  - `GET /api/arf`: o ARF público.
  - `GET /api/arvore?plano=`: a árvore de um plano.

O que é `admin` e os campos internos (repositório, alertas, hospedagem) nunca saem na página nem na API.

## Atualizar um projeto

1. Edite `arf.json`.
2. Rode `npm test`: o teste recusa uma ficha incoerente (por exemplo, "no ar" sem endereço).
3. Publique com `npm run deploy`.
