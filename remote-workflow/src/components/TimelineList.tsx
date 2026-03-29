import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TimelineEvent } from '@workflow/shared-types';

interface TimelineListProps {
  events: TimelineEvent[];
}

const EVENT_CONFIG: Record<TimelineEvent['type'], { color: string; icon: string }> = {
  created: { color: '#3b82f6', icon: '+' },
  step_approved: { color: '#16a34a', icon: '✓' },
  step_rejected: { color: '#dc2626', icon: '✗' },
  delegated: { color: '#8b5cf6', icon: '→' },
  completed: { color: '#059669', icon: '⚑' },
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffH < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `há ${mins} min`;
  }
  if (diffH < 24) {
    return `há ${Math.floor(diffH)}h`;
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TimelineList({ events }: TimelineListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <section>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
        Linha do Tempo
        <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 400, marginLeft: '0.5rem' }}>
          ({events.length} eventos)
        </span>
      </h3>
      <div
        ref={parentRef}
        role="list"
        aria-label="Linha do tempo da instância"
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const event = events[virtualRow.index];
            if (!event) return null;
            const config = EVENT_CONFIG[event.type];

            return (
              <div
                key={event.id}
                role="listitem"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0 1rem',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <span
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: config.color + '1a',
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', display: 'flex', gap: '0.375rem' }}>
                    <span style={{ fontWeight: 500, color: '#374151' }}>{event.actor.name}</span>
                    <span style={{ color: '#6b7280' }}>—</span>
                    <span
                      style={{
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.description}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
