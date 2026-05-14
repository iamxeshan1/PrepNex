import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2, Crown, ListChecks, Rocket, Loader2, Plus, Trash2, Star, Percent } from 'lucide-react';
import { motion } from 'motion/react';

export interface PremiumPlanDef {
  id: string;
  name: string;
  months: number;
  price: number;
  originalPrice: number;
  isPopular: boolean;
}

export default function PremiumPlanManagement() {
  const [premiumTitle, setPremiumTitle] = useState('Unlimited Access Pass');
  const [premiumSubtitle, setPremiumSubtitle] = useState('Unlock all mock tests & exams');
  const [plans, setPlans] = useState<PremiumPlanDef[]>([
    { id: 'p_1m', name: '1 Month', months: 1, price: 499, originalPrice: 999, isPopular: false },
    { id: 'p_1y', name: '1 Year', months: 12, price: 3999, originalPrice: 11988, isPopular: true },
  ]);
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
        if (data.premiumTitle) setPremiumTitle(data.premiumTitle);
        if (data.premiumSubtitle) setPremiumSubtitle(data.premiumSubtitle);
        if (data.premiumPlans) setPlans(data.premiumPlans);
        if (data.premiumFeatures) setPremiumFeatures(Array.isArray(data.premiumFeatures) ? data.premiumFeatures.join('\n') : data.premiumFeatures);
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
      
      const sortedPlans = [...plans].sort((a, b) => a.months - b.months);
      
      await setDoc(doc(db, 'settings', 'general'), {
        ...existingData,
        premiumTitle,
        premiumSubtitle, 
        premiumPlans: sortedPlans,
        premiumFeatures,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Premium plan logic synchronized.' });
    } catch (error) {
       console.error(error);
       setMessage({ type: 'error', text: 'Protocol failure. Verification required.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (index: number, key: keyof PremiumPlanDef, value: any) => {
     const newPlans = [...plans];
     newPlans[index] = { ...newPlans[index], [key]: value };
     setPlans(newPlans);
  };

  const addPlan = () => {
     setPlans([...plans, { 
       id: `p_${Date.now()}`, 
       name: 'Custom Plan', 
       months: 6, 
       price: 1999, 
       originalPrice: 2994, 
       isPopular: false 
     }]);
  };

  const removePlan = (index: number) => {
     setPlans(plans.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout title="Premium Plans & Pricing">
      <div className="mb-12">
         <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Premium Offering Schema</h2>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Configure durations, pricing, and custom plans</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-12 pb-40 items-start">
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <header className="mb-12 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                       <Crown className="w-7 h-7" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">Tier Foundation</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Core messaging</p>
                    </div>
                  </div>
               </header>

               <div className="space-y-10 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Title</label>
                        <input className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold" value={premiumTitle} onChange={(e) => setPremiumTitle(e.target.value)} required />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Subtitle</label>
                        <input className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold" value={premiumSubtitle} onChange={(e) => setPremiumSubtitle(e.target.value)} required />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <header className="mb-8 flex items-center justify-between">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">Subscription Plans</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Define specific durations, pricing, and discounts</p>
                   </div>
                   <button type="button" onClick={addPlan} className="flex items-center gap-2 px-5 py-3 bg-[#002f26] text-white rounded-xl text-xs font-bold hover:bg-[#001f19] transition-colors">
                      <Plus className="w-4 h-4" /> Add custom plan
                   </button>
                </header>
                
                <div className="space-y-6">
                   {plans.map((plan, index) => {
                      const discountPercentage = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100) || 0;
                      return (
                      <div key={plan.id} className={`p-6 rounded-[2rem] border-2 transition-all ${plan.isPopular ? 'border-amber-400 bg-amber-50/50' : 'border-slate-100 bg-slate-50'}`}>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                            <div className="col-span-12 md:col-span-4 space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plan Name</label>
                               <input type="text" value={plan.name} onChange={e => updatePlan(index, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-sm" placeholder="e.g. 5 Months Crash Course" required />
                            </div>
                            <div className="col-span-6 md:col-span-2 space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Months</label>
                               <input type="number" value={plan.months} onChange={e => updatePlan(index, 'months', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm" required min="1" max="120" />
                            </div>
                            <div className="col-span-6 md:col-span-2 space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price (₹)</label>
                               <input type="number" value={plan.price} onChange={e => updatePlan(index, 'price', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-sm text-emerald-600" required />
                            </div>
                            <div className="col-span-6 md:col-span-3 space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Original (₹)</label>
                               <div className="relative">
                                  <input type="number" value={plan.originalPrice} onChange={e => updatePlan(index, 'originalPrice', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-14 py-3 font-bold text-sm text-slate-500" required />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-rose-500 px-1.5 py-0.5 bg-rose-50 rounded">
                                     {discountPercentage}%
                                  </div>
                               </div>
                            </div>
                            <div className="col-span-6 md:col-span-1 pt-2 md:pt-0 flex justify-end">
                               <button type="button" onClick={() => removePlan(index)} className="p-3 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                         <div className="mt-4 flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" checked={plan.isPopular} onChange={e => updatePlan(index, 'isPopular', e.target.checked)} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-slate-100 border-slate-300" />
                               <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> Mark as Popular / Recommended</span>
                            </label>
                         </div>
                      </div>
                   )})}
                   {plans.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium">
                         No plans defined. Users will not be able to purchase premium.
                      </div>
                   )}
                </div>
            </div>

            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 mb-4"><ListChecks className="w-4 h-4 text-emerald-500" /> Utility Inventory (Features - One per line)</label>
               <textarea className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none h-48 focus:border-amber-400 font-medium text-slate-600 leading-relaxed resize-none" value={premiumFeatures} onChange={(e) => setPremiumFeatures(e.target.value)} />
            </div>

            {message && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-[2.5rem] border flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
               >
                  {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message.text}</span>
               </motion.div>
            )}
         </div>

         <div className="lg:col-span-1 space-y-10 sticky top-24">
            <div className="bg-[#002f26] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
               <Rocket className="w-10 h-10 mb-6 opacity-50" />
               <h4 className="text-2xl font-black tracking-tight font-display uppercase leading-tight mb-4 text-amber-400">Deploy Changes</h4>
               <p className="text-sm font-medium text-slate-400 italic leading-relaxed pr-6 mb-10">Premium plans scale dynamically based on selected duration. Clients automatically calculate exact prices.</p>
               
               <button 
                  type="submit" disabled={saving}
                  className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95"
               >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-5 h-5" /> Save Configuration</>}
               </button>
            </div>
         </div>
      </form>
    </AdminLayout>
  );
}
