import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Share2, 
  Mail, 
  Instagram, 
  Facebook, 
  Youtube, 
  MapPin, 
  BarChart3, 
  Globe, 
  Lock, 
  HelpCircle,
  Server,
  Zap,
  Layout,
  MousePointer2,
  Send,
  MessageCircle,
  MessageSquare
} from 'lucide-react';

export default function AdminSettings() {
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');
  const [socialDiscord, setSocialDiscord] = useState('');
  const [doubtLink, setDoubtLink] = useState('');
  
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactMapUrl, setContactMapUrl] = useState('');
  const [heroHeading, setHeroHeading] = useState('Master Exams with Confidence.');
  const [heroTagline, setHeroTagline] = useState('Crack exams with smart practice');
  const [aspirantCount, setAspirantCount] = useState('10,000+');
  const [totalTests, setTotalTests] = useState('500+');
  const [examsCovered, setExamsCovered] = useState('25+');
  const [activeUsers, setActiveUsers] = useState('12k+');
  const [successRate, setSuccessRate] = useState('88%');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Use individual try-catch or handle separately if one might fail intentionally
      const payRef = doc(db, 'settings', 'razorpay');
      const genRef = doc(db, 'settings', 'general');
      const smtpRef = doc(db, 'settings', 'smtp');

      const [paySnap, genSnap, smtpSnap] = await Promise.all([
        getDoc(payRef),
        getDoc(genRef),
        getDoc(smtpRef)
      ]);
      
      if (paySnap.exists()) {
        const data = paySnap.data();
        setRazorpayKeyId(data.razorpayKeyId || '');
        setRazorpayKeySecret(data.razorpayKeySecret || '');
      }

      if (genSnap.exists()) {
        const data = genSnap.data();
        setSocialInstagram(data.socialInstagram || '');
        setSocialFacebook(data.socialFacebook || '');
        setSocialYoutube(data.socialYoutube || '');
        setSocialTelegram(data.socialTelegram || '');
        setSocialWhatsapp(data.socialWhatsapp || '');
        setSocialDiscord(data.socialDiscord || '');
        setDoubtLink(data.doubtLink || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setContactAddress(data.contactAddress || '');
        setContactMapUrl(data.contactMapUrl || '');
        setHeroHeading(data.heroHeading || 'Master Exams with Confidence.');
        setHeroTagline(data.heroTagline || 'Crack exams with smart practice');
        setAspirantCount(data.aspirantCount || '10,000+');
        setTotalTests(data.totalTests || '500+');
        setExamsCovered(data.examsCovered || '25+');
        setActiveUsers(data.activeUsers || '12k+');
        setSuccessRate(data.successRate || '88%');
      }

      if (smtpSnap.exists()) {
        const data = smtpSnap.data();
        setSmtpEmail(data.smtpEmail || '');
        setSmtpPassword(data.smtpPassword || '');
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: 'error', text: 'Failed to source cloud preferences. Check console for details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'razorpay'), {
          razorpayKeyId,
          razorpayKeySecret,
          updatedAt: new Date().toISOString()
        }),
        setDoc(doc(db, 'settings', 'general'), {
          socialInstagram,
          socialFacebook,
          socialYoutube,
          socialTelegram,
          socialWhatsapp,
          socialDiscord,
          doubtLink,
          contactEmail,
          contactPhone,
          contactAddress,
          contactMapUrl,
          heroHeading,
          heroTagline,
          aspirantCount,
          totalTests,
          examsCovered,
          activeUsers,
          successRate,
          updatedAt: new Date().toISOString()
        }),
        setDoc(doc(db, 'settings', 'smtp'), {
          smtpEmail,
          smtpPassword,
          updatedAt: new Date().toISOString()
        })
      ]);
      setMessage({ type: 'success', text: 'System configuration globally updated!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Synchronization failed. Check permissions.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="System Configuration">
      <form onSubmit={handleSave} className="max-w-5xl space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Core Infrastructure</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Propagating global settings across PrepNext ecosystem</p>
           </div>
           <div className="flex items-center gap-4">
             {loading && <div className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Sourcing Cloud Prefs...</div>}
             <button 
                type="submit" 
                disabled={saving || loading}
                className="px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> {saving ? 'Indexing...' : 'Commit All Settings'}
              </button>
           </div>
        </header>

        {message && (
          <div className={`p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xl shadow-emerald-100/50' : 'bg-rose-50 text-rose-700 border border-rose-100 shadow-xl shadow-rose-100/50'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
               {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <p className="text-sm font-black uppercase tracking-widest flex-1">{message.text}</p>
            {message.type === 'error' && (
              <button 
                type="button"
                onClick={() => fetchSettings()}
                className="text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                Retry Link
              </button>
            )}
          </div>
        )}

        {loading && !message && (
          <div className="py-32 flex flex-col items-center justify-center space-y-4 opacity-50 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Bridging Cloud Repository...</p>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 items-start transition-opacity duration-300 ${loading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
           <div className="lg:col-span-2 space-y-10">
              {/* General Platform Controls */}
              <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Globe className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Identity & Messaging</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform-wide content descriptors</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Main Heading</label>
                      <input 
                        className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[2xl] outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-slate-700 text-xl shadow-inner mb-4"
                        value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} 
                        placeholder="e.g. Master Exams with Confidence."
                      />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Tagline Statement</label>
                      <input 
                        className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-slate-700 text-lg shadow-inner"
                        value={heroTagline} onChange={(e) => setHeroTagline(e.target.value)} 
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Aspirant Count</label>
                         <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={aspirantCount} onChange={(e) => setAspirantCount(e.target.value)} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Mock Tests</label>
                         <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={totalTests} onChange={(e) => setTotalTests(e.target.value)} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exams Indexed</label>
                         <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={examsCovered} onChange={(e) => setExamsCovered(e.target.value)} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Success Rate</label>
                         <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={successRate} onChange={(e) => setSuccessRate(e.target.value)} />
                      </div>
                   </div>
                </div>
              </section>

              {/* Payment Bridge */}
              <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Revenue Gateway</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Razorpay Secure Bridge Configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway ID</label>
                    <input 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 font-mono text-xs font-bold"
                      value={razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} 
                      placeholder="rzp_live_..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Secret Token</label>
                    <div className="relative">
                       <input 
                        type="password"
                        className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 font-mono text-xs font-bold"
                        value={razorpayKeySecret} onChange={(e) => setRazorpayKeySecret(e.target.value)} 
                        placeholder="••••••••••••••••"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-lg border border-slate-100 transition-hover group-hover:block hidden">
                         <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">PRO TIP: Ensure test mode keys are only used during sandbox cycles. Global production node requires live environment certificates.</p>
                </div>
              </section>

              {/* SMTP Pipeline */}
              <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Server className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Communication Stack</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transactional Email Relay (SMTP)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary SMTP Address</label>
                      <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relay Key/Password</label>
                      <input type="password" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} />
                   </div>
                </div>
              </section>
           </div>

           <aside className="space-y-8">
              {/* Contact Node */}
              <div className="bg-[#0f172a] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="relative space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                           <MapPin className="w-6 h-6 text-secondary" />
                        </div>
                        <h4 className="text-lg font-black font-display tracking-tight">Support Node</h4>
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Public Phone</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold text-slate-300" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Support Core Email</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold text-slate-300" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Physical HQ Address</label>
                           <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all font-bold text-slate-300 h-24 resize-none" value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
                        </div>
                     </div>
                  </div>
              </div>

              {/* Social Sync */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                       <Share2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black font-display tracking-tight text-slate-900">Social Sync</h4>
                 </div>
                 <div className="space-y-4">
                    <div className="relative group/input">
                       <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500/40 group-focus-within/input:text-pink-500 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold text-slate-600 text-xs" placeholder="Instagram URL" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600/40 group-focus-within/input:text-blue-600 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-600 text-xs" placeholder="Facebook URL" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-600/40 group-focus-within/input:text-rose-600 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-600 text-xs" placeholder="YouTube URL" value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400/40 group-focus-within/input:text-blue-400 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-400/20 font-bold text-slate-600 text-xs" placeholder="Telegram URL" value={socialTelegram} onChange={(e) => setSocialTelegram(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/40 group-focus-within/input:text-emerald-500 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-600 text-xs" placeholder="WhatsApp URL" value={socialWhatsapp} onChange={(e) => setSocialWhatsapp(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/40 group-focus-within/input:text-indigo-500 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-600 text-xs" placeholder="Discord URL" value={socialDiscord} onChange={(e) => setSocialDiscord(e.target.value)} />
                    </div>
                    <div className="relative group/input">
                       <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500/40 group-focus-within/input:text-teal-500 transition-colors" />
                       <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 font-bold text-slate-600 text-xs" placeholder="Doubt Clearing URL (WhatsApp/Telegram)" value={doubtLink} onChange={(e) => setDoubtLink(e.target.value)} />
                    </div>
                 </div>
                 <div className="pt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Syncing with Platform Footer</p>
                 </div>
              </div>
           </aside>
        </div>
      </form>
    </AdminLayout>
  );
}
