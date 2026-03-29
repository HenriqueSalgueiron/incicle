import { useEffect } from 'react';
import { createInboxChannel } from '@/utils/broadcastChannel';
import { useInboxStore } from '@/store/inboxStore';

export function useInboxSync() {
  useEffect(() => {
    const channel = createInboxChannel();
    const { setBroadcastChannel } = useInboxStore.getState();

    setBroadcastChannel(channel);

    channel.subscribe((msg) => {
      const store = useInboxStore.getState();
      switch (msg.type) {
        case 'ITEM_DECIDED':
          store.applyRemoteDecision(msg.itemId, msg.decision);
          break;
        case 'ITEM_CONFLICT':
          store.applyRemoteConflict(msg.itemId, msg.title, msg.timestamp);
          break;
        case 'ITEM_REMOVED':
          store.removeItem(msg.itemId);
          break;
      }
    });

    return () => {
      channel.close();
      useInboxStore.getState().setBroadcastChannel(null);
    };
  }, []);
}
