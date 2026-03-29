import type { Instance } from '@workflow/shared-types';

interface InstanceHeaderProps {
  instance: Instance;
}

const STATUS_STYLES: Record<Instance['status'], { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pendente' },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Aprovado' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Reprovado' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InstanceHeader({ instance }: InstanceHeaderProps) {
  const status = STATUS_STYLES[instance.status];

  return (
    <header style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h2 id="instance-title" style={{ margin: 0, fontSize: '1.25rem' }}>
          {instance.title}
        </h2>
        <span
          aria-label={`Status: ${status.label}`}
          style={{
            fontSize: '0.75rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '4px',
            background: status.bg,
            color: status.color,
            fontWeight: 500,
          }}
        >
          {status.label}
        </span>
      </div>
      <dl style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
        <div>
          <dt style={{ display: 'inline', fontWeight: 500, color: '#374151' }}>Solicitante: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{instance.requester.name}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 500, color: '#374151' }}>Template: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{instance.templateName} (v{instance.templateVersion})</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 500, color: '#374151' }}>Criado em: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{formatDate(instance.createdAt)}</dd>
        </div>
      </dl>
    </header>
  );
}
