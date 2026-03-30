# DECISIONS.md

## Estrategia de Testes

### Unitarios

**SLA (`sla.test.ts`)** — Prova que a classificacao ok/warning/breached respeita o threshold de 4h e que a formatacao é correta para cada caso (horas+minutos, só minutos, expirado). Cenário testado porque o SLA countdown é exibido em cada item do inbox (10k+); um bug aqui afeta toda a experiencia do usuario.

**Schema Zod dinamico (`dynamicFormSchema.test.ts`)** — Prova que `generateZodSchema` traduz cada tipo de campo (text, number, email, select, date, textarea) em validacao Zod funcional, incluindo required vs optional e regras de min/max/pattern. Cenário testado porque o schema dinâmico é peça fundamental para gerar formulários em runtime a partir de dados do backend. Além disso, nao ha type safety estática para pegar regressoes nessa camada, entao o teste é a unica forma de garantir que o schema gerado é valido e corresponde ao template (compilador não consegue verificar isso).

**Conflito otimista (`inboxStore.test.ts`)** — Prova que: (1) approve/reject atualiza UI imediatamente (otimismo), (2) 409 remove o item e cria notification (conflito), (3) erro generico reverte ao snapshot (rollback), (4) BroadcastChannel sincroniza entre abas. É o cenario certo porque a combinacao de otimismo + concorrencia multi-usuario é o ponto onde o estado pode ficar inconsistente e confundir o usuário.

### Componente (com axe-core)

**ApprovalInboxItem** — Prova renderizacao correta nos 3 estados de SLA (ok, warning, breached) e nos estados pos-decisao (approved/rejected sem botoes de acao). axe-core garante zero violacoes de acessibilidade em cada estado. E o cenario certo porque o item e o building block do inbox — se ele falha, a experiencia inteira quebra.

**DelegationForm + CycleChainDiagram** — Prova que o form valida com Zod (required, endDate >= startDate), reseta apenas no sucesso, e que o diagrama de ciclo renderiza a cadeia visual com `role="alert"` e ARIA correto. E o cenario certo porque o desafio exige representacao visual do ciclo (nao apenas toast) e acessibilidade.

**DynamicFormFields** — Prova que campos dinamicos renderizam o tipo de input correto e que troca de template preserva valores comuns sem remontar o form (sem `key={templateId}`). E o cenario certo porque e um constraint explicito do desafio — e o teste que prova que o form nao remonta.

### Integracao

**InstanceCreate (fluxo completo)** — Prova o fluxo end-to-end dentro do remote: select template → campos renderizam → preenche → submete → feedback visual. Usa MSW/node para interceptar fetch real. E o cenario certo porque cruza API client + schema Zod + form + state num unico fluxo realista.

**InboxStore (409 rollback + multi-tab)** — Prova via MSW que o mecanismo de optimistic update + rollback funciona com fetch real (nao mock). Prova que BroadcastChannel sincroniza decisoes entre stores. E o cenario certo porque valida a integracao das pecas que nos unitarios foram testadas isoladamente.
