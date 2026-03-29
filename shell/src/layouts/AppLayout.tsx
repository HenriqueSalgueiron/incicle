import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

function AppLayout({ children }: { children: ReactNode }) {
  const auth = useAuthStore();

  if (!auth.isAuthenticated) return null;

  return (
    <div>
      <header
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Workflow de Aprovações</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="company-select" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Empresa:
          </label>
          <select
            id="company-select"
            value={auth.currentCompanyId}
            onChange={(e) => auth.switchCompany(e.target.value)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            {auth.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{auth.user.name}</span>
        </div>
      </header>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}

export default AppLayout;
