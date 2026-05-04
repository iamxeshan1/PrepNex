import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export const SessionTimeoutManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut(auth).then(() => {
          // Instead of alert, which is restricted in iframe, maybe redirect or just let AuthContext handle the user change
          window.location.reload(); 
        });
      }, TIMEOUT_DURATION);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Initialize

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  return null;
};
