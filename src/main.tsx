import React from 'react';
import ReactDOM from 'react-dom/client';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { BrowserRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { App } from './App';
import { DataProvider } from './contexts/DataContext';
import '@codegouvfr/react-dsfr/main.css';

startReactDsfr({
  defaultColorScheme: 'system',
  Link,
});

declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
