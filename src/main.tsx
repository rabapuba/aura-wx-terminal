import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Safe root mounting targeting #root element without throwing null reference errors
const container = document.getElementById('root') ?? (() => {
  const fallback = document.createElement('div');
  fallback.id = 'root';
  document.body.appendChild(fallback);
  return fallback;
})();

const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
