# Workflow de Aprovações — Desafio Técnico Frontend Pleno (InCicle)

## Visão Geral do Projeto

SPA de workflow de aprovações corporativo multiempresa, usando arquitetura microfrontend com Module Federation. O backend já existe (mockado em dev). Prazo: fim de semana. Avaliação: 100 pontos distribuídos entre arquitetura MF (25), estado/conflito (20), testes (20), performance (15), DECISIONS.md (10), acessibilidade (10).

## Estrutura do Monorepo

```
workflow-approvals/
├── shell/                    → App hospedeiro (React Router, auth, layout)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── bootstrap.tsx     → Entry point real (import dinâmico)
│   │   ├── index.ts          → Entry point do webpack/vite (importa bootstrap)
│   │   ├── components/
│   │   │   └── RemoteBoundary.tsx  → Error Boundary dedicado pro remote
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CompanyContext.tsx
│   │   └── store/
│   │       └── authStore.ts  → Zustand (auth + company_id)
│   └── vite.config.ts        → Module Federation host config
│
├── remote-workflow/          → Microfrontend exposto via Module Federation
│   ├── src/
│   │   ├── App.tsx           → Raiz do remote (recebe auth/company via props ou contexto)
│   │   ├── pages/
│   │   │   ├── ApprovalInbox.tsx      → /approvals/inbox
│   │   │   ├── InstanceDetail.tsx     → /instances/:id
│   │   │   ├── InstanceCreate.tsx     → /instances/new
│   │   │   └── Delegations.tsx        → /delegations
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   │   ├── inboxStore.ts          → Zustand: inbox com optimistic updates
│   │   │   └── delegationStore.ts
│   │   ├── services/
│   │   │   ├── api.ts                 → Cliente HTTP (axios ou fetch wrapper)
│   │   │   └── mock/                  → Estratégia de mock isolada
│   │   │       ├── handlers.ts        → MSW handlers
│   │   │       ├── fixtures/          → Dados fake (10k+ itens para inbox)
│   │   │       └── browser.ts         → MSW browser worker setup
│   │   ├── schemas/
│   │   │   └── dynamicFormSchema.ts   → Geração de schema Zod a partir de template
│   │   └── utils/
│   │       ├── sla.ts                 → Cálculo de SLA (ok/warning/breached)
│   │       └── broadcastChannel.ts    → Multi-tab sync
│   └── vite.config.ts        → Module Federation remote config
│
├── .env.example
├── README.md
├── DECISIONS.md
├── KNIP-REPORT.md
└── BUNDLE-REPORT.html
```

## Stack Obrigatória

- **React 18 com TypeScript** (strict: true, sem `any` não justificado)
- **Vite** como bundler
- **@module-federation/vite** para Module Federation (shell=host, remote-workflow=remote)
- **react-hook-form + zod** para formulário dinâmico
- **zustand** para estado global (auth, company, inbox otimista)
- **react-router-dom v6** com lazy loading por rota
- **vitest + @testing-library/react + axe-core** para testes
- **MSW (Mock Service Worker)** para mocks (isolado do código de produção)
- **knip** para análise de código morto
- **ESLint + Prettier** configurados
- **commitlint + husky** para commits semânticos
- **react-window ou @tanstack/virtual** para virtualização (inbox 10k+ itens e timeline de instância se houver muitos eventos)

## Variáveis de Ambiente

```
VITE_API_URL=
VITE_USE_MOCK=true
VITE_APP_PORT=5173
```

Quando `VITE_USE_MOCK=true`, MSW intercepta todas as chamadas. O MSW só é importado condicionalmente — não entra no bundle de produção.

## Regras Arquiteturais Invioláveis

### Module Federation

- O remote é carregado em runtime via `loadRemote()` — NUNCA via import estático.
- `react`, `react-dom`, `react-router-dom` são shared singletons com `requiredVersion`.
- O shell DEVE renderizar um Error Boundary dedicado se o remote falhar (rede, versão incompatível). O shell nunca crasha por causa do remote.
- O bundle do remote NÃO deve estar incluído no bundle inicial do shell.

### Estado e Conflito (vale 20 pontos)

- Aprovar/Reprovar usa **atualização otimista**: UI reflete imediatamente, antes da resposta do servidor.
- Se a API retorna erro, **reverter o estado** (rollback) e exibir motivo.
- Se retorna `409 Conflict` (outro aprovador já decidiu):
  1. Item conflitado sai da lista
  2. Notificação contextual explica o ocorrido
  3. Posição de scroll do usuário é mantida
  4. Estado otimista é revertido corretamente
- **Multi-tab**: BroadcastChannel sincroniza ações entre abas. Se aprovar na aba A, aba B reflete.
- **Atualização em background**: polling periódico (ex: 30s) para manter o inbox atualizado sem reload manual. Documentar trade-offs (polling vs SSE vs WebSocket) no README.

### Detalhe de Instância

- **Snapshot vs estado atual**: o snapshot (aprovadores no momento do submit) deve ser exibido com distinção visual clara do estado atual do organograma quando os dados diferirem (ex: badge "snapshot", cor diferente, tooltip explicando).
- **Timeline virtualizada** se houver muitos eventos (usar mesma lib de virtualização do inbox).
- Etapas com estado visual claro: `pending`, `approved`, `rejected`, `waiting`.

### Formulário Dinâmico (constraint explícito)

- A troca de template NÃO PODE desmontar e remontar o formulário.
- NÃO usar `key={templateId}` no form. Usar `reset()` do react-hook-form seletivamente.
- Campos preenchidos em comum entre templates devem ser preservados.
- Campos incompatíveis com o novo template devem ser limpos.
- Schema Zod é GERADO a partir da definição do template, não hardcoded.
- Isso deve ser demonstrado em um teste.
- Feedback de submissão com transição de estado visual: `pending → submitted`.

### Performance

- FCP < 1.5s
- Bundle inicial do shell < 200 kB gzip
- Virtualização do inbox sem queda de FPS com 10k itens
- Usar `rollup-plugin-visualizer` para gerar BUNDLE-REPORT.html
- **SLA countdown em tempo real**: cada item do inbox mostra o tempo restante com atualização visual contínua (usar `setInterval` ou `requestAnimationFrame`). Classificar como ok / warning / breached.

### Delegações

- CRUD completo: listar ativas, criar nova (delegado + vigência), cancelar.
- **Detecção visual de ciclo**: quando o backend retorna erro de ciclo (A→B→C→A), a UI deve representar **visualmente a cadeia** (ex: diagrama de nós, lista encadeada com setas) — NÃO apenas um toast genérico.

### Acessibilidade (vale 10 pontos)

- axe-core integrado nos testes de componente
- Zero violações críticas nos fluxos de inbox e aprovação
- Navegação por teclado funcional

### Qualidade de Código

- `strict: true` no tsconfig
- Zero `any` sem comentário justificando
- knip: zero exports não utilizados
- ESLint passando
- Commits semânticos (feat:, fix:, refactor:...) com commitlint

## Estratégia de Mock (MSW)

```typescript
// src/main.tsx ou bootstrap.tsx
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== "true") return;
  const { worker } = await import("./services/mock/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  // render app
});
```

O MSW fica em `services/mock/` e NUNCA é importado fora do bloco condicional. No build de produção, tree-shaking elimina o código.

## Endpoints da API (Mock)

```
GET    /api/approvals/inbox?company_id=X     → Lista aprovações pendentes (suportar 10k+)
POST   /api/approvals/:id/approve            → Aprovar (pode retornar 409)
POST   /api/approvals/:id/reject             → Reprovar (pode retornar 409)
GET    /api/instances/:id                     → Detalhe da instância
POST   /api/instances                         → Criar instância
GET    /api/templates?status=published        → Templates publicados
GET    /api/templates/:id/schema              → Schema de campos do template
GET    /api/delegations?company_id=X          → Delegações ativas
POST   /api/delegations                       → Criar delegação (pode retornar 400 com ciclo)
DELETE /api/delegations/:id                   → Cancelar delegação
```

## Modelo de Dados (referência para types)

```typescript
interface ApprovalItem {
  id: string;
  instanceId: string;
  title: string;
  currentStep: string;
  requester: { id: string; name: string };
  slaDeadline: string; // ISO date
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Instance {
  id: string;
  templateId: string;
  templateVersion: number;
  requester: { id: string; name: string };
  status: "pending" | "approved" | "rejected";
  steps: InstanceStep[];
  timeline: TimelineEvent[];
  snapshot: ApproverSnapshot; // Snapshot no momento do submit
  contextData: Record<string, unknown>;
  createdAt: string;
}

interface InstanceStep {
  id: string;
  name: string;
  state: "pending" | "approved" | "rejected" | "waiting";
  approvers: { id: string; name: string; decidedAt?: string }[];
}

interface TimelineEvent {
  id: string;
  type:
    | "created"
    | "step_approved"
    | "step_rejected"
    | "delegated"
    | "completed";
  actor: { id: string; name: string };
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface TemplateField {
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "email";
  label: string;
  required: boolean;
  options?: string[]; // Para select
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

interface Template {
  id: string;
  name: string;
  version: number;
  fields: TemplateField[];
}

interface Delegation {
  id: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  startDate: string;
  endDate: string;
  status: "active" | "cancelled";
}

// Resposta de erro de ciclo
interface CycleError {
  error: "DELEGATION_CYCLE";
  chain: { id: string; name: string }[]; // A→B→C→A
}
```

## Convenções de Código

- Componentes: PascalCase, um por arquivo, co-located com teste (.test.tsx)
- Hooks customizados: `use` prefix, em `hooks/`
- Stores Zustand: um arquivo por domínio em `store/`
- Imports: paths absolutos com alias `@/` apontando para `src/`
- Testes: `describe` > `it`, mensagens em inglês, usar `screen` do testing-library
- CSS: Tailwind CSS ou CSS Modules (escolher um e manter consistência)
- Não usar `export default` exceto para páginas (lazy loading) e o componente raiz exposto pelo remote

## Testes Obrigatórios

### Unitários

- Lógica de SLA: cálculo de tempo restante, classificação (ok / warning / breached).
- Geração de schema Zod a partir de definição de template.
- Lógica de detecção de conflito no estado otimista.

### Componente (com axe-core)

- `ApprovalInboxItem`: estados normal, warning SLA, breach SLA, conflito pós-otimismo.
- `DelegationForm`: criação válida, erro de ciclo do backend representado visualmente.
- `DynamicInstanceForm`: troca de template reconfigura campos sem re-montar o formulário.

### E2E / Integração (ao menos 2)

- Fluxo completo: criar instância → inbox → aprovar → timeline reflete evento.
- Atualização otimista + rollback: mock retorna 409, UI reverte e mantém scroll.
- Multi-tab: aprovação em aba A reflete no inbox da aba B.
- Remote indisponível: shell renderiza fallback sem crashar.
- Inbox com 10k itens: sem reflow visível ao scrollar.

Cada teste deve documentar **o que** prova e **por que** é o cenário certo.

## O que NÃO fazer

- NÃO usar `any` sem comentário `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [justificativa]`
- NÃO usar `key={templateId}` no formulário dinâmico
- NÃO importar MSW fora do bloco condicional de mock
- NÃO incluir o remote no bundle estático do shell
- NÃO usar localStorage para estado complexo (usar zustand)
- NÃO ignorar erros de acessibilidade do axe-core nos testes
- NÃO fazer commits sem prefixo semântico
- NÃO deixar exports não utilizados (knip vai pegar)

## Ordem de Implementação Sugerida

1. Setup do monorepo (shell + remote + Module Federation + vite configs)
2. Auth mock + zustand store + company context
3. Inbox de Aprovações (com virtualização, otimismo, rollback, 409)
4. Multi-tab sync (BroadcastChannel)
5. Detalhe de Instância (timeline virtualizada, steps, snapshot vs estado atual)
6. Criação de Instância (formulário dinâmico com react-hook-form + zod)
7. Delegações (CRUD + detecção visual de ciclo com representação da cadeia)
8. Testes (unitários, componente com axe-core, E2E/integração)
9. ESLint, knip, commitlint, bundle report
10. README.md + DECISIONS.md
