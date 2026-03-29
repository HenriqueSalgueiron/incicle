import type { ApprovalItem } from '@workflow/shared-types';
import { seededRandom } from './utils';

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

const REQUESTER_NAMES = [
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
];

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

function generateSlaDeadline(random: () => number): string {
  const now = Date.now();
  const roll = random();

  if (roll < 0.1) {
    // 10% breached (past deadline)
    return new Date(now - random() * 24 * 60 * 60 * 1000).toISOString();
  } else if (roll < 0.25) {
    // 15% warning (< 4 hours)
    return new Date(now + random() * 4 * 60 * 60 * 1000).toISOString();
  } else {
    // 75% ok (4h to 7 days)
    const minMs = 4 * 60 * 60 * 1000;
    const maxMs = 7 * 24 * 60 * 60 * 1000;
    return new Date(now + minMs + random() * (maxMs - minMs)).toISOString();
  }
}

// In-memory state to simulate persistence during a session
const itemStateByCompany = new Map<string, Map<string, ApprovalItem>>();
const decidedItems = new Set<string>();

function getOrCreateItems(companyId: string): Map<string, ApprovalItem> {
  const existing = itemStateByCompany.get(companyId);
  if (existing) {
    return existing;
  }

  const random = seededRandom(companyId.charCodeAt(companyId.length - 1) * 1000);
  const count = 10_000;
  const items = new Map<string, ApprovalItem>();

  for (let i = 0; i < count; i++) {
    const id = `approval-${companyId}-${i}`;
    items.set(id, {
      id,
      instanceId: `instance-${companyId}-${i}`,
      title: `${TITLE_PREFIXES[Math.floor(random() * TITLE_PREFIXES.length)] ?? 'Solicitação'} #${i + 1}`,
      currentStep: STEP_NAMES[Math.floor(random() * STEP_NAMES.length)] ?? 'Análise',
      requester: {
        id: `user-req-${Math.floor(random() * 100)}`,
        name: REQUESTER_NAMES[Math.floor(random() * REQUESTER_NAMES.length)] ?? 'Usuário',
      },
      slaDeadline: generateSlaDeadline(random),
      status: 'pending',
      createdAt: new Date(Date.now() - random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  itemStateByCompany.set(companyId, items);
  return items;
}

export function getInboxItems(companyId: string): ApprovalItem[] {
  const items = getOrCreateItems(companyId);
  return Array.from(items.values()).filter((item) => item.status === 'pending');
}

export function decideItem(
  itemId: string,
  decision: 'approved' | 'rejected',
): { success: boolean; conflict: boolean } {
  // ~5% chance of conflict (simulates another approver deciding first)
  if (Math.random() < 0.05 || decidedItems.has(itemId)) {
    decidedItems.add(itemId);
    return { success: false, conflict: true };
  }

  for (const items of itemStateByCompany.values()) {
    const item = items.get(itemId);
    if (item) {
      item.status = decision;
      decidedItems.add(itemId);
      return { success: true, conflict: false };
    }
  }

  return { success: false, conflict: false };
}
