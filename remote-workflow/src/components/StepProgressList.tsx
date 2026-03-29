import type { InstanceStep, ApproverSnapshot, ApproverSnapshotStep } from '@workflow/shared-types';

interface StepProgressListProps {
  steps: InstanceStep[];
  snapshot: ApproverSnapshot;
}

const STATE_CONFIG: Record<InstanceStep['state'], { bg: string; color: string; icon: string; label: string }> = {
  approved: { bg: '#dcfce7', color: '#166534', icon: '✓', label: 'Aprovado' },
  rejected: { bg: '#fee2e2', color: '#991b1b', icon: '✗', label: 'Reprovado' },
  pending: { bg: '#fef3c7', color: '#92400e', icon: '○', label: 'Pendente' },
  waiting: { bg: '#f3f4f6', color: '#6b7280', icon: '—', label: 'Aguardando' },
};

interface SnapshotDiff {
  hasDifferences: boolean;
  removed: { id: string; name: string }[];
  added: { id: string; name: string }[];
  changed: { id: string; oldName: string; newName: string }[];
}

function compareApprovers(current: InstanceStep, snapshotStep: ApproverSnapshotStep | undefined): SnapshotDiff {
  if (!snapshotStep) return { hasDifferences: false, removed: [], added: [], changed: [] };

  const currentMap = new Map(current.approvers.map((a) => [a.id, a.name]));
  const snapshotMap = new Map(snapshotStep.approvers.map((a) => [a.id, a.name]));

  const removed: SnapshotDiff['removed'] = [];
  const added: SnapshotDiff['added'] = [];
  const changed: SnapshotDiff['changed'] = [];

  for (const [id, name] of snapshotMap) {
    const currentName = currentMap.get(id);
    if (currentName === undefined) {
      removed.push({ id, name });
    } else if (currentName !== name) {
      changed.push({ id, oldName: name, newName: currentName });
    }
  }

  for (const [id, name] of currentMap) {
    if (!snapshotMap.has(id)) {
      added.push({ id, name });
    }
  }

  return {
    hasDifferences: removed.length > 0 || added.length > 0 || changed.length > 0,
    removed,
    added,
    changed,
  };
}

function formatDecidedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StepProgressList({ steps, snapshot }: StepProgressListProps) {
  const snapshotByStepId = new Map(snapshot.steps.map((s) => [s.stepId, s]));

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Etapas</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Etapas de aprovação">
        {steps.map((step, i) => {
          const config = STATE_CONFIG[step.state];
          const diff = compareApprovers(step, snapshotByStepId.get(step.id));
          const isLast = i === steps.length - 1;

          return (
            <li
              key={step.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                paddingBottom: isLast ? 0 : '0.75rem',
              }}
            >
              {/* Vertical connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '2rem', flexShrink: 0 }}>
                <span
                  aria-label={config.label}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: config.bg,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </span>
                {!isLast && (
                  <div style={{ width: '2px', flex: 1, background: '#e5e7eb', marginTop: '0.25rem' }} />
                )}
              </div>

              {/* Step content */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{step.name}</span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.0625rem 0.375rem',
                      borderRadius: '4px',
                      background: config.bg,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                  {diff.hasDifferences && (
                    <span
                      title="Aprovadores diferem do snapshot original. O organograma foi alterado desde a submissão."
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.0625rem 0.375rem',
                        borderRadius: '4px',
                        background: '#ede9fe',
                        color: '#6d28d9',
                        cursor: 'help',
                      }}
                    >
                      Snapshot
                    </span>
                  )}
                </div>

                {/* Current approvers */}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
                  {step.approvers.map((a) => (
                    <li key={a.id} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem' }}>
                      <span>{a.name}</span>
                      {a.decidedAt && (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          — {formatDecidedAt(a.decidedAt)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Snapshot comparison (expandable) */}
                {diff.hasDifferences && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary
                      style={{
                        fontSize: '0.75rem',
                        color: '#6d28d9',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      Ver snapshot original
                    </summary>
                    <div
                      style={{
                        marginTop: '0.375rem',
                        padding: '0.5rem',
                        background: '#f5f3ff',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {diff.changed.map((c) => (
                        <div key={c.id} style={{ marginBottom: '0.125rem' }}>
                          <span style={{ textDecoration: 'line-through', color: '#dc2626' }}>
                            {c.oldName}
                          </span>
                          {' → '}
                          <span style={{ color: '#166534' }}>{c.newName}</span>
                        </div>
                      ))}
                      {diff.removed.map((r) => (
                        <div key={r.id} style={{ color: '#dc2626', textDecoration: 'line-through', marginBottom: '0.125rem' }}>
                          {r.name}
                        </div>
                      ))}
                      {diff.added.map((a) => (
                        <div key={a.id} style={{ color: '#166534', marginBottom: '0.125rem' }}>
                          + {a.name} <span style={{ color: '#6b7280' }}>(novo)</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
