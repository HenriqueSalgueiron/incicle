import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { delegationSchema, type DelegationFormData } from '@/schemas/delegationSchema';

interface DelegationFormProps {
  users: { id: string; name: string }[];
  onSubmit: (data: DelegationFormData) => Promise<boolean>;
  submitting: boolean;
}

export function DelegationForm({ users, onSubmit, submitting }: DelegationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DelegationFormData>({
    resolver: zodResolver(delegationSchema),
    defaultValues: { toUserId: '', startDate: '', endDate: '' },
  });

  async function handleFormSubmit(data: DelegationFormData) {
    const success = await onSubmit(data);
    if (success) reset();
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      style={{
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        marginBottom: '1.5rem',
      }}
    >
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 600 }}>
        Nova Delegação
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        {/* Delegado */}
        <div style={{ flex: '1 1 12rem' }}>
          <label
            htmlFor="delegation-delegate"
            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}
          >
            Delegado
          </label>
          <select
            id="delegation-delegate"
            {...register('toUserId')}
            aria-required="true"
            aria-invalid={!!errors.toUserId}
            aria-describedby={errors.toUserId ? 'delegation-delegate-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${errors.toUserId ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          >
            <option value="" disabled>
              Selecione um delegado...
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errors.toUserId && (
            <span
              id="delegation-delegate-error"
              role="alert"
              style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}
            >
              {errors.toUserId.message}
            </span>
          )}
        </div>

        {/* Data inicial */}
        <div style={{ flex: '1 1 8rem' }}>
          <label
            htmlFor="delegation-start"
            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}
          >
            Data inicial
          </label>
          <input
            id="delegation-start"
            type="date"
            {...register('startDate')}
            aria-required="true"
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'delegation-start-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${errors.startDate ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
          {errors.startDate && (
            <span
              id="delegation-start-error"
              role="alert"
              style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}
            >
              {errors.startDate.message}
            </span>
          )}
        </div>

        {/* Data final */}
        <div style={{ flex: '1 1 8rem' }}>
          <label
            htmlFor="delegation-end"
            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}
          >
            Data final
          </label>
          <input
            id="delegation-end"
            type="date"
            {...register('endDate')}
            aria-required="true"
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'delegation-end-error' : undefined}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${errors.endDate ? '#fca5a5' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
          {errors.endDate && (
            <span
              id="delegation-end-error"
              role="alert"
              style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}
            >
              {errors.endDate.message}
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        style={{
          padding: '0.5rem 1.25rem',
          background: submitting ? '#93c5fd' : '#1d4ed8',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.875rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontWeight: 500,
        }}
      >
        {submitting ? 'Criando...' : 'Criar Delegação'}
      </button>
    </form>
  );
}
