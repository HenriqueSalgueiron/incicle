import React, { Suspense } from 'react';
import LoginPage from '@/pages/LoginPage';
import { useAuthStore } from '@/store/authStore';

const RemoteLoader = React.lazy(() => import('@/components/RemoteLoader'));

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
