import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInboxStore } from './inboxStore';
import { createMockApi, createMockApprovalItem, flushPromises } from '@/test/helpers';
import type { ApiError } from '@/services/api';

function createApiError(status: number): ApiError {
  const error = new Error('Request failed') as ApiError;
  error.status = status;
  return error;
}

describe('inboxStore', () => {
  const mockChannel = { post: vi.fn(), subscribe: vi.fn(), close: vi.fn() };

  beforeEach(() => {
    // reset store state before each test
    useInboxStore.setState({
      items: [createMockApprovalItem(), createMockApprovalItem({ id: 'item-2', title: 'Item 2' })],
      conflicts: [],
      loading: false,
      error: null,
    });
    // set mock BroadcastChannel
    useInboxStore.getState().setBroadcastChannel(mockChannel);
    // clear mock calls history
    mockChannel.post.mockClear();
  });

  describe('fetchInbox', () => {
    it('populates items on success', async () => {
      const api = createMockApi();
      const items = [createMockApprovalItem({ id: 'fetched-1' })];
      api.get.mockResolvedValueOnce({ items });

      await useInboxStore.getState().fetchInbox(api, 'company-1');

      expect(useInboxStore.getState().items).toEqual(items);
      expect(useInboxStore.getState().loading).toBe(false);
    });
  });

  describe('approveItem — optimistic update', () => {
    it('changes item status immediately before API resolves', () => {
      const api = createMockApi();
      api.post.mockReturnValue(new Promise(() => {})); // never resolves

      useInboxStore.getState().approveItem(api, 'item-1');

      const item = useInboxStore.getState().items.find((i) => i.id === 'item-1');
      expect(item?.status).toBe('approved');
    });
  });

  describe('approveItem — success broadcasts', () => {
    it('broadcasts ITEM_DECIDED on success', async () => {
      const api = createMockApi();
      api.post.mockResolvedValueOnce({ success: true });

      useInboxStore.getState().approveItem(api, 'item-1');
      await flushPromises();

      expect(mockChannel.post).toHaveBeenCalledWith({
        type: 'ITEM_DECIDED',
        itemId: 'item-1',
        decision: 'approved',
      });
    });
  });

  describe('approveItem — 409 conflict', () => {
    it('removes item and adds conflict notification', async () => {
      const api = createMockApi();
      api.post.mockRejectedValueOnce(createApiError(409));

      useInboxStore.getState().approveItem(api, 'item-1');
      await flushPromises();

      const state = useInboxStore.getState();
      expect(state.items.find((i) => i.id === 'item-1')).toBeUndefined();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0]?.itemId).toBe('item-1');
      expect(state.conflicts[0]?.title).toBe('Solicitacao de Compra #42');
    });

    it('broadcasts ITEM_CONFLICT', async () => {
      const api = createMockApi();
      api.post.mockRejectedValueOnce(createApiError(409));

      useInboxStore.getState().approveItem(api, 'item-1');
      await flushPromises();

      expect(mockChannel.post).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ITEM_CONFLICT', itemId: 'item-1' }),
      );
    });
  });

  describe('rejectItem — 409 conflict', () => {
    it('removes item and adds conflict notification (symmetric to approve)', async () => {
      const api = createMockApi();
      api.post.mockRejectedValueOnce(createApiError(409));

      useInboxStore.getState().rejectItem(api, 'item-1');
      await flushPromises();

      const state = useInboxStore.getState();
      expect(state.items.find((i) => i.id === 'item-1')).toBeUndefined();
      expect(state.conflicts).toHaveLength(1);
    });
  });

  describe('approveItem — generic error rollback', () => {
    it('reverts item to pending and sets error message', async () => {
      const api = createMockApi();
      api.post.mockRejectedValueOnce(createApiError(500));

      useInboxStore.getState().approveItem(api, 'item-1');
      await flushPromises();

      const state = useInboxStore.getState();
      const item = state.items.find((i) => i.id === 'item-1');
      expect(item?.status).toBe('pending');
      expect(state.error).toContain('aprovar');
    });
  });

  describe('applyRemoteDecision', () => {
    it('updates item status from remote tab', () => {
      useInboxStore.getState().applyRemoteDecision('item-1', 'approved');

      const item = useInboxStore.getState().items.find((i) => i.id === 'item-1');
      expect(item?.status).toBe('approved');
    });
  });

  describe('applyRemoteConflict', () => {
    it('removes item and adds conflict from remote tab', () => {
      const timestamp = Date.now();
      useInboxStore.getState().applyRemoteConflict('item-1', 'Test Title', timestamp);

      const state = useInboxStore.getState();
      expect(state.items.find((i) => i.id === 'item-1')).toBeUndefined();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0]?.title).toBe('Test Title');
    });
  });

  describe('dismissConflict', () => {
    it('removes conflict by itemId', () => {
      useInboxStore.setState({
        conflicts: [{ itemId: 'item-1', title: 'Test', timestamp: Date.now() }],
      });

      useInboxStore.getState().dismissConflict('item-1');

      expect(useInboxStore.getState().conflicts).toHaveLength(0);
    });
  });
});
