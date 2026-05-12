import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import toast from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

window.alert = (msg: any) => {
  toast.error(String(msg), { duration: 4000 });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
