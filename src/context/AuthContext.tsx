import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.isBlocked) {
            await auth.signOut();
            setUser(null);
            setProfile(null);
            alert("Your account has been blocked by an administrator.");
          } else {
            setProfile(data);
          }
        } else {
          // New user profile creation
          const newProfile = {
            userId: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            role: 'student',
            isPremium: false,
            premiumExpiry: null,
            purchasedExams: [],
            testsAttempted: 0,
            averageScore: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'iamxeshan1@gmail.com' || user?.email === 'prepnexedtech@gmail.com'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
