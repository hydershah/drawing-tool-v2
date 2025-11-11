/**
 * Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initializeDatabase } from './services/database';
import './styles/globals.css';

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
