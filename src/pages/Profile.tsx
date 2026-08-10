import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { User, Phone, MapPin, Building, Map, CheckCircle2, AlertCircle, ArrowLeft, AtSign, Loader2, Check, X } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { SnapchatStreakBadge } from '../components/SnapchatStreakBadge';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
].sort();

export default function Profile() {
  const { user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    district: '',
    state: ''
  });

  const [username, setUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: '' });

  useEffect(() => {
    if (user && profile) {
      setFormData({
        name: profile.name || user.displayName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        district: profile.district || '',
        state: profile.state || ''
      });

      const initialUsername = profile.username || (profile.name || user.displayName || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      setUsername(initialUsername);
    }
  }, [user, profile]);

  useEffect(() => {
    const cleanHandle = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanHandle) {
      setUsernameStatus({ available: false, message: 'Username cannot be empty.' });
      return;
    }

    if (cleanHandle.length < 3) {
      setUsernameStatus({ available: false, message: 'Username must be at least 3 characters.' });
      return;
    }

    if (cleanHandle.length > 20) {
      setUsernameStatus({ available: false, message: 'Username cannot exceed 20 characters.' });
      return;
    }

    if (profile?.username && cleanHandle === profile.username.toLowerCase()) {
      setUsernameStatus({ available: true, message: 'This is your current active username.' });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const q = query(collection(db, 'users'), where('username', '==', cleanHandle));
        const querySnap = await getDocs(q);

        let isTaken = false;
        querySnap.forEach(docSnap => {
          if (docSnap.id !== user?.uid) {
            isTaken = true;
          }
        });

        if (isTaken) {
          setUsernameStatus({ available: false, message: 'Username is already taken by another aspirant.' });
        } else {
          setUsernameStatus({ available: true, message: 'Username is available!' });
        }
      } catch (err) {
        console.error('Error checking username availability:', err);
        setUsernameStatus({ available: null, message: 'Error checking availability.' });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, profile?.username, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!formData.name.trim()) return setError('Full name is required');
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
      return setError('Username must be between 3 and 20 characters.');
    }
    if (usernameStatus.available !== true) {
      return setError(usernameStatus.message || 'Please choose an available username before saving.');
    }
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) return setError('Please enter a valid 10-digit phone number');
    if (!formData.address.trim()) return setError('Address is required');
    if (!formData.district.trim()) return setError('District is required');
    if (!formData.state) return setError('Please select a state');

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Direct, real-time database check right before write to prevent race conditions
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(q);
      let isTaken = false;
      querySnap.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          isTaken = true;
        }
      });

      if (isTaken) {
        setUsernameStatus({ available: false, message: 'Username is already taken by another aspirant.' });
        setIsSubmitting(false);
        return setError('This username is already taken. Please choose another one.');
      }

      const cleanName = formData.name.trim();
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        name: cleanName,
        fullName: cleanName,
        displayName: cleanName,
        phoneNumber: formData.phone.trim(),
        username: cleanUsername,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      });

      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: cleanName });
        } catch (e) {
          console.warn('Could not update Firebase Auth displayName:', e);
        }
      }
      setSuccess('Profile and username updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = Boolean(profile?.isPremium || profile?.role === 'admin');

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#002f26]/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
          <DashboardTopHeader user={profile} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="p-4 lg:p-8 overflow-y-auto w-full max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <header className="mb-8">
                      <Link to="/dashboard" className="text-[#006e5d] font-bold flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft size={16} /> Back to Dashboard
                      </Link>
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">My Profile</h1>
                      <p className="text-slate-500 font-medium">Manage your personal details, unique username, and contact information.</p>
                  </header>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden bg-white">
                                    <img 
                                      src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name || user?.email || 'User'}&background=006e5d&color=fff`} 
                                      className="w-full h-full object-cover" 
                                      alt="Profile" 
                                    />
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                  <h3 className="text-xl font-black text-slate-900">{profile?.name || 'Aspirant'}</h3>
                                  {isVerified && <VerifiedBadge size="md" title="Pass Pro Verified Aspirant" />}
                                </div>
                                <p className="text-xs font-extrabold text-[#006e5d] mt-0.5">
                                  @{username || profile?.username || 'aspirant'}
                                </p>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">{profile?.email}</p>
                                <div className="mt-2.5 flex flex-wrap justify-center md:justify-start items-center gap-2">
                                    <SnapchatStreakBadge streakCount={Number(profile?.studyStreak || profile?.streak || 14)} size="sm" />
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${profile?.isPremium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {profile?.isPremium ? 'Premium Member' : 'Free Member'}
                                    </span>
                                    {profile?.role === 'admin' && (
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Administrator
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100 font-medium">
                          <AlertCircle size={18} />
                          {error}
                        </div>
                      )}
                      
                      {success && (
                        <div className="p-4 rounded-xl bg-[#006e5d]/5 text-[#006e5d] text-sm flex items-center gap-2 border border-[#006e5d]/10 font-medium">
                          <CheckCircle2 size={18} />
                          {success}
                        </div>
                      )}

                      <div className="space-y-5">
                        {/* Unique Username Field */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                          <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">
                            Aspirant Handle / Unique Username
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm flex items-center gap-1">
                              <AtSign size={18} />
                            </div>
                            <input
                              type="text"
                              required
                              value={username}
                              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                              className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl transition-all outline-none text-slate-800 font-extrabold text-sm ${
                                usernameStatus.available === true
                                  ? 'border-emerald-500/80 focus:border-emerald-600 ring-2 ring-emerald-500/10'
                                  : usernameStatus.available === false
                                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                                  : 'border-slate-200 focus:border-[#006e5d]'
                              }`}
                              placeholder="e.g. shahid_jkssb"
                            />
                            
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                              {checkingUsername ? (
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                              ) : usernameStatus.available === true ? (
                                <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center" title="Available">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : usernameStatus.available === false ? (
                                <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center" title="Not Available">
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Status Helper Message */}
                          {username.trim() && (
                            <p className={`text-xs font-bold mt-1 ml-1 flex items-center gap-1 ${
                              usernameStatus.available === true 
                                ? 'text-emerald-600' 
                                : usernameStatus.available === false 
                                ? 'text-red-500' 
                                : 'text-slate-400'
                            }`}>
                              {usernameStatus.message}
                            </p>
                          )}
                          <p className="text-[11px] font-medium text-slate-500 ml-1">
                            Your unique handle used across discussions, test leaderboards, and your public profile handle.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="text"
                              required
                               value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006e5d] transition-all outline-none text-slate-700 font-bold"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="tel"
                              required
                              pattern="[0-9]{10}"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006e5d] transition-all outline-none text-slate-700 font-bold"
                              placeholder="10-digit mobile number"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Read Only)</label>
                          <div className="relative">
                            <input
                              type="email"
                              readOnly
                              value={profile?.email || ''}
                              className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <textarea
                              required
                              value={formData.address}
                              onChange={e => setFormData({ ...formData, address: e.target.value })}
                              rows={2}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 transition-all outline-none text-slate-700 font-bold resize-none"
                              placeholder="House No, Locality, Area..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">District</label>
                            <div className="relative">
                              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input
                                type="text"
                                required
                                 value={formData.district}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006e5d] transition-all outline-none text-slate-700 font-bold"
                                placeholder="District"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">State</label>
                            <div className="relative">
                              <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                              <select
                                required
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#006e5d] transition-all outline-none text-slate-700 font-bold appearance-none"
                              >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-8 py-3.5 bg-[#006e5d] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#005a4d] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                          >
                            {isSubmitting ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                Save Changes
                                <CheckCircle2 size={18} />
                              </>
                            )}
                          </button>
                      </div>
                    </form>
                  </div>
                  

              </motion.div>
          </main>
      </div>
    </div>
  );
}
