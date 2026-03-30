import { create } from 'zustand';
import type { Delegation, CycleError } from '@workflow/shared-types';
import type { Api, ApiError } from '@/services/api';

interface SimpleUser {
  id: string;
  name: string;
}

interface CreateDelegationPayload {
  toUserId: string;
  startDate: string;
  endDate: string;
}

interface DelegationState {
  delegations: Delegation[];
  users: SimpleUser[];
  loading: boolean;
  error: string | null;
  cycleError: CycleError | null;

  fetchDelegations: (api: Api, companyId: string) => Promise<void>;
  fetchUsers: (api: Api) => Promise<void>;
  createDelegation: (api: Api, companyId: string, payload: CreateDelegationPayload) => Promise<boolean>;
  cancelDelegation: (api: Api, companyId: string, delegationId: string) => Promise<void>;
  clearCycleError: () => void;
}

export const useDelegationStore = create<DelegationState>((set, get) => ({
  delegations: [],
  users: [],
  loading: false,
  error: null,
  cycleError: null,

  fetchDelegations: async (api, companyId) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ delegations: Delegation[] }>(
        `/api/delegations?company_id=${companyId}`,
      );
      set({ delegations: data.delegations, loading: false });
    } catch {
      set({ error: 'Falha ao carregar delegações', loading: false });
    }
  },

  fetchUsers: async (api) => {
    try {
      const data = await api.get<{ users: SimpleUser[] }>('/api/users');
      set({ users: data.users });
    } catch {
      // Users list is non-critical; delegation list still works
    }
  },

  createDelegation: async (api, companyId, payload) => {
    set({ error: null, cycleError: null });
    try {
      await api.post('/api/delegations', payload);
      // Re-fetch to get the updated list from server
      const { fetchDelegations } = get();
      await fetchDelegations(api, companyId);
      return true;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const body = apiErr.body as Record<string, unknown> | undefined;

      if (apiErr.status === 400 && body?.error === 'DELEGATION_CYCLE') {
        const chain = body.chain as { id: string; name: string }[];
        set({ cycleError: { error: 'DELEGATION_CYCLE', chain } });
      } else {
        set({ error: 'Erro ao criar delegação' });
      }
      return false;
    }
  },

  cancelDelegation: async (api, companyId, delegationId) => {
    set({ error: null });
    try {
      await api.del(`/api/delegations/${delegationId}`);
      // Re-fetch to get consistent state
      const { fetchDelegations } = get();
      await fetchDelegations(api, companyId);
    } catch {
      set({ error: 'Erro ao cancelar delegação' });
    }
  },

  clearCycleError: () => {
    set({ cycleError: null });
  },
}));
