import { create } from 'zustand';
import type { ApprovalItem } from '@workflow/shared-types';
import type { Api, ApiError } from '@/services/api';
import type { InboxChannel } from '@/utils/broadcastChannel';

let _channel: InboxChannel | null = null;

interface ConflictNotification {
  itemId: string;
  title: string;
  timestamp: number;
}

interface InboxState {
  items: ApprovalItem[];
  loading: boolean;
  error: string | null;
  conflicts: ConflictNotification[];

  fetchInbox: (api: Api, companyId: string) => Promise<void>;
  approveItem: (api: Api, itemId: string) => Promise<void>;
  rejectItem: (api: Api, itemId: string) => Promise<void>;
  removeItem: (itemId: string) => void;
  dismissConflict: (itemId: string) => void;
  setBroadcastChannel: (channel: InboxChannel | null) => void;
  applyRemoteDecision: (itemId: string, decision: 'approved' | 'rejected') => void;
  applyRemoteConflict: (itemId: string, title: string, timestamp: number) => void;
}

function decideItem(
  set: (fn: (state: InboxState) => Partial<InboxState>) => void,
  get: () => InboxState,
  api: Api,
  itemId: string,
  decision: 'approved' | 'rejected',
) {
  const { items } = get();
  const snapshot = items.find((i) => i.id === itemId);
  if (!snapshot) return;

  const endpoint = decision === 'approved' ? 'approve' : 'reject';
  const actionLabel = decision === 'approved' ? 'aprovar' : 'reprovar';

  // Optimistic update
  set(() => ({
    items: items.map((i) => (i.id === itemId ? { ...i, status: decision } : i)),
  }));

  api
    .post(`/api/approvals/${itemId}/${endpoint}`)
    .then(() => {
      _channel?.post({ type: 'ITEM_DECIDED', itemId, decision });
    })
    .catch((err: unknown) => {
      const status = err instanceof Error && 'status' in err ? (err as ApiError).status : 0;
      if (status === 409) {
        const timestamp = Date.now();
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
          conflicts: [...state.conflicts, { itemId, title: snapshot.title, timestamp }],
        }));
        _channel?.post({ type: 'ITEM_CONFLICT', itemId, title: snapshot.title, timestamp });
      } else {
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? snapshot : i)),
          error: `Erro ao ${actionLabel} "${snapshot.title}"`,
        }));
      }
    });
}

export const useInboxStore = create<InboxState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  conflicts: [],

  fetchInbox: async (api, companyId) => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ items: ApprovalItem[] }>(
        `/api/approvals/inbox?company_id=${companyId}`,
      );
      set({ items: data.items, loading: false });
    } catch {
      set({ error: 'Falha ao carregar inbox', loading: false });
    }
  },

  approveItem: async (api, itemId) => {
    decideItem(set, get, api, itemId, 'approved');
  },

  rejectItem: async (api, itemId) => {
    decideItem(set, get, api, itemId, 'rejected');
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },

  dismissConflict: (itemId) => {
    set((state) => ({
      conflicts: state.conflicts.filter((c) => c.itemId !== itemId),
    }));
  },

  setBroadcastChannel: (channel) => {
    _channel = channel;
  },

  applyRemoteDecision: (itemId, decision) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, status: decision } : i)),
    }));
  },

  applyRemoteConflict: (itemId, title, timestamp) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
      conflicts: [...state.conflicts, { itemId, title, timestamp }],
    }));
  },
}));
