# Guardiões da Leitura

Jogo de Língua Portuguesa (Next.js 16). Os alunos correm, voam e respondem perguntas em portais. Cada fase tem a própria URL (`/fase/<endereco>`) e o próprio ranking (`/fase/<endereco>/ranking`). O ranking geral fica em `/ranking`.

## Rodar localmente

```bash
npm install
npm run dev            # http://localhost:3000
```

- Área do professor: `/professor`. Em desenvolvimento, a senha padrão é `professor`.
- Sem Redis configurado, os dados ficam em `data/db.json`.

## Variáveis de ambiente (produção)

| Variável                                | Para quê                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `TEACHER_PASSWORD`                      | senha do professor (obrigatória)                                                |
| `SESSION_SECRET`                        | segredo com 16 ou mais caracteres para assinar sessões e partidas (obrigatório) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (pela Vercel Marketplace), obrigatório na Vercel                  |

## Testes

`npm test` · `npm run test:coverage` · `npm run typecheck`

Durante o jogo, a tecla `H` mostra as hitboxes.

## Poder da leitura (tiro)

Tecla `X` ou `J` (ou o botão ✦ no celular). O balanceamento fica em `src/game/core/power.ts`:

- **Cargas:** 3 cargas (2 no difícil). Uma estrela devolve 1 carga e uma resposta certa devolve 1.
- **Disparo:** recarga de 0,8 s e alcance de cerca de 1/3 da tela. O tiro some ao bater em paredes.
- **Inimigos:** raptor e pterodáctilo aguentam 2 tiros. Espinhos, nuvens de tempestade e asteroides grandes (com veios metálicos) são imunes. A tartaruga vira casco..
