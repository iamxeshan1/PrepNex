import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Phone, MapPin, Building, Map, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { motion } from 'motion/react';

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

  useEffect(() => {
    if (user && profile) {
      setFormData({
        name: profile.name || user.displayName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        district: profile.district || '',
        state: profile.state || ''
      });
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) return setError('Full name is required');
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) return setError('Please enter a valid 10-digit phone number');
    if (!formData.address.trim()) return setError('Address is required');
    if (!formData.district.trim()) return setError('District is required');
    if (!formData.state) return setError('Please select a state');

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">My Profile</h1>
                      <p className="text-slate-500 font-medium">Manage your personal details and contact information.</p>
                  </header>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100 font-medium">
                          <AlertCircle size={18} />
                          {error}
                        </div>
                      )}
                      
                      {success && (
                        <div className="p-4 rounded-xl bg-teal-50 text-teal-700 text-sm flex items-center gap-2 border border-teal-100 font-medium">
                          <CheckCircle2 size={18} />
                          {success}
                        </div>
                      )}

                      <div className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 transition-all outline-none text-slate-700 font-bold"
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
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 transition-all outline-none text-slate-700 font-bold"
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
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 transition-all outline-none text-slate-700 font-bold"
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
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 transition-all outline-none text-slate-700 font-bold appearance-none"
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
                            className="w-full md:w-auto px-8 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
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
                  
                  {/* Footer */}
                  <footer className="mt-12 py-8 border-t border-slate-100/60 pb-4 lg:pb-0">
                    <p className="text-center text-xs text-slate-500 font-medium pb-4">
                      © {new Date().getFullYear()} PrepNext. Built for Excellence in Competitive Examinations.
                    </p>
                  </footer>
              </motion.div>
          </main>
      </div>
    </div>
  );
}
