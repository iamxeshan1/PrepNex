import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Maintain real-time online status and heartbeat for active user
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const markOnline = async () => {
      try {
        await updateDoc(userDocRef, {
          isOnline: true,
          lastSeen: Date.now()
        });
      } catch (e) {
        // Document might be created shortly during signup
      }
    };

    const markOffline = async () => {
      try {
        await updateDoc(userDocRef, {
          isOnline: false,
          lastSeen: Date.now()
        });
      } catch (e) {
        // Ignore
      }
    };

    markOnline();

    // Heartbeat every 45 seconds to keep lastSeen fresh
    const heartbeatInterval = setInterval(markOnline, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markOnline();
      } else {
        markOffline();
      }
    };

    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      markOffline();
    };
  }, [user]);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    
    // Absolute fallback to ensure app is never stuck at Loading...
    const globalLoadingTimeout = setTimeout(() => {
      console.warn("Global auth loading timeout reached. Forced to false.");
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      setUser(authUser);
      
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        
        // Use onSnapshot for real-time profile updates
        profileUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
          clearTimeout(globalLoadingTimeout);
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.isBlocked) {
              await auth.signOut();
              setUser(null);
              setProfile(null);
              alert("Your account has been blocked.");
            } else {
              const updates: any = {};
              let currentUsername = data.username;
              if (!currentUsername) {
                currentUsername = (data.name || data.fullName || authUser.displayName || authUser.email?.split('@')[0] || 'aspirant')
                  .toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'aspirant';
                updates.username = currentUsername;
              }
              const nowIso = new Date().toISOString();
              if (!data.lastLogin || (Date.now() - new Date(data.lastLogin).getTime() > 300000)) {
                updates.lastLogin = nowIso;
                updates.isOnline = true;
                updates.lastSeen = Date.now();
              }
              if (Object.keys(updates).length > 0) {
                updateDoc(userDocRef, updates).catch(() => {});
              }
              setProfile({ ...data, ...updates });
            }
            setLoading(false);
          } else {
            // Auto-create user profile in Firestore for any authenticated user
            const isAdminEmail = authUser.email === 'iamxeshan1@gmail.com' || authUser.email === 'prepnextedtech@gmail.com';
            const autoUsername = (authUser.displayName || authUser.email?.split('@')[0] || 'aspirant')
              .toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'aspirant';
            const nowIso = new Date().toISOString();
            const newProfile = {
              userId: authUser.uid,
              uid: authUser.uid,
              username: autoUsername,
              name: authUser.displayName || authUser.email?.split('@')[0] || 'Aspirant User',
              fullName: authUser.displayName || authUser.email?.split('@')[0] || 'Aspirant User',
              email: authUser.email || '',
              photoURL: authUser.photoURL || '',
              role: isAdminEmail ? 'admin' : 'student',
              isPremium: false,
              premiumExpiry: null,
              purchasedExams: [],
              testsAttempted: 0,
              averageScore: 0,
              profileCompleted: false,
              createdAt: nowIso,
              lastLogin: nowIso,
              isOnline: true,
              lastSeen: Date.now()
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.error("Failed to auto-create user profile in Firestore:", err);
            }
          }
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        clearTimeout(globalLoadingTimeout);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(globalLoadingTimeout);
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'iamxeshan1@gmail.com' || user?.email === 'prepnextedtech@gmail.com',
    logout: async () => {
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: false,
            lastSeen: Date.now()
          });
        } catch (e) {}
      }
      await auth.signOut();
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
