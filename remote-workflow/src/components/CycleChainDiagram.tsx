interface CycleChainDiagramProps {
  chain: { id: string; name: string }[];
  onDismiss: () => void;
}

export function CycleChainDiagram({ chain, onDismiss }: CycleChainDiagramProps) {
  // Build screen-reader description: "Ana delega para Bruno, Bruno delega para Carla, ... formando um ciclo."
  const srDescription = chain
    .slice(0, -1)
    .map((user, i) => `${user.name} delega para ${chain[i + 1]?.name ?? ''}`)
    .join(', ')
    .concat(', formando um ciclo.');

  return (
    <div
      role="alert"
      aria-label="Erro: ciclo de delegação detectado"
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <strong style={{ color: '#991b1b', fontSize: '0.875rem' }}>
            Ciclo de delegação detectado
          </strong>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#7f1d1d' }}>
            A delegação criaria um ciclo entre os seguintes usuários:
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Fechar alerta de ciclo"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.125rem',
            color: '#991b1b',
            padding: '0',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Visual chain */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        {chain.map((user, index) => {
          const isLast = index === chain.length - 1;

          return (
            <span key={`${user.id}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              {index > 0 && (
                <span aria-hidden="true" style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                  →
                </span>
              )}
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  background: isLast ? '#dc2626' : '#fee2e2',
                  color: isLast ? '#fff' : '#991b1b',
                  border: isLast ? '1px solid #dc2626' : '1px solid #fca5a5',
                }}
              >
                {user.name}
              </span>
            </span>
          );
        })}
      </div>

      {/* Screen-reader only description */}
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {srDescription}
      </span>
    </div>
  );
}
