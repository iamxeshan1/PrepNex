import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Logo } from '../components/Logo';
import { Layout } from '../components/Layout';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        name,
        email,
        role: email === 'iamxeshan1@gmail.com' || email === 'prepnextedtech@gmail.com' ? 'admin' : 'student',
        purchasedExams: [],
        testsAttempted: 0,
        averageScore: 0,
        createdAt: new Date().toISOString()
      });

      // Send welcome email (handled by branded email service)
      fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      }).catch(console.error);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          userId: user.uid,
          name: user.displayName || 'Aspirant',
          email: user.email,
          photoURL: user.photoURL,
          role: user.email === 'iamxeshan1@gmail.com' || user.email === 'prepnextedtech@gmail.com' ? 'admin' : 'student',
          purchasedExams: [],
          testsAttempted: 0,
          averageScore: 0,
          createdAt: new Date().toISOString()
        });
      } else {
        // Keep photoURL and name in sync with Google if they change
        await updateDoc(docRef, {
          photoURL: user.photoURL || docSnap.data().photoURL,
          name: user.displayName || docSnap.data().name,
          email: user.email || docSnap.data().email
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Google Login Error:", err);
      // Provide more specific feedback for common Firebase errors
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain not authorized. Please add this domain (${window.location.hostname}) to Authorized Domains in Firebase Console.`);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please try opening the app in a new tab to sign in.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed before completion.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in request cancelled.');
      } else {
        setError(`Google Sign-Up failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 border border-slate-100"
        >
          <div className="flex flex-col items-center mb-10">
            <Logo className="text-4xl mb-4" />
            <h2 className="text-3xl font-black text-primary tracking-tight">Get Started</h2>
            <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Start your journey today</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input 
                required type="text" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input 
                required type="email" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Lock className="w-3 h-3" /> Create Password
              </label>
              <input 
                required type="password" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:bg-secondary transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR CONTINUE WITH</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <button 
            onClick={handleGoogleSignup}
            disabled={loading}
            className="mt-6 w-full py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Chrome className="w-5 h-5 text-secondary" />
            Sign up with Google
          </button>

          <p className="text-center mt-10 text-slate-400 font-bold text-xs tracking-tight">
            Already have an account? <Link to="/login" className="text-secondary hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
