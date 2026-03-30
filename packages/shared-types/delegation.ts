export interface Delegation {
  id: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled';
}

export interface CycleError {
  error: 'DELEGATION_CYCLE';
  chain: { id: string; name: string }[];
}
