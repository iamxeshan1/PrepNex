import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { getAuth, confirmPasswordReset } from 'firebase/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const customToken = searchParams.get('customToken');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode && !customToken) return setMessage({ type: 'error', text: 'Invalid reset link.' });

    setLoading(true);
    try {
      if (customToken) {
        // Custom reset flow
        const response = await fetch('/api/complete-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to reset password');
        
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Standard Firebase reset flow (fallback)
        const auth = getAuth();
        await confirmPasswordReset(auth, oobCode!, password);
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full">
        <h1 className="text-2xl font-extrabold text-primary mb-6">Set New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
