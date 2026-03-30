import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useDelegationStore } from '@/store/delegationStore';
import { CycleChainDiagram } from '@/components/CycleChainDiagram';
import { DelegationForm } from '@/components/DelegationForm';
import { DelegationList } from '@/components/DelegationList';
import type { DelegationFormData } from '@/schemas/delegationSchema';

export default function Delegations() {
  const { currentCompanyId, user } = useAuth();
  const api = useApi();
  const {
    delegations,
    users,
    loading,
    error,
    cycleError,
    fetchDelegations,
    fetchUsers,
    createDelegation,
    cancelDelegation,
    clearCycleError,
  } = useDelegationStore();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDelegations(api, currentCompanyId);
    fetchUsers(api);
  }, [api, currentCompanyId, fetchDelegations, fetchUsers]);

  async function handleCreate(data: DelegationFormData): Promise<boolean> {
    setSubmitting(true);
    const success = await createDelegation(api, currentCompanyId, data);
    setSubmitting(false);
    return success;
  }

  function handleCancel(id: string) {
    cancelDelegation(api, currentCompanyId, id);
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Delegações</h2>

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

      {cycleError && (
        <CycleChainDiagram chain={cycleError.chain} onDismiss={clearCycleError} />
      )}

      <DelegationForm
        users={users.filter((u) => u.id !== user.id)}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      {loading ? (
        <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Carregando delegações...
        </div>
      ) : (
        <DelegationList delegations={delegations} onCancel={handleCancel} />
      )}
    </div>
  );
}
