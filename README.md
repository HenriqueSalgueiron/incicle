# Workflow de Aprovacoes

SPA de workflow de aprovacoes corporativo multiempresa com arquitetura microfrontend (Module Federation).

## Setup Local

```bash
# 1. Clonar e instalar
git clone https://github.com/HenriqueSalgueiron/incicle.git
cd incicle
cp .env.example .env
npm install

# 2. Rodar em modo dev (mock ativo por padrao)
npm run dev
```

Isso inicia o shell (porta 5173) e o remote (porta 5174) simultaneamente. O MSW intercepta todas as chamadas de API automaticamente.

**Requisitos**: Node >= 22, npm >= 10.

## Variaveis de Ambiente

| Variavel        | Descricao                           | Default |
| --------------- | ----------------------------------- | ------- |
| `VITE_API_URL`  | URL base da API (vazio = relativo)  | `""`    |
| `VITE_USE_MOCK` | Ativa MSW para interceptar requests | `true`  |
| `VITE_APP_PORT` | Porta do shell                      | `5173`  |

## Arquitetura

```
shell/               -> Host (auth, layout, router, MSW)
remote-workflow/     -> Microfrontend (inbox, instancias, delegacoes)
packages/shared-types/ -> Tipos compartilhados (workspace npm)
```

O shell carrega o remote em **runtime** via `loadRemote()` do Module Federation. Se o remote estiver indisponivel, o `RemoteBoundary` renderiza fallback sem crashar o shell.

### Shared Dependencies (Singletons)

| Lib                | Por que singleton                                                                                    | Risco sem singleton                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `react`            | Hooks dependem de uma unica instancia interna. Dois Reacts = "Invalid hook call"                     | Em produção, duas copias coexistem e hooks quebram                                       |
| `react-dom`        | Acoplado ao React — precisa da mesma instancia para reconciliacao                                    | Mesma situacao do React — versoes divergentes causam re-render inconsistente             |
| `react-router-dom` | Contexto de roteamento compartilhado entre shell e remote                                            | Remote nao consegue ler/navegar rotas do shell                                           |
| `zustand`          | Embora cada store seja independente, garantir singleton evita divergencia de versao em internal APIs | Stores do remote podem nao se comportar como esperado se internals mudarem entre versoes |

## Estrategia de Mock

O MSW (Mock Service Worker) e configurado **exclusivamente no shell** (`shell/src/services/mock/`). O import e condicional:

```typescript
// enableMocking.ts
if (import.meta.env.VITE_USE_MOCK !== 'true') return;
const { worker } = await import('./browser');
return worker.start({ onUnhandledRequest: 'bypass' });
```

**Como fica isolado do codigo de producao:**

- O import e dinamico (`await import()`) dentro de um guard de env var
- Tree-shaking do Vite elimina o codigo no build de producao
- Nenhum componente, hook ou store importa MSW — eles fazem `fetch()` real
- O Service Worker intercepta no nivel de rede, transparente para a aplicacao

O MSW gera 10.000+ itens no inbox (com seed por company para consistencia) e simula latencia de rede com `delay()`.

## Concorrencia e Conflito (409)

> Cenario: usuario esta no inbox ha 45s. Clica "Aprovar" no step X. Servidor retorna 409 porque outro aprovador ja decidiu.

**O que acontece com o estado otimista:**
O item muda imediatamente para `approved` (otimismo). Quando o 409 chega, o item e **removido** da lista (nao volta a `pending`, porque ja foi decidido por outro). O snapshot capturado antes do set garante que o rollback e previsivel.

**Como o usuario entende o que ocorreu:**
Uma notificacao contextual amarela aparece acima da lista com `role="alert"`: _"Conflito: 'Ferias Joao' ja foi decidido por outro aprovador."_ O usuario pode dispensar a notificacao.

**Como o inbox se recupera sem full reload:**
O item sai da lista via `filter()` no store. O `@tanstack/react-virtual` recalcula posicoes automaticamente sem resetar o `scrollTop` do container — a posicao de scroll e preservada. O polling a cada 30s traz o estado atualizado do servidor como safety net.

## Multi-tab

Implementado via **BroadcastChannel API nativa** (`remote-workflow/src/utils/broadcastChannel.ts`).

Cada aba gera um `senderId` unico. Ao aprovar/reprovar, a aba envia mensagem tipada (`ITEM_DECIDED`, `ITEM_CONFLICT`, `ITEM_REMOVED`). Outras abas recebem e atualizam o store local. A aba que enviou ignora suas proprias mensagens via check de `senderId`.

Fallback: se o browser nao suporta BroadcastChannel, retorna `noopChannel` (operacoes viram no-ops).

### Trade-offs: Polling vs SSE vs WebSocket

| Estrategia              | Pro                                        | Contra                                             | Quando usar                                        |
| ----------------------- | ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------- |
| **Polling (escolhido)** | Simples, funciona com MSW, sem infra extra | Atraso de ate 30s, requests desnecessarias         | Inbox corporativo com baixa frequencia de mudancas |
| SSE                     | Push real, unidirecional, reconexao nativa | MSW nao suporta, precisa de servidor               | Dashboards com atualizacoes frequentes             |
| WebSocket               | Bidirecional, baixa latencia               | Complexidade de servidor, gerenciamento de conexao | Chat, colaboracao em tempo real                    |

O polling a cada 30s e suficiente para o caso de uso (aprovacoes corporativas, nao chat). O BroadcastChannel complementa para sincronizacao entre abas do mesmo usuario sem depender do servidor.

## Performance

### Metricas Medidas

| Metrica                            | Meta                  | Valor Real                                                                                     |
| ---------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| FCP (First Contentful Paint)       | < 1.5s                | 0.5 s                                                                                          |
| Bundle inicial do shell (gzip)     | < 200 kB              | 166.54 kB                                                                                      |
| Bundle do remote                   | Nao incluido no shell | Confirmado: remote carrega via `loadRemote()` em runtime + BUNDLE-REPORT.html                  |
| Virtualizacao do inbox (10k itens) | Sem queda de FPS      | FPS constante, observado em gráfico de performance em devtools e com overlay de métrica de fps |

O `BUNDLE-REPORT-shell.html` gerado pelo `rollup-plugin-visualizer` detalha a composicao do bundle.

### Como medir FCP

1. Gere o build de producao:

```bash
npm run build
```

2. Inicie o remote em preview:

```bash
cd remote-workflow && npx vite preview --port 5174
```

3. Em outro terminal, inicie o shell em preview:

```bash
cd shell && npx vite preview --port 5173
```

4. Abra `http://localhost:5173` no Chrome.
5. Abra DevTools (F12) > Lighthouse > marque `Performance` > modo `Navigation` > clique em `Analyze page load`.
6. No resultado, anote o valor de FCP.

### Como medir Bundle Size

1. Marcar a env VITE_USE_MOCK=false para simular resultado de producao (removendo MSW do bundle).
2. Gerar o build de producao:

```bash
npm run build
```

3. Abrir `BUNDLE-REPORT.html` no navegador.
4. Analisar a composicao do bundle, focando no tamanho do shell e confirmando que o remote nao esta incluido. O plugin `rollup-plugin-visualizer` mostra o impacto de cada dependencia.

### Como acompanhar FPS com virtualizacao

1. Inicie o app em modo dev:

```bash
npm run dev
```

2. Abra `http://localhost:5173` no Chrome.
3. Abra DevTools (F12) > Performance.
4. Clique em `Record` e interaja com o inbox (scroll, hover, click).
5. Pare a gravacao e analise o grafico de FPS
6. Para overlay de FPS, Cmd+Shift+P no devtools e seleciona `Show FPS meter`.

### Estrategias de Performance

- **Virtualizacao**: `@tanstack/react-virtual` no inbox (10k+ itens) e timeline. `estimateSize: 72px`, `overscan: 10`, container com `contain: strict`.
- **Lazy loading**: remote carregado via `React.lazy` + `loadRemote()`. Rotas do remote usam lazy imports.
- **SLA countdown**: `setInterval` de 1s por item visivel, com `aria-live="polite"` para acessibilidade.
- **Polling eficiente**: 30s de intervalo, limpo no unmount via `clearInterval`.

## Scripts

| Comando               | Descricao                                         |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Inicia shell + remote em modo dev                 |
| `npm run build`       | Build de producao (remote primeiro, depois shell) |
| `npm run lint`        | ESLint em ambos os projetos                       |
| `npm run format`      | Prettier em ambos os projetos                     |
| `npm run test`        | Testes em todos os workspaces                     |
| `npm run knip`        | Analise de codigo morto                           |
| `npm run knip:report` | Gera KNIP-REPORT.md                               |

## Entregaveis

- `DECISIONS.md` — Decisoes arquiteturais com alternativas descartadas
- `KNIP-REPORT.md` — Relatorio de codigo morto (zero exports nao utilizados)
- `BUNDLE-REPORT-shell.html` — Visualizacao do bundle do shell
- `.env.example` — Variaveis de ambiente

## O que implementaria com mais tempo

- **Testes E2E com Playwright**: fluxo completo cross-browser, incluindo cenario de remote offline e multi-tab real (nao apenas BroadcastChannel isolado).
- **SSE para atualizacao em tempo real**: substituir polling por Server-Sent Events quando o backend real estiver disponivel, mantendo polling como fallback.
- **Onboarding com react-joyride**: tour guiado no primeiro acesso ao inbox, explicando acoes de aprovacao e SLA.
- **Theming**: design system com tokens de cor/espacamento, suportando dark mode.
- **Monitoramento**: integrar Sentry para captura de erros em producao, especialmente falhas de carregamento do remote.
- **React Query (@tanstack/react-query)**: substituir o polling manual e o gerenciamento de loading/error nos stores por React Query, que ja oferece cache, stale-while-revalidate, retry, polling (`refetchInterval`), e deduplicacao de requests. Reduziria codigo boilerplate nos stores e daria invalidacao de cache automatica apos mutacoes (approve/reject).
- **Axios**: substituir o fetch wrapper manual (`api.ts`) por Axios, que oferece interceptors (util pra injetar token e tratar erros globalmente), timeout configuravel, e cancelamento de requests mais ergonomico que AbortController.
- **Tailwind CSS**: substituir os estilos inline por classes utilitarias. Estilos inline dificultam responsividade, pseudo-classes (hover, focus) e consistencia visual. Tailwind resolveria isso com design tokens padronizados e bundle CSS otimizado.
