import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const ApprovalInbox = lazy(() => import('@/pages/ApprovalInbox'));
const InstanceDetail = lazy(() => import('@/pages/InstanceDetail'));
const InstanceCreate = lazy(() => import('@/pages/InstanceCreate'));
const Delegations = lazy(() => import('@/pages/Delegations'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Routes>
        <Route path="/approvals/inbox" element={<ApprovalInbox />} />
        <Route path="/instances/new" element={<InstanceCreate />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/delegations" element={<Delegations />} />
      </Routes>
    </Suspense>
  );
}

export default App;
