import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2, Crown, ListChecks, Rocket, Loader2, Plus, Trash2, Star, Percent, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';
import Toast, { ToastType } from '../../components/Toast';

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
  const [showAdd, setShowAdd] = useState(false);
  const [newPlan, setNewPlan] = useState<PremiumPlanDef>({
    id: '',
    name: '',
    months: 1,
    price: 0,
    originalPrice: 0,
    isPopular: false
  });
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

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
    setToast(prev => ({ ...prev, isVisible: false }));
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
      setToast({
        isVisible: true,
        message: 'Premium plan logic synchronized.',
        type: 'success'
      });
    } catch (error) {
       console.error(error);
       setToast({
         isVisible: true,
         message: 'Protocol failure. Verification required.',
         type: 'error'
       });
    } finally {
      setSaving(false);
    }
  };

  const removePlan = (index: number) => {
     setPlans(plans.filter((_, i) => i !== index));
  };

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) return;
    const planToAdd = { ...newPlan, id: `p_${Date.now()}` };
    setPlans([...plans, planToAdd]);
    setNewPlan({
      id: '',
      name: '',
      months: 1,
      price: 0,
      originalPrice: 0,
      isPopular: false
    });
    setShowAdd(false);
  };

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Premium Plans">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Configure durations, pricing, and custom premium membership protocols.</p>
        <button 
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#006e5d] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#005a4d] transition-colors"
        >
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAdd ? 'Cancel' : 'New Plan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Plans" value={plans.length} span="Active tiers" colorClass="text-[#006e5d]" />
        <StatCard title="Featured" value={plans.filter(p => p.isPopular).length} span="Recommended" colorClass="text-amber-600" />
      </div>

      {showAdd && (
        <div className="bg-white p-8 mb-8 relative border-b border-slate-200">
           <button type="button" onClick={() => setShowAdd(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Forge New Tier</h3>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-1">
               <label className="block text-sm font-semibold text-slate-700 mb-2">Tier Name</label>
               <input 
                 type="text" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-[#006e5d] focus:border-[#006e5d] font-bold text-[#002f26]"
                 value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} 
                 placeholder="e.g. 1 Year Premium"
               />
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (Months)</label>
               <input 
                 type="number" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-[#006e5d] focus:border-[#006e5d] font-bold text-[#002f26]"
                 value={newPlan.months} onChange={(e) => setNewPlan({...newPlan, months: Number(e.target.value)})} 
               />
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Display Price (₹)</label>
               <input 
                 type="number" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-[#006e5d] focus:border-[#006e5d] font-bold text-[#002f26]"
                 value={newPlan.price} onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})} 
               />
             </div>

             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Original Price (₹)</label>
               <input 
                 type="number" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-[#006e5d] focus:border-[#006e5d] font-bold text-slate-500"
                 value={newPlan.originalPrice} onChange={(e) => setNewPlan({...newPlan, originalPrice: Number(e.target.value)})} 
               />
             </div>

             <div className="flex items-end pb-3">
               <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                    checked={newPlan.isPopular} onChange={(e) => setNewPlan({...newPlan, isPopular: e.target.checked})} 
                  />
                  <span className="text-sm font-bold text-slate-700">Recommended Tier</span>
               </label>
             </div>
           </div>

           <div className="mt-8 flex items-center gap-4">
              <button 
                type="button" 
                onClick={handleAddPlan}
                className="bg-[#006e5d] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#005a4d] transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Schema
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-40 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-b border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tiers</p>
             </div>
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="p-4 pl-6">Plan Name</th>
                    <th className="p-4">Months</th>
                    <th className="p-4">Pricing</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.isPopular ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Crown className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="font-black text-slate-900 group-hover:text-[#006e5d] transition-colors uppercase tracking-wider text-xs">{plan.name}</p>
                              {plan.isPopular && <p className="text-[10px] font-black text-amber-500 uppercase">Recommended</p>}
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-black text-[#002f26] bg-slate-100 px-2 py-1 rounded">
                           {plan.months} MO
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-emerald-600">₹{plan.price}</span>
                           <span className="text-[10px] text-slate-400 line-through">₹{plan.originalPrice}</span>
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                         <button onClick={() => removePlan(index)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          <div className="bg-white p-8 border-b border-slate-200">
             <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Star className="w-5 h-5 text-emerald-500" /> Layer Metadata</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Landing Title</label>
                   <input className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#006e5d] font-bold text-slate-700" value={premiumTitle} onChange={(e) => setPremiumTitle(e.target.value)} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Landing Subtitle</label>
                   <input className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#006e5d] font-bold text-slate-700" value={premiumSubtitle} onChange={(e) => setPremiumSubtitle(e.target.value)} />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                   <ListChecks className="w-4 h-4 text-[#006e5d]" /> Value Proposition Inventory (Features)
                </label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#006e5d] h-32 text-sm font-medium leading-relaxed resize-none" value={premiumFeatures} onChange={(e) => setPremiumFeatures(e.target.value)} />
                <p className="text-[10px] text-slate-400 mt-2 italic font-bold uppercase tracking-widest">* Separate features by providing each entry on a new line</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1">
           <div className="bg-[#002f26] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <Rocket className="w-10 h-10 mb-6 text-amber-400" />
                <h4 className="text-xl font-black tracking-tight uppercase leading-tight mb-4">Synchronize Schema</h4>
                <p className="text-xs font-medium text-slate-400 italic leading-relaxed mb-8">Communicate pricing architectural changes to the global registry node. Clients will update instantaneously.</p>
                
                <button 
                   type="button"
                   onClick={handleSave} disabled={saving}
                   className="w-full py-4 bg-[#006e5d] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#005a4d] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Deploy Configuration</>}
                </button>
              </div>
           </div>
        </div>
      </div>
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </AdminLayout>
  );
}
