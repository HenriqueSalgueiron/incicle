import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { loadRemote } from "@module-federation/enhanced/runtime";
import RemoteBoundary from "@/components/RemoteBoundary";

const RemoteApp = React.lazy(() =>
  loadRemote<{ default: React.ComponentType }>("remote_workflow/App").then(
    (m) => {
      if (!m) throw new Error("Remote module not found");
      return { default: m.default };
    },
  ),
);

function App() {
  return (
    <div>
      <header style={{ padding: "1rem", borderBottom: "1px solid #e5e7eb" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
          Workflow de Aprovações
        </h1>
      </header>
      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/approvals/inbox" replace />}
          />
          <Route
            path="/*"
            element={
              <RemoteBoundary>
                <Suspense fallback={<div>Carregando módulo...</div>}>
                  <RemoteApp />
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
