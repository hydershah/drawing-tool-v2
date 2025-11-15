/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initializeDatabase } from './services/database';
import './styles/globals.css';

// Update favicon based on color scheme
function updateFavicon() {
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (!favicon) {
    console.warn('Favicon element not found');
    return;
  }

  // Check if dark mode is active (next-themes adds 'dark' class to html element)
  const isDark = document.documentElement.classList.contains('dark');
  const newHref = isDark ? '/favicon-promptbrush-dark-mode.png' : '/favicon-promptbrush.png';

  // Force favicon update by removing and re-adding
  favicon.href = newHref + '?v=' + Date.now();
  console.log('Favicon updated:', { isDark, href: newHref });
}

// Wait for DOM to be ready before updating favicon
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateFavicon();

    // Watch for theme changes by observing class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateFavicon();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
} else {
  // DOM is already ready
  updateFavicon();

  // Watch for theme changes by observing class changes on html element
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        updateFavicon();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Initialize database before rendering app
initializeDatabase()
  .then(() => {
    console.log('[App] Database initialized successfully');
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('[App] Failed to initialize database:', error);
    // Render app anyway with error message
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Database Initialization Error</h1>
          <p>Failed to initialize the database. Please refresh the page or check the console for details.</p>
          <pre>{String(error)}</pre>
        </div>
      </React.StrictMode>
    );
  });
