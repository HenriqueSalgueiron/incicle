import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { enableMocking } from './services/mock/enableMocking';
import App from './App';

enableMocking()
  .catch((err) => {
    console.error('Failed to setup mocking:', err);
  })
  .then(() => {
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
  });
