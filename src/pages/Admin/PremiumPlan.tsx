import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2, Crown, Zap, Clock, ListChecks } from 'lucide-react';

export default function PremiumPlanManagement() {
  const [premiumPrice, setPremiumPrice] = useState('599');
  const [premiumOriginalPrice, setPremiumOriginalPrice] = useState('1499');
  const [premiumTitle, setPremiumTitle] = useState('Unlimited 1-Year Pass');
  const [premiumSubtitle, setPremiumSubtitle] = useState('Special Launch Offer • 60% OFF');
  const [premiumValidity, setPremiumValidity] = useState('365 Days');
  const [premiumFeatures, setPremiumFeatures] = useState([
    "Unlimited access to 500+ Mock Tests",
    "All Exam Categories (JKSSB, UPSC, SSC, etc.)",
    "Advanced Performance Analytics",
    "Premium 24/7 Priority Helpdesk",
    "Ad-free focused exam environment"
  ].join('\n'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

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
          "All Exam Categories (JKSSB, UPSC, SSC, etc.)",
          "Advanced Performance Analytics",
          "Premium 24/7 Priority Helpdesk",
          "Ad-free focused exam environment"
        ].join('\n'));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // Get existing settings to avoid overwriting other fields
      const genSnap = await getDoc(doc(db, 'settings', 'general'));
      const existingData = genSnap.exists() ? genSnap.data() : {};

      await setDoc(doc(db, 'settings', 'general'), {
        ...existingData,
        premiumPrice,
        premiumOriginalPrice,
        premiumTitle,
        premiumSubtitle,
        premiumValidity,
        premiumFeatures,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Premium plan updated successfully!' });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'Failed to save settings. Check permissions.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Premium Plan Management"><div className="p-8 text-center">Loading plan details...</div></AdminLayout>;

  return (
    <AdminLayout title="Premium Plan Management">
      <form onSubmit={handleSave} className="max-w-4xl space-y-8 pb-20">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-primary tracking-tight">Access Plan Details</h3>
              <p className="text-slate-500 text-sm">Configure the main premium subscription plan available to all users.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-400" /> Plan Title
              </label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumTitle} onChange={(e) => setPremiumTitle(e.target.value)} 
                placeholder="Unlimited 1-Year Pass"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Subtitle / Offer Text
              </label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumSubtitle} onChange={(e) => setPremiumSubtitle(e.target.value)} 
                placeholder="Special Launch Offer • 60% OFF"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sale Price (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Original Price (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumOriginalPrice} onChange={(e) => setPremiumOriginalPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Validity Period
              </label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumValidity} onChange={(e) => setPremiumValidity(e.target.value)} 
                placeholder="365 Days"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-green-500" /> Premium Features (One per line)
              </label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm min-h-[150px]"
                value={premiumFeatures} onChange={(e) => setPremiumFeatures(e.target.value)} 
                placeholder="Unlimited access to tests...&#10;Advanced analytics..."
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <div className="sticky bottom-8 left-0 right-0">
          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-primary/40 uppercase tracking-widest"
          >
            {saving ? 'Updating Plan...' : <><Save className="w-6 h-6" /> Save Premium Plan</>}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
