import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2, Crown, Zap, Clock, ListChecks, ArrowRight, Shield, Rocket, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function PremiumPlanManagement() {
  const [premiumPrice, setPremiumPrice] = useState('599');
  const [premiumOriginalPrice, setPremiumOriginalPrice] = useState('1499');
  const [premiumTitle, setPremiumTitle] = useState('Unlimited 1-Year Pass');
  const [premiumSubtitle, setPremiumSubtitle] = useState('Special Launch Offer • 60% OFF');
  const [premiumValidity, setPremiumValidity] = useState('365 Days');
  const [premiumFeatures, setPremiumFeatures] = useState([
    "Unlimited access to 500+ Mock Tests",
    "All Exam Categories (UPSC, SSC, Banking, etc.)",
    "Advanced Performance Analytics",
    "Premium 24/7 Priority Helpdesk",
    "Ad-free focused exam environment"
  ].join('\n'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const genSnap = await getDoc(doc(db, 'settings', 'general'));
      if (genSnap.exists()) {
        const data = genSnap.data();
        setPremiumPrice(data.premiumPrice || '599');
        setPremiumOriginalPrice(data.premiumOriginalPrice || '1499');
        setPremiumTitle(data.premiumTitle || 'Unlimited 1-Year Pass');
        setPremiumSubtitle(data.premiumSubtitle || 'Special Launch Offer • 60% OFF');
        setPremiumValidity(data.premiumValidity || '365 Days');
        setPremiumFeatures(data.premiumFeatures || [
          "Unlimited access to 500+ Mock Tests",
          "All Exam Categories (UPSC, SSC, Banking, etc.)",
          "Advanced Performance Analytics",
          "Premium 24/7 Priority Helpdesk",
          "Ad-free focused exam environment"
        ].join('\n'));
      }
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const genSnap = await getDoc(doc(db, 'settings', 'general'));
      const existingData = genSnap.exists() ? genSnap.data() : {};
      await setDoc(doc(db, 'settings', 'general'), {
        ...existingData,
        premiumPrice, premiumOriginalPrice, premiumTitle,
        premiumSubtitle, premiumValidity, premiumFeatures,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Institutional access plan synchronized.' });
    } catch (error) {
       console.error(error);
       setMessage({ type: 'error', text: 'Protocol failure. Verification required.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
     <AdminLayout title="Monetization Module">
        <div className="py-24 text-center">
           <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Querying Financial Protocols...</p>
        </div>
     </AdminLayout>
  );

  return (
    <AdminLayout title="Revenue Architecture">
      <div className="mb-12">
         <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Premium Offering Schema</h2>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Configure the primary monetization tier for global network access</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-40 items-start">
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full opacity-50 pointer-events-none" />
               
               <header className="mb-12 relative flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                     <Crown className="w-7 h-7" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">Tier Foundation</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Core value proposition and identity</p>
                  </div>
               </header>

               <div className="space-y-10 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Moniker (Title)</label>
                        <input className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-amber-500/5 font-bold shadow-inner" value={premiumTitle} onChange={(e) => setPremiumTitle(e.target.value)} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Call-to-Action / Subtext</label>
                        <input className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-amber-500/5 font-bold shadow-inner" value={premiumSubtitle} onChange={(e) => setPremiumSubtitle(e.target.value)} />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Net Yield (Sale Price ₹)</label>
                        <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black shadow-inner" value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Basis (Original ₹)</label>
                        <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black shadow-inner" value={premiumOriginalPrice} onChange={(e) => setPremiumOriginalPrice(e.target.value)} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Cycle (Validity)</label>
                        <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black shadow-inner" value={premiumValidity} onChange={(e) => setPremiumValidity(e.target.value)} />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ListChecks className="w-4 h-4 text-emerald-500" /> Utility Inventory (Features - One per line)</label>
                     <textarea className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-amber-500/5 font-medium text-slate-600 h-48 shadow-inner resize-none leading-relaxed" value={premiumFeatures} onChange={(e) => setPremiumFeatures(e.target.value)} />
                  </div>
               </div>
            </div>

            {message && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-[2.5rem] border flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
               >
                  {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message.text}</span>
               </motion.div>
            )}
         </div>

         <div className="lg:col-span-1 space-y-10 sticky top-24">
            <div className="bg-[#0f172a] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
               <Rocket className="w-10 h-10 mb-6 opacity-50" />
               <h4 className="text-2xl font-black tracking-tight font-display uppercase leading-tight mb-4 text-amber-400">Institutional Impact</h4>
               <p className="text-sm font-medium text-slate-400 italic leading-relaxed pr-6 mb-10">Premium tier adjustments are synchronized globally across all user nodes upon deployment.</p>
               
               <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-5 bg-white text-[#0f172a] rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95 transform hover:-translate-y-1"
               >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-5 h-5" /> Deploy Schema</>}
               </button>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4" /> Market Perception</h4>
               
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">01</div>
                     <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">Price psychological anchoring for maximum conversion.</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">02</div>
                     <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">Clarity in utility inventory reduces triage tickets.</p>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-50 flex items-center gap-3 text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                  <Shield className="w-4 h-4" /> Secure Tier Deployment Mode
               </div>
            </div>
         </div>
      </form>
    </AdminLayout>
  );
}
