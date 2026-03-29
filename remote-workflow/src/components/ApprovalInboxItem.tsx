import type { ApprovalItem } from '@workflow/shared-types';
import { SlaCountdown } from '@/components/SlaCountdown';

interface ApprovalInboxItemProps {
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function ApprovalInboxItem({ item, onApprove, onReject }: ApprovalInboxItemProps) {
  const isDecided = item.status !== 'pending';
  const statusStyle = isDecided ? { opacity: 0.6 } : {};

  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e5e7eb',
        ...statusStyle,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontWeight: 500,
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
          {isDecided && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                background: item.status === 'approved' ? '#dcfce7' : '#fee2e2',
                color: item.status === 'approved' ? '#166534' : '#991b1b',
              }}
            >
              {item.status === 'approved' ? 'Aprovado' : 'Reprovado'}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.25rem',
          }}
        >
          <span>Etapa: {item.currentStep}</span>
          <span>Solicitante: {item.requester.name}</span>
          <SlaCountdown deadline={item.slaDeadline} />
        </div>
      </div>

      {!isDecided && (
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexShrink: 0 }}>
          <button
            onClick={() => onApprove(item.id)}
            aria-label={`Aprovar ${item.title}`}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '4px',
              border: '1px solid #16a34a',
              background: '#16a34a',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Aprovar
          </button>
          <button
            onClick={() => onReject(item.id)}
            aria-label={`Reprovar ${item.title}`}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '4px',
              border: '1px solid #dc2626',
              background: '#fff',
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            Reprovar
          </button>
        </div>
      )}
    </div>
  );
}

export { ApprovalInboxItem };
