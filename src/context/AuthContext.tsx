import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

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
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.isBlocked) {
              await auth.signOut();
              setUser(null);
              setProfile(null);
              alert("Your account has been blocked.");
            } else {
              setProfile(data);
            }
          } else {
            // New user profile creation
            const isAdminEmail = authUser.email === 'iamxeshan1@gmail.com' || authUser.email === 'prepnextedtech@gmail.com';
            const newProfile = {
              userId: authUser.uid,
              name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
              email: authUser.email,
              role: isAdminEmail ? 'admin' : 'student',
              isPremium: false,
              premiumExpiry: null,
              purchasedExams: [],
              testsAttempted: 0,
              averageScore: 0,
              profileCompleted: false, // Explicitly false for new users
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            // Profile will be set by the next snapshot trigger
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'iamxeshan1@gmail.com' || user?.email === 'prepnextedtech@gmail.com'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
