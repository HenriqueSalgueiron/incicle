import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useInboxStore } from '@/store/inboxStore';
import { useInboxSync } from '@/hooks/useInboxSync';
import { ApprovalInboxItem } from '@/components/ApprovalInboxItem';

const POLLING_INTERVAL = 30_000;

export default function ApprovalInbox() {
  const { currentCompanyId } = useAuth();
  const { items, loading, error, conflicts, fetchInbox, approveItem, rejectItem, dismissConflict } =
    useInboxStore();

  const api = useApi();
  useInboxSync();
  const parentRef = useRef<HTMLDivElement>(null);

  // items includes optimistically updated ones (approved/rejected) — show all
  const itemCount = items.length;

  // Fetch + polling
  useEffect(() => {
    fetchInbox(api, currentCompanyId);
    const interval = setInterval(() => fetchInbox(api, currentCompanyId), POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [api, currentCompanyId, fetchInbox]);

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const handleApprove = useCallback((id: string) => approveItem(api, id), [api, approveItem]);

  const handleReject = useCallback((id: string) => rejectItem(api, id), [api, rejectItem]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
          Inbox de Aprovações
          {!loading && (
            <span
              style={{
                fontSize: '0.8125rem',
                color: '#6b7280',
                fontWeight: 400,
                marginLeft: '0.5rem',
              }}
            >
              ({itemCount} itens)
            </span>
          )}
        </h2>
        <Link
          to="/instances/new"
          style={{
            padding: '0.375rem 0.75rem',
            background: '#1d4ed8',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          + Nova Instância
        </Link>
      </div>

      {/* Conflict notifications */}
      {conflicts.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {conflicts.map((c) => (
            <div
              key={c.itemId}
              role="alert"
              style={{
                padding: '0.5rem 0.75rem',
                marginBottom: '0.25rem',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Conflito: &quot;{c.title}&quot; já foi decidido por outro aprovador.</span>
              <button
                onClick={() => dismissConflict(c.itemId)}
                aria-label={`Dispensar notificação de conflito para ${c.title}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#92400e',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.5rem 0.75rem',
            background: '#fee2e2',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            color: '#991b1b',
            marginBottom: '0.75rem',
          }}
        >
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>
      ) : (
        <div
          ref={parentRef}
          role="list"
          aria-label="Lista de aprovações pendentes"
          style={{
            height: 'calc(100vh - 160px)',
            overflow: 'auto',
            contain: 'strict',
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
              const item = items[virtualRow.index];
              if (!item) return null;
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ApprovalInboxItem
                    item={item}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
