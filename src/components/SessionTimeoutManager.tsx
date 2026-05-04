import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'lastActivity';

export const SessionTimeoutManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let timeout: any;
    let checkInterval: any;

    const logout = () => {
      console.log('SessionTimeoutManager: Session expired, logging out...');
      signOut(auth).then(() => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/login';
      }).catch(err => {
        console.error('SessionTimeoutManager: Error during logout:', err);
      });
    };

    const resetTimer = () => {
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, now.toString());
      clearTimeout(timeout);
      timeout = setTimeout(logout, TIMEOUT_DURATION);
    };

    const checkTimeout = () => {
      const lastActivity = localStorage.getItem(STORAGE_KEY);
      if (lastActivity) {
        const lastTime = parseInt(lastActivity, 10);
        const elapsed = Date.now() - lastTime;
        if (elapsed >= TIMEOUT_DURATION) {
          logout();
        } else {
          // Sync local timer with the remaining time from the last activity on ANY tab
          clearTimeout(timeout);
          timeout = setTimeout(logout, TIMEOUT_DURATION - elapsed);
        }
      }
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        checkTimeout();
      }
    };

    window.addEventListener('storage', onStorageChange);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    });
    
    // Check every 10 seconds as a fallback
    checkInterval = setInterval(checkTimeout, 10000);
    
    resetTimer(); // Initialize

    return () => {
      clearTimeout(timeout);
      clearInterval(checkInterval);
      window.removeEventListener('storage', onStorageChange);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  return null;
};
