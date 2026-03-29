export type InboxBroadcastMessage =
  | { type: 'ITEM_DECIDED'; itemId: string; decision: 'approved' | 'rejected' }
  | { type: 'ITEM_CONFLICT'; itemId: string; title: string; timestamp: number }
  | { type: 'ITEM_REMOVED'; itemId: string };

interface BroadcastEnvelope {
  senderId: string;
  payload: InboxBroadcastMessage;
}

export interface InboxChannel {
  post: (msg: InboxBroadcastMessage) => void;
  subscribe: (handler: (msg: InboxBroadcastMessage) => void) => void;
  close: () => void;
}

const CHANNEL_NAME = 'workflow-inbox-sync';

const noopChannel: InboxChannel = {
  post: () => {},
  subscribe: () => {},
  close: () => {},
};

export function createInboxChannel(): InboxChannel {
  if (typeof globalThis.BroadcastChannel === 'undefined') {
    return noopChannel;
  }

  const senderId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const channel = new BroadcastChannel(CHANNEL_NAME);

  return {
    post(msg) {
      const envelope: BroadcastEnvelope = { senderId, payload: msg };
      channel.postMessage(envelope);
    },

    subscribe(handler) {
      channel.onmessage = (event: MessageEvent<BroadcastEnvelope>) => {
        if (event.data.senderId === senderId) return;
        handler(event.data.payload);
      };
    },

    close() {
      channel.close();
    },
  };
}
