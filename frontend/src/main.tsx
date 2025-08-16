import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service worker will be registered by Vite PWA plugin
  });
}

// Add global error logging
console.log('[KHS-CRM] App starting...');

window.addEventListener('error', (event) => {
  console.error('[KHS-CRM] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[KHS-CRM] Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);