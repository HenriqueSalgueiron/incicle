import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useAuthStore } from '@/store/authStore';

if (import.meta.env.VITE_USE_MOCK === 'true') {
  const { MOCK_USER, MOCK_TOKEN, MOCK_COMPANIES } = await import('@workflow/shared-types');
  useAuthStore.getState().login(MOCK_USER, MOCK_TOKEN, MOCK_COMPANIES);
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
