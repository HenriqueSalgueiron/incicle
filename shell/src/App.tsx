import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loadRemote } from '@module-federation/enhanced/runtime';
import type { RemoteAppProps } from '@workflow/shared-types';
import RemoteBoundary from '@/components/RemoteBoundary';
import { useAuthStore } from '@/store/authStore';

const RemoteApp = React.lazy(() =>
  loadRemote<{ default: React.ComponentType<RemoteAppProps> }>('remote_workflow/App').then((m) => {
    if (!m) throw new Error('Remote module not found');
    return { default: m.default };
  }),
);

function App() {
  const { user, token, companies, currentCompanyId, switchCompany, isAuthenticated } =
    useAuthStore();

  if (!isAuthenticated || !user || !token || !currentCompanyId) {
    return <div style={{ padding: '2rem' }}>Carregando autenticação...</div>;
  }

  const remoteProps: RemoteAppProps = {
    user,
    token,
    currentCompanyId,
    companies,
    onCompanyChange: switchCompany,
  };

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
            value={currentCompanyId}
            onChange={(e) => switchCompany(e.target.value)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{user.name}</span>
        </div>
      </header>
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/approvals/inbox" replace />} />
          <Route
            path="/*"
            element={
              <RemoteBoundary>
                <Suspense fallback={<div>Carregando módulo...</div>}>
                  <RemoteApp {...remoteProps} />
                </Suspense>
              </RemoteBoundary>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
