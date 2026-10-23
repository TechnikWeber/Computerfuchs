import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/nunito';
import '@fontsource-variable/fredoka';
import './styles/global.css';
import './styles/os.css';
import './styles/apps.css';
import './styles/files.css';
import './styles/keyboard.css';
import App from './App';
import { registerOffline } from './core/offline';
import { SaveProvider } from './core/SaveProvider';

const container = document.getElementById('root');
if (!container) throw new Error('Wurzelelement #root nicht gefunden.');

createRoot(container).render(
  <StrictMode>
    <SaveProvider>
      <App />
    </SaveProvider>
  </StrictMode>,
);

registerOffline();
