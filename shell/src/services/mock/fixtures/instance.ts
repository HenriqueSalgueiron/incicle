import type {
  Instance,
  InstanceStep,
  TimelineEvent,
  ApproverSnapshot,
} from '@workflow/shared-types';
import { seededRandom, pick } from './utils';

const TITLE_PREFIXES = [
  'Solicitação de Compra',
  'Reembolso de Despesas',
  'Aprovação de Contrato',
  'Alteração Salarial',
  'Requisição de Viagem',
  'Aprovação de Orçamento',
  'Solicitação de Férias',
  'Pedido de Transferência',
  'Aprovação de Projeto',
  'Requisição de Material',
];

const TEMPLATE_NAMES = [
  'Compras e Aquisições',
  'Despesas e Reembolsos',
  'Contratos Jurídicos',
  'Gestão de Pessoas',
  'Projetos e Investimentos',
];

const STEP_NAMES = [
  'Análise Financeira',
  'Aprovação Gerencial',
  'Revisão Jurídica',
  'Validação RH',
  'Aprovação Diretoria',
  'Compliance',
  'Revisão Técnica',
  'Aprovação Final',
];

const APPROVER_NAMES = [
  'Ana Silva',
  'Carlos Oliveira',
  'Maria Santos',
  'João Pereira',
  'Fernanda Lima',
  'Ricardo Souza',
  'Patrícia Almeida',
  'Bruno Costa',
  'Camila Rodrigues',
  'André Martins',
  'Juliana Ferreira',
  'Lucas Mendes',
  'Tatiana Barbosa',
  'Rafael Nunes',
  'Daniela Carvalho',
];

const CONTEXT_KEYS = [
  'valor',
  'departamento',
  'justificativa',
  'centro_custo',
  'data_inicio',
  'prioridade',
  'observacao',
];

const CONTEXT_VALUES: Record<string, string[]> = {
  valor: ['R$ 1.500,00', 'R$ 12.300,00', 'R$ 450,00', 'R$ 87.000,00', 'R$ 3.200,00'],
  departamento: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'],
  justificativa: [
    'Necessidade operacional urgente',
    'Melhoria de infraestrutura',
    'Demanda do cliente',
    'Atualização de equipamento',
    'Requisito de compliance',
  ],
  centro_custo: ['CC-100', 'CC-200', 'CC-310', 'CC-420', 'CC-550'],
  data_inicio: ['2026-04-01', '2026-04-15', '2026-05-01', '2026-03-20', '2026-06-01'],
  prioridade: ['Alta', 'Média', 'Baixa', 'Crítica'],
  observacao: [
    'Aprovação solicitada pelo gerente de área',
    'Pendente de documentação complementar',
    'Reanálise após ajuste de valores',
  ],
};

function parseSeed(instanceId: string): number | null {
  const match = instanceId.match(/^instance-(.+)-(\d+)$/);
  if (!match) return null;
  const companyPart = match[1] ?? '';
  const index = parseInt(match[2] ?? '0', 10);
  return companyPart.charCodeAt(companyPart.length - 1) * 10000 + index;
}

function generateSteps(random: () => number, instanceId: string): InstanceStep[] {
  const stepCount = 3 + Math.floor(random() * 3);
  const isResolved = random() < 0.15;
  const isRejected = isResolved && random() < 0.3;
  const currentStepIndex = isResolved ? stepCount - 1 : Math.floor(random() * stepCount);

  const baseTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const steps: InstanceStep[] = [];

  for (let i = 0; i < stepCount; i++) {
    const approverCount = 1 + Math.floor(random() * 3);
    const approvers: InstanceStep['approvers'][number][] = [];

    for (let j = 0; j < approverCount; j++) {
      const approver: InstanceStep['approvers'][number] = {
        id: `approver-${instanceId}-${i}-${j}`,
        name: pick(APPROVER_NAMES, random),
      };

      if (i < currentStepIndex || (isResolved && i === currentStepIndex)) {
        approver.decidedAt = new Date(baseTime + (i * 24 + j * 2) * 60 * 60 * 1000).toISOString();
      }

      approvers.push(approver);
    }

    let state: InstanceStep['state'];
    if (i < currentStepIndex) {
      state = 'approved';
    } else if (i === currentStepIndex) {
      state = isResolved ? (isRejected ? 'rejected' : 'approved') : 'pending';
    } else {
      state = 'waiting';
    }

    steps.push({
      id: `step-${instanceId}-${i}`,
      name: STEP_NAMES[i % STEP_NAMES.length] ?? 'Etapa',
      state,
      approvers,
    });
  }

  return steps;
}

function generateSnapshot(steps: InstanceStep[], random: () => number): ApproverSnapshot {
  const hasDivergence = random() < 0.3;

  return {
    steps: steps.map((step) => {
      const snapshotApprovers = step.approvers.map((a) => {
        if (hasDivergence && random() < 0.25) {
          return { id: a.id, name: a.name + ' (antigo)' };
        }
        return { id: a.id, name: a.name };
      });

      if (hasDivergence && random() < 0.15) {
        snapshotApprovers.push({
          id: `removed-approver-${step.id}`,
          name: pick(APPROVER_NAMES, random),
        });
      }

      return {
        stepId: step.id,
        stepName: step.name,
        approvers: snapshotApprovers,
      };
    }),
  };
}

function generateTimeline(
  steps: InstanceStep[],
  requester: { id: string; name: string },
  random: () => number,
  createdAt: string,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let idx = 0;
  const baseTime = new Date(createdAt).getTime();
  let timeOffset = 0;

  events.push({
    id: `event-${idx++}`,
    type: 'created',
    actor: requester,
    description: 'Instância criada e submetida para aprovação',
    timestamp: createdAt,
  });

  timeOffset += 2 * 60 * 60 * 1000;

  for (const step of steps) {
    if (step.state === 'waiting') break;

    if (random() < 0.2) {
      const delegator = pick(APPROVER_NAMES, random);
      const delegatee = pick(APPROVER_NAMES, random);
      events.push({
        id: `event-${idx++}`,
        type: 'delegated',
        actor: { id: `user-del-${idx}`, name: delegator },
        description: `Delegou aprovação da etapa "${step.name}" para ${delegatee}`,
        timestamp: new Date(baseTime + timeOffset).toISOString(),
      });
      timeOffset += 30 * 60 * 1000;
    }

    if (step.state === 'approved' || step.state === 'rejected') {
      const actor = step.approvers[0] ?? { id: 'unknown', name: 'Sistema' };
      events.push({
        id: `event-${idx++}`,
        type: step.state === 'approved' ? 'step_approved' : 'step_rejected',
        actor: { id: actor.id, name: actor.name },
        description: `Etapa "${step.name}" ${step.state === 'approved' ? 'aprovada' : 'reprovada'}`,
        timestamp: new Date(baseTime + timeOffset).toISOString(),
      });
      timeOffset += 4 * 60 * 60 * 1000;
    }

    if (step.state === 'pending') break;
  }

  const allResolved = steps.every((s) => s.state === 'approved' || s.state === 'rejected');
  if (allResolved) {
    events.push({
      id: `event-${idx++}`,
      type: 'completed',
      actor: { id: 'system', name: 'Sistema' },
      description: 'Instância finalizada',
      timestamp: new Date(baseTime + timeOffset).toISOString(),
    });
  }

  // ~5% get 50+ events for virtualization testing
  if (random() < 0.05) {
    for (let i = 0; i < 50; i++) {
      timeOffset += 15 * 60 * 1000;
      events.push({
        id: `event-${idx++}`,
        type: 'delegated',
        actor: { id: `user-bulk-${i}`, name: pick(APPROVER_NAMES, random) },
        description: `Redelegação automática #${i + 1}`,
        timestamp: new Date(baseTime + timeOffset).toISOString(),
      });
    }
  }

  return events;
}

function generateContextData(random: () => number): Record<string, unknown> {
  const count = 3 + Math.floor(random() * 3);
  const data: Record<string, unknown> = {};
  const usedKeys = new Set<string>();

  for (let i = 0; i < count; i++) {
    let key = pick(CONTEXT_KEYS, random);
    while (usedKeys.has(key)) {
      key = pick(CONTEXT_KEYS, random);
    }
    usedKeys.add(key);
    const values = CONTEXT_VALUES[key];
    if (values) {
      data[key] = pick(values, random);
    }
  }

  return data;
}

const instanceCache = new Map<string, Instance>();

export function getInstance(instanceId: string): Instance | null {
  const cached = instanceCache.get(instanceId);
  if (cached) return cached;

  const seed = parseSeed(instanceId);
  if (seed === null) return null;

  const random = seededRandom(seed);
  const createdAt = new Date(Date.now() - random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  const requester = {
    id: `user-req-${Math.floor(random() * 100)}`,
    name: pick(APPROVER_NAMES, random),
  };

  const steps = generateSteps(random, instanceId);
  const snapshot = generateSnapshot(steps, random);
  const timeline = generateTimeline(steps, requester, random, createdAt);
  const contextData = generateContextData(random);

  const allResolved = steps.every((s) => s.state === 'approved' || s.state === 'rejected');
  const hasRejection = steps.some((s) => s.state === 'rejected');

  const templateIndex = Math.floor(random() * TEMPLATE_NAMES.length);
  const titlePrefix = pick(TITLE_PREFIXES, random);
  const instanceNumber = parseInt(instanceId.replace(/\D/g, '').slice(-4), 10) + 1;

  const instance: Instance = {
    id: instanceId,
    title: `${titlePrefix} #${instanceNumber}`,
    templateId: `template-${templateIndex + 1}`,
    templateName: TEMPLATE_NAMES[templateIndex] ?? 'Template',
    templateVersion: Math.floor(random() * 3) + 1,
    requester,
    status: allResolved ? (hasRejection ? 'rejected' : 'approved') : 'pending',
    steps,
    timeline,
    snapshot,
    contextData,
    createdAt,
  };

  instanceCache.set(instanceId, instance);
  return instance;
}
