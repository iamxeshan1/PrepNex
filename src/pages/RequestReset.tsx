import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function RequestReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: 'success', 
        text: 'A reset link has been sent to your email. Please check your inbox and spam folder.' 
      });
    } catch (error: any) {
      console.error('Reset error:', error);
      let errorMsg = 'Failed to send reset link. Please verify your email or try again later.';
      
      if (error.code === 'auth/user-not-found') {
        // Firebase doesn't always return this depending on security settings
        setMessage({ type: 'success', text: 'If that email is registered, a reset link has been sent.' });
        return;
      }

      setMessage({ 
        type: 'error', 
        text: errorMsg 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full">
        <button 
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Reset Password</h1>
            <p className="text-slate-400 font-bold mt-2 text-xs uppercase tracking-widest leading-relaxed">
              We'll send you a link to get back into your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:bg-secondary transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>
          </form>

          {message && (
            <div className={`mt-8 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 border ${
              message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 
              message.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-red-50 border-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p className="text-xs font-bold leading-relaxed">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
