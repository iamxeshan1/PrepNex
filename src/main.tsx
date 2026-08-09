import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import toast from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

// Safely override alert to prevent extension noise (like MetaMask) or standard alert spam from showing raw alert dialogs or broken errors
window.alert = (msg: any) => {
  const str = String(msg || '');
  if (
    str.toLowerCase().includes('metamask') || 
    str.toLowerCase().includes('ethereum') ||
    str.toLowerCase().includes('wallet') ||
    str.toLowerCase().includes('web3')
  ) {
    console.warn('Extension alert suppressed:', str);
    return;
  }
  toast.error(str, { duration: 4000 });
};

// Suppress unhandled promise rejections from browser extensions (e.g. MetaMask disconnect / RPC failure)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.toLowerCase().includes('metamask') ||
    reason.toLowerCase().includes('ethereum') ||
    reason.toLowerCase().includes('wallet') ||
    reason.toLowerCase().includes('web3')
  ) {
    console.warn('Suppressed extension rejection:', reason);
    event.preventDefault();
  }
});

// Suppress global errors from browser extensions
window.addEventListener('error', (event) => {
  const message = event.message || String(event.error || '');
  if (
    message.toLowerCase().includes('metamask') ||
    message.toLowerCase().includes('ethereum') ||
    message.toLowerCase().includes('wallet') ||
    message.toLowerCase().includes('web3')
  ) {
    console.warn('Suppressed extension error:', message);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

