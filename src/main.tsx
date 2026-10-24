import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA WebAPK installation on Android mobile devices
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[WaveMusic] ServiceWorker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[WaveMusic] ServiceWorker registration failed:', err);
      });
  });
}
