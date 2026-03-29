import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loadRemote } from '@module-federation/enhanced/runtime';
import type { RemoteAppProps } from '@workflow/shared-types';
import RemoteBoundary from '@/components/RemoteBoundary';
import AppLayout from '@/layouts/AppLayout';
import { useAuthStore } from '@/store/authStore';

const RemoteApp = React.lazy(() =>
  loadRemote<{ default: React.ComponentType<RemoteAppProps> }>('remote_workflow/App').then((m) => {
    if (!m) throw new Error('Remote module not found');
    return { default: m.default };
  }),
);

function RemoteLoader() {
  const auth = useAuthStore();

  if (!auth.isAuthenticated) return null;

  const remoteProps: RemoteAppProps = {
    user: auth.user,
    token: auth.token,
    currentCompanyId: auth.currentCompanyId,
    companies: auth.companies,
    onCompanyChange: auth.switchCompany,
  };

  return (
    <AppLayout>
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
    </AppLayout>
  );
}

export default RemoteLoader;
