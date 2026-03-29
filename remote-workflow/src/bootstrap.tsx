import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const STANDALONE_PROPS = {
  user: { id: 'dev-user', name: 'Dev User', email: 'dev@localhost' },
  token: 'dev-token',
  currentCompanyId: 'dev-company',
  companies: [{ id: 'dev-company', name: 'Dev Company' }],
  onCompanyChange: () => {},
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App {...STANDALONE_PROPS} />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
