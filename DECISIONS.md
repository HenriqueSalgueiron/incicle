# DECISIONS.md

Documento de decisoes arquiteturais. Cada item inclui a alternativa descartada, o motivo do descarte neste projeto, e quando a alternativa seria a escolha certa.

---

## Module Federation

### O que acontece se o remote carrega com uma versao de `react` diferente da `requiredVersion` do shell?

Passo a passo com base na configuracao real (`shell/vite.config.ts` e `remote-workflow/vite.config.ts`):

1. O shell inicia e registra `react@^18.0.0` como shared singleton no scope `default`.
2. O remote e carregado via `loadRemote('remote_workflow/App')` em `RemoteLoader.tsx`.
3. O Module Federation runtime avalia o `requiredVersion` do remote contra a versao real disponibilizada pelo shell.
4. **Se a versao do shell satisfaz o range do remote** (ex: shell tem 18.3.1, remote pede `^18.0.0`): compartilha normalmente, ambos usam a mesma instancia. Nenhum problema.
5. **Se as versoes declaradas sao incompativeis** (ex: remote declara `requiredVersion: '^19.0.0'`, shell declara `requiredVersion: '^18.0.0'`): como `singleton: true`, o MF **emite um warning no console** ("[ Federation Runtime ] Version 19.0.0 from remote_workflow of shared singleton module react does not satisfy the requirement of shell which needs ^18.0.0") mas **ainda compartilha a instancia unica do shell**. O React carregado continua sendo o 18.x do shell. Se a API do React mudou entre versoes e o remote depende de APIs do 19, ele pode quebrar em runtime (hooks incompativeis, APIs removidas), e o `RemoteBoundary` captura o erro.
6. **Se alguem remover `singleton: true` do remote**: em teoria, o MF carregaria uma segunda copia do React, causando "Invalid hook call" (dois Reacts na pagina). Na pratica, testei localmente com `singleton: false` (/remote-workflow/vite.config.ts) e a app **continuou funcionando** — porque em dev local, shell e remote compartilham o mesmo `node_modules` e a mesma versao real do React (18.x), entao o MF detecta que a versao ja disponivel satisfaz e nao carrega uma segunda copia. O cenario destrutivo acontece em **producao com deploys independentes**, onde o remote e buildado num CI separado com React 19 no `package.json` e o shell tem React 18 — ai sim, sem `singleton: true`, duas copias coexistiriam e hooks quebrariam. O `singleton: true` e a protecao contra esse cenario.

O `RemoteBoundary` (`shell/src/components/RemoteBoundary.tsx`) garante que qualquer erro — rede, versao incompativel, ou modulo indisponivel — mostra fallback, botao de retry e faz console.error(...) com o erro emitido, sem crashar o shell.

### Se precisasse adicionar um segundo remote, o que mudaria?

Mudancas pontuais na configuracao atual:

1. **`shell/vite.config.ts`**: adicionar nova entrada no objeto `remotes`:
   ```typescript
   remotes: {
     remote_workflow: { ... },       // existente
     remote_reports: {               // novo
       type: 'module',
       name: 'remote_reports',
       entry: 'http://localhost:5175/remoteEntry.js',
       entryGlobalName: 'remote_reports',
       shareScope: 'default',
     },
   },
   ```
2. **`RemoteLoader.tsx`**: novo `React.lazy` + `loadRemote('remote_reports/App')` e rota adicional.
3. **Shared deps**: o novo remote precisa declarar o mesmo bloco `shared` com `singleton: true` e `requiredVersion` compativeis. Como o `shareScope` e `'default'`, todas as shared deps sao resolvidas no mesmo pool.
4. **`RemoteBoundary`**: reutilizavel — basta wrappear o novo remote com a mesma instancia.

Nenhuma mudanca estrutural. A arquitetura ja suporta N remotes — o custo e configuracao, nao refatoracao.

---

## Estado e Conflito

### Estado exato do store durante um approve que retorna 409

Estrutura do store (`remote-workflow/src/store/inboxStore.ts`):

```typescript
{
  items: ApprovalItem[],       // lista do inbox
  loading: boolean,
  error: string | null,
  conflicts: ConflictNotification[]  // { itemId, title, timestamp }
}
```

**Antes da requisicao** (usuario clica "Aprovar" no item `id: "abc"`):

```
items: [..., { id: "abc", status: "pending", title: "Ferias João" }, ...]
conflicts: []
error: null
```

**Durante — atualizacao otimista aplicada imediatamente** (antes do fetch resolver):

```
items: [..., { id: "abc", status: "approved", title: "Ferias João" }, ...]
conflicts: []
error: null
```

O item muda de `pending` para `approved` na UI antes da resposta. O `snapshot` do item original e capturado via `const snapshot = items.find(i => i.id === itemId)` antes do `set()`.

**Apos o 409 — rollback + notificacao**:

```
items: [...]  // item "abc" REMOVIDO completamente (filter)
conflicts: [{ itemId: "abc", title: "Ferias João", timestamp: 1711814400000 }]
error: null
```

O item nao volta a `pending` — ele sai da lista porque outro aprovador ja decidiu (nao faz sentido manter). A notificacao contextual (amarela, com `role="alert"`) explica: "Conflito: 'Ferias João' ja foi decidido por outro aprovador." O scroll e preservado porque a lista virtualizada (`@tanstack/react-virtual`) recalcula posicoes automaticamente sem resetar o `scrollTop` do container.

Em caso de **erro generico** (ex: 500), o comportamento e diferente: o item **volta ao snapshot** (`status: "pending"`) e `error` recebe a mensagem. O item nao sai da lista.

**Alternativa descartada**: usar uma flag `optimisticStatus` separada do `status` real (two-field approach). Descartado porque adiciona complexidade sem ganho. o store ja tem o snapshot capturado antes do set, e o rollback e simples. A two-field approach seria melhor num cenario com undo/redo onde o usuario precisa ver ambos os estados simultaneamente.

### Multi-tab: por que BroadcastChannel e nao outras opcoes?

**Escolha: BroadcastChannel API nativa** (`remote-workflow/src/utils/broadcastChannel.ts`).

Cada aba gera um `senderId` unico (via `crypto.randomUUID()`). Mensagens carregam esse ID num envelope, e a aba que enviou ignora suas proprias mensagens (`if (event.data.senderId === senderId) return`). Tres tipos de mensagem: `ITEM_DECIDED`, `ITEM_CONFLICT`, `ITEM_REMOVED`.

**Por que nao `localStorage` events**: o evento `storage` so dispara em **outras** abas (nao na que escreveu), o que e util mas tem limitacoes: o payload e serializado como string, nao ha tipagem nativa (BroadcastChannel transmite objetos javascript, da pra tipar), e conflitos de escrita concorrente (duas abas escrevendo no mesmo key) podem causar perda de mensagem. BroadcastChannel e projetado exatamente para comunicacao entre abas, com API de mensagem tipada e sem side-effects de persistencia.

**Quando `localStorage` seria superior**: em browsers antigos que nao suportam BroadcastChannel (IE, Safari < 15.4). Ainda assim é seguro implementar BroadcastChannel — o codigo tem fallback graceful — se `BroadcastChannel` nao existe, retorna `noopChannel` (operacoes viram no-ops, sem crash).

**Por que nao WebSocket (via SharedWorker) ou SSE**: o problema que estamos resolvendo e sincronizar **abas do mesmo usuario** no mesmo browser. WebSocket/SSE resolvem um problema diferente: sincronizar com o **servidor** (e entre usuarios diferentes). Usar WebSocket pra multi-tab exigiria um SharedWorker como hub entre as abas — complexidade maior para o mesmo resultado. BroadcastChannel foi projetado exatamente pra comunicacao entre abas: API simples, sem servidor, sem worker intermediario.

**Quando WebSocket/SharedWorker seria superior**: se precisassemos resolver multi-tab e sincronizacao com o servidor numa unica infraestrutura. Ex: dois aprovadores diferentes vendo o mesmo inbox em tempo real — ai o SharedWorker manteria uma conexao WebSocket com o backend e repassaria updates pra todas as abas. No nosso caso, o polling de 30s ja resolve a sincronizacao com o servidor, e o BroadcastChannel resolve o multi-tab. Duas solucoes simples em vez de uma complexa.

---

## Formulario Dinamico

### Como a troca de template nao remonta o formulario

O formulario e criado **uma unica vez** no `InstanceCreate.tsx` com `useForm()` e nunca recebe `key={templateId}`. A estrategia:

1. **`schemaRef`** (useRef): armazena o schema Zod atual. Atualizar um ref nao causa re-render nem remontagem.
2. **`dynamicResolver`**: funcao `useCallback` que sempre valida contra `schemaRef.current`. Como e uma referencia estavel (memoizada), o `useForm` nao e recriado.
3. **Troca de template**: quando o usuario muda o select:
   - Busca o schema do novo template (com `AbortController` para cancelar fetch anterior)
   - Captura `form.getValues()` (valores atuais)
   - Filtra apenas campos que existem no novo template (`newFieldNames`)
   - Atualiza `schemaRef.current = generateZodSchema(template.fields)`
   - Chama `form.reset(preserved)` — limpa campos incompativeis, preserva comuns

**Sintoma se usasse `key={templateId}`**: cada troca de template destruiria e recriaria a arvore React inteira do `<form>` (remonta). O usuario veria: (1) campos preenchidos sumindo mesmo que existam no novo template, (2) foco do input perdido, (3) animacoes de mount re-executando, (4) flash visual perceptivel. Com a abordagem atual, o formulario persiste no DOM e apenas os valores sao ajustados via `form.reset()` (faz apenas rerender persistindo refs e estado, sem remontar).

---

## Virtualizacao

**Escolha: `@tanstack/react-virtual`** para inbox (10k+ itens) e timeline de instancia.

Configuracao no inbox (`ApprovalInbox.tsx`): `estimateSize: () => 72`, `overscan: 10`, container com `contain: strict`. Cada item e posicionado via `transform: translateY()` (evita reflow) com `position: absolute`.

O container tem a altura total da lista (ex: 720.000px
pra 10k itens), criando a scrollbar real, mas só ~15 divs existem no DOM. Cada
div usa position: absolute (pra não empurrar as outras) e transform:
translateY(virtualRow.start) (pra se posicionar no lugar certo usando GPU, sem
causar recálculo de layout). Conforme o usuário scrolla, o virtualizer
recalcula quais itens mostrar e suas posições, e o React atualiza só essas ~15
divs. O resultado: mesmo com 10.000 itens, o FPS permanece alto e o scroll é suave, porque o DOM nunca tem mais do que ~15 elementos renderizados.

**Alternativa descartada**: `react-window`. Descartado porque `@tanstack/react-virtual` e headless (nao impoe estrutura de DOM), o que facilita estilizacao e acessibilidade (`role="list"`, `aria-label` no container). `react-window` seria melhor num cenario onde voce quer componentes prontos com menos configuracao (ex: prototipo rapido).

---

## Mock (MSW)

**Escolha: MSW com Service Worker no browser** (`shell/src/services/mock/`).

O MSW intercepta no nivel de rede — o codigo de producao (`api.ts`, stores, componentes) faz `fetch()` real e nao sabe que esta sendo mockado. Isolamento total: o import e condicional (`if (VITE_USE_MOCK !== 'true') return`), e tree-shaking remove o codigo no build de producao.

**Alternativa descartada**: adapters/fixtures inline nos services (ex: `if (mock) return fakeData`). Descartado porque contamina o codigo de producao com branches de teste, dificulta remocao futura, e nao testa o path real de rede (headers, serialization, error codes). MSW e a escolha certa porque: (1) isola completamente o mock do codigo de producao, (2) permite testar o comportamento real de fetch, incluindo latencia e erros, (3) e facilmente desativavel para producao, (4) tem API poderosa para definir handlers dinâmicos e gerar dados realistas.

---

## Polling vs SSE vs WebSocket

**Escolha: polling a cada 30s** (`POLLING_INTERVAL = 30_000` em `ApprovalInbox.tsx`).

**Por que**: simplicidade e adequado para o cenario. Um inbox de aprovacoes corporativo nao exige tempo real — atualizacoes a cada 30s sao suficientes. O overhead de uma request GET a cada 30s e negligivel, e a implementacao e trivial (`setInterval` + `clearInterval` no unmount).

**Alternativa descartada**: SSE (Server-Sent Events). Descartado porque a complexidade adicional (manter conexao HTTP aberta, gerenciar reconexao, lidar com timeouts de proxy) nao se justifica para o volume de atualizacoes esperado num inbox de aprovacoes. SSE seria a escolha certa num cenario com atualizacoes frequentes e onde o delay do polling fosse inaceitavel (ex: dashboard de metricas em tempo real, feed de notificacoes).

---

## Estrategia de Testes

### Unitarios

**SLA (`sla.test.ts`)** — Prova que a classificacao ok/warning/breached respeita o threshold de 4h e que a formatacao e correta para cada caso (horas+minutos, so minutos, expirado). Cenario testado porque o SLA countdown e exibido em cada item do inbox (10k+); um bug aqui afeta toda a experiencia do usuario.

**Schema Zod dinamico (`dynamicFormSchema.test.ts`)** — Prova que `generateZodSchema` traduz cada tipo de campo (text, number, email, select, date, textarea) em validacao Zod funcional, incluindo required vs optional e regras de min/max/pattern. Cenario testado porque o schema dinamico e peca fundamental para gerar formularios em runtime a partir de dados do backend. Alem disso, nao ha type safety estatica para pegar regressoes nessa camada, entao o teste e a unica forma de garantir que o schema gerado e valido e corresponde ao template (compilador nao consegue verificar isso).

**Conflito otimista (`inboxStore.test.ts`)** — Prova que: (1) approve/reject atualiza UI imediatamente (otimismo), (2) 409 remove o item e cria notification (conflito), (3) erro generico reverte ao snapshot (rollback), (4) BroadcastChannel sincroniza entre abas. E o cenario certo porque a combinacao de otimismo + concorrencia multi-usuario e o ponto onde o estado pode ficar inconsistente e confundir o usuario.

### Componente (com axe-core)

**ApprovalInboxItem** — Prova renderizacao correta nos 3 estados de SLA (ok, warning, breached) e nos estados pos-decisao (approved/rejected sem botoes de acao). axe-core garante zero violacoes de acessibilidade em cada estado. E o cenario certo porque o item e o building block do inbox — se ele falha, a experiencia inteira quebra.

**DelegationForm + CycleChainDiagram** — Prova que o form valida com Zod (required, endDate >= startDate), reseta apenas no sucesso, e que o diagrama de ciclo renderiza a cadeia visual com `role="alert"` e ARIA correto. E o cenario certo porque o desafio exige representacao visual do ciclo (nao apenas toast) e acessibilidade.

**DynamicFormFields** — Prova que campos dinamicos renderizam o tipo de input correto e que troca de template preserva valores comuns sem remontar o form (sem `key={templateId}`). E o cenario certo porque e um constraint explicito do desafio — e o teste que prova que o form nao remonta.

### Integracao

**InstanceCreate (fluxo completo)** — Prova o fluxo end-to-end dentro do remote: select template -> campos renderizam -> preenche -> submete -> feedback visual. Usa MSW/node para interceptar fetch real. E o cenario certo porque cruza API client + schema Zod + form + state num unico fluxo realista.

**InboxStore (409 rollback + multi-tab)** — Prova via MSW que o mecanismo de optimistic update + rollback funciona com fetch real (nao mock). Prova que BroadcastChannel sincroniza decisoes entre stores. E o cenario certo porque valida a integracao das pecas que nos unitarios foram testadas isoladamente.
