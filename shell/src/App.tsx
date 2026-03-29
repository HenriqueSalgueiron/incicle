import React, { Suspense } from 'react';
import LoginPage from '@/pages/LoginPage';
import { useAuthStore } from '@/store/authStore';

const RemoteLoader = React.lazy(() => import('@/components/RemoteLoader'));

function App() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!hasHydrated) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RemoteLoader />
    </Suspense>
  );
}

export default App;
