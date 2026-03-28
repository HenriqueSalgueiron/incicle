import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MOCK_USER, MOCK_TOKEN, MOCK_COMPANIES } from '@workflow/shared-types';
import App from './App';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App
          user={MOCK_USER}
          token={MOCK_TOKEN}
          currentCompanyId={MOCK_COMPANIES[0]?.id ?? ''}
          companies={MOCK_COMPANIES}
          onCompanyChange={() => {}}
        />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
