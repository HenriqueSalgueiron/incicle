import type { Delegation } from '@workflow/shared-types';

interface DelegationListProps {
  delegations: Delegation[];
  onCancel: (id: string) => void;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function DelegationList({ delegations, onCancel }: DelegationListProps) {
  if (delegations.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '1.5rem 0' }}>
        Nenhuma delegação ativa.
      </p>
    );
  }

  return (
    <div role="list" aria-label="Lista de delegações ativas">
      {delegations.map((d) => (
        <div
          key={d.id}
          role="listitem"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', color: '#111827' }}>
              <strong>{d.fromUser.name}</strong>
              <span style={{ color: '#6b7280', margin: '0 0.375rem' }} aria-hidden="true">→</span>
              <strong>{d.toUser.name}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
              {formatDate(d.startDate)} — {formatDate(d.endDate)}
            </div>
          </div>
          <button
            onClick={() => onCancel(d.id)}
            aria-label={`Cancelar delegação de ${d.fromUser.name} para ${d.toUser.name}`}
            style={{
              padding: '0.25rem 0.75rem',
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
}
