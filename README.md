# JOVI Marketing Performance Dashboard

Projeto de dashboard estático para análise de performance de campanhas de marketing digital.

## Estrutura do projeto

- `index.html` — página principal do dashboard
- `styles.css` — estilos do layout
- `app.js` — lógica de carregamento, parsing e renderização
- `vendor/chart.umd.min.js` — biblioteca local do Chart.js
- `vendor/xlsx.full.min.js` — biblioteca local do SheetJS para leitura de Excel
- `Consolidado_jovi.xlsx` — base de dados consolidada

## Como usar

1. Abra `index.html` no navegador.
2. Clique em **Carregar base de dados**.
3. Selecione `Consolidado_jovi.xlsx` ou um arquivo `.csv`/`.xls` compatível.
4. Use os filtros de plataforma para navegar pelos dados.

## Deploy via Lovable

Este projeto é estático e não depende de backend, por isso está pronto para deploy:

- Colete todos os arquivos da pasta `Jovi_Hmtl` como raiz do site.
- Garanta que `index.html` esteja na raiz do deploy.
- As dependências estão vendorizadas em `vendor/`.

> Caso a plataforma Lovable aceite apenas arquivos estáticos, basta enviar o conteúdo da pasta `Jovi_Hmtl`.

## Requisitos mínimos

- Navegador moderno com suporte a ES6
- Arquivos Excel `.xlsx` / `.xls` ou CSV com colunas que contenham: `data`, `plataforma`, `campanha`, `impressoes`, `cliques`, `custo`, `receita`, `conversoes`
