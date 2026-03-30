import type { Delegation } from '@workflow/shared-types';
import { MOCK_USER } from './auth';

interface SimpleUser {
  id: string;
  name: string;
}

const MOCK_USERS: SimpleUser[] = [
  { id: MOCK_USER.id, name: MOCK_USER.name },
  { id: 'user-2', name: 'Bruno Mendes' },
  { id: 'user-3', name: 'Carla Ferreira' },
  { id: 'user-4', name: 'Diego Oliveira' },
  { id: 'user-5', name: 'Elena Santos' },
  { id: 'user-6', name: 'Felipe Costa' },
];

const delegations: Delegation[] = [
  {
    id: 'del-1',
    fromUser: { id: 'user-2', name: 'Bruno Mendes' },
    toUser: { id: 'user-3', name: 'Carla Ferreira' },
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    status: 'active',
  },
  {
    id: 'del-2',
    fromUser: { id: 'user-3', name: 'Carla Ferreira' },
    toUser: { id: 'user-1', name: 'Ana Silva' },
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    status: 'active',
  },
  {
    id: 'del-3',
    fromUser: { id: 'user-4', name: 'Diego Oliveira' },
    toUser: { id: 'user-5', name: 'Elena Santos' },
    startDate: '2026-03-10',
    endDate: '2026-05-10',
    status: 'active',
  },
];

let nextId = 4;

function findUser(id: string): SimpleUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

/**
 * Detects a delegation cycle by following the chain of active delegations.
 * Starting from toUserId, follows active delegations until it either:
 * - reaches fromUserId (cycle found) → returns the chain
 * - reaches a dead end (no cycle) → returns null
 */
function detectCycle(
  fromUserId: string,
  toUserId: string,
): SimpleUser[] | null {
  const fromUser = findUser(fromUserId);
  const toUser = findUser(toUserId);
  if (!fromUser || !toUser) return null;

  const chain: SimpleUser[] = [fromUser, toUser];
  let current = toUserId;
  const visited = new Set<string>([fromUserId, toUserId]);

  for (;;) {
    const next = delegations.find(
      (d) => d.status === 'active' && d.fromUser.id === current,
    );
    if (!next) return null;

    if (next.toUser.id === fromUserId) {
      chain.push({ id: fromUserId, name: fromUser.name });
      return chain;
    }

    if (visited.has(next.toUser.id)) return null;

    visited.add(next.toUser.id);
    chain.push({ id: next.toUser.id, name: next.toUser.name });
    current = next.toUser.id;
  }
}

export function getUsers(): SimpleUser[] {
  return MOCK_USERS;
}

export function getDelegations(): Delegation[] {
  return delegations.filter((d) => d.status === 'active');
}

export function createDelegation(
  fromUserId: string,
  toUserId: string,
  startDate: string,
  endDate: string,
): { success: true; delegation: Delegation } | { success: false; cycle: SimpleUser[] } {
  const cycle = detectCycle(fromUserId, toUserId);
  if (cycle) {
    return { success: false, cycle };
  }

  const fromUser = findUser(fromUserId);
  const toUser = findUser(toUserId);
  if (!fromUser || !toUser) {
    return { success: false, cycle: [] };
  }

  const delegation: Delegation = {
    id: `del-${nextId++}`,
    fromUser: { id: fromUser.id, name: fromUser.name },
    toUser: { id: toUser.id, name: toUser.name },
    startDate,
    endDate,
    status: 'active',
  };

  delegations.push(delegation);
  return { success: true, delegation };
}

export function cancelDelegation(id: string): boolean {
  const delegation = delegations.find((d) => d.id === id);
  if (!delegation) return false;
  delegation.status = 'cancelled';
  return true;
}
