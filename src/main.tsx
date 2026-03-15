import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ContentPackProvider} from './context/ContentPackContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContentPackProvider>
      <App />
    </ContentPackProvider>
  </StrictMode>,
);
