export interface ApproverSnapshotStep {
  stepId: string;
  stepName: string;
  approvers: { id: string; name: string }[];
}

export interface ApproverSnapshot {
  steps: ApproverSnapshotStep[];
}

export interface InstanceStep {
  id: string;
  name: string;
  state: 'pending' | 'approved' | 'rejected' | 'waiting';
  approvers: { id: string; name: string; decidedAt?: string }[];
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'step_approved' | 'step_rejected' | 'delegated' | 'completed';
  actor: { id: string; name: string };
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Instance {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  requester: { id: string; name: string };
  status: 'pending' | 'approved' | 'rejected';
  steps: InstanceStep[];
  timeline: TimelineEvent[];
  snapshot: ApproverSnapshot;
  contextData: Record<string, unknown>;
  createdAt: string;
}
