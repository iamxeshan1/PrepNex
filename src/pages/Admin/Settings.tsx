import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, AlertCircle, CheckCircle2, ShieldCheck, Share2, Mail, Instagram, Facebook, Youtube, MapPin } from 'lucide-react';

export default function AdminSettings() {
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactMapUrl, setContactMapUrl] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('999');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [paySnap, genSnap, smtpSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'razorpay')),
        getDoc(doc(db, 'settings', 'general')),
        getDoc(doc(db, 'settings', 'smtp'))
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
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setContactAddress(data.contactAddress || '');
        setContactMapUrl(data.contactMapUrl || '');
        setPremiumPrice(data.premiumPrice || '999');
      }

      if (smtpSnap.exists()) {
        const data = smtpSnap.data();
        setSmtpEmail(data.smtpEmail || '');
        setSmtpPassword(data.smtpPassword || '');
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
          contactEmail,
          contactPhone,
          contactAddress,
          contactMapUrl,
          premiumPrice,
          updatedAt: new Date().toISOString()
        }),
        setDoc(doc(db, 'settings', 'smtp'), {
          smtpEmail,
          smtpPassword,
          updatedAt: new Date().toISOString()
        })
      ]);
      setMessage({ type: 'success', text: 'All settings updated successfully!' });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'Failed to save settings. Check permissions.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="System Settings"><div className="p-8 text-center">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout title="System Settings">
      <form onSubmit={handleSave} className="max-w-4xl space-y-8 pb-20">
        {/* Payment Settings */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-primary tracking-tight">Payment Configuration</h3>
              <p className="text-slate-500 text-sm">Manage your Razorpay API credentials safely.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Razorpay Key ID</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                value={razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} 
                placeholder="rzp_test_..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Razorpay Key Secret</label>
              <input 
                type="password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                value={razorpayKeySecret} onChange={(e) => setRazorpayKeySecret(e.target.value)} 
                placeholder="••••••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-primary tracking-tight">Social Presence</h3>
              <p className="text-slate-500 text-sm">Update your social media links for the footer.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500" /> Instagram URL</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} 
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook URL</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} 
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-600" /> YouTube URL</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-600 text-sm"
                value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)} 
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-primary tracking-tight">Email & System Configuration</h3>
              <p className="text-slate-500 text-sm">Configure SMTP details for sending emails and basic site info.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">SMTP Email (User)</label>
              <input 
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} 
                placeholder="prepnexedtech@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">SMTP App Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} 
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Support Email (Contact Page)</label>
              <input 
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} 
                placeholder="support@prepnex.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Premium Pass Price (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} 
                placeholder="999"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} 
                placeholder="+91 9876543210"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Office Address</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm min-h-[80px]"
                value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} 
                placeholder="Plot No. 123, Sector 5..."
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Google Maps Embed URL</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                value={contactMapUrl} onChange={(e) => setContactMapUrl(e.target.value)} 
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-[10px] text-slate-400 font-medium italic">Paste the 'src' value from the Google Maps iframe embed code.</p>
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
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-primary/40 uppercase tracking-widest font-logo"
          >
            {saving ? 'Updating System...' : <><Save className="w-6 h-6" /> Save All Settings</>}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
