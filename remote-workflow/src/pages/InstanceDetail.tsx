import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import type { Instance } from '@workflow/shared-types';
import type { ApiError } from '@/services/api';
import { InstanceHeader } from '@/components/InstanceHeader';
import { StepProgressList } from '@/components/StepProgressList';
import { TimelineList } from '@/components/TimelineList';

const CONTEXT_LABELS: Record<string, string> = {
  valor: 'Valor',
  departamento: 'Departamento',
  justificativa: 'Justificativa',
  centro_custo: 'Centro de Custo',
  data_inicio: 'Data de Início',
  prioridade: 'Prioridade',
  observacao: 'Observação',
};

export default function InstanceDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstance = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .get<Instance>(`/api/instances/${id}`)
      .then(setInstance)
      .catch((err: unknown) => {
        const status = err instanceof Error && 'status' in err ? (err as ApiError).status : 0;
        setError(status === 404 ? 'Instância não encontrada.' : 'Erro ao carregar instância.');
      })
      .finally(() => setLoading(false));
  }, [api, id]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Carregando detalhes...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem' }}>
        <div role="alert" style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/approvals/inbox" style={{ fontSize: '0.875rem', color: '#1d4ed8', textDecoration: 'none' }}>
            ← Voltar para Inbox
          </Link>
          <button
            onClick={fetchInstance}
            style={{
              fontSize: '0.875rem',
              color: '#1d4ed8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!instance) return null;

  const contextEntries = Object.entries(instance.contextData);

  return (
    <main aria-labelledby="instance-title" style={{ padding: '0.5rem 0' }}>
      <Link
        to="/approvals/inbox"
        style={{
          display: 'inline-block',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#1d4ed8',
          textDecoration: 'none',
        }}
        aria-label="Voltar para inbox de aprovações"
      >
        ← Voltar para Inbox
      </Link>

      <InstanceHeader instance={instance} />

      {/* Context data */}
      {contextEntries.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Dados da Solicitação</h3>
          <dl
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'max-content 1fr',
              gap: '0.25rem 1rem',
              fontSize: '0.8125rem',
              background: '#f9fafb',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
            }}
          >
            {contextEntries.map(([key, value]) => (
              <div key={key} style={{ display: 'contents' }}>
                <dt style={{ fontWeight: 500, color: '#374151' }}>{CONTEXT_LABELS[key] ?? key}</dt>
                <dd style={{ margin: 0, color: '#6b7280' }}>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <StepProgressList steps={instance.steps} snapshot={instance.snapshot} />

      <TimelineList events={instance.timeline} />
    </main>
  );
}
