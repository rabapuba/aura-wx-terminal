import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root') ?? (() => {
  const fallback = document.createElement('div');
  fallback.id = 'root';
  document.body.appendChild(fallback);
  return fallback;
})();

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
