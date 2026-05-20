import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Megaphone, 
  Save, 
  Eye, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Toast, { ToastType } from '../../components/Toast';

interface AnnouncementData {
  title: string;
  description: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  updatedAt?: string;
}

export default function PopupAnnouncement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Toast
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docRef = doc(db, 'settings', 'popup_announcement');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AnnouncementData;
          setTitle(data.title || '');
          setDescription(data.description || '');
          setImageUrl(data.imageUrl || '');
          setButtonText(data.buttonText || '');
          setButtonUrl(data.buttonUrl || '');
          setIsActive(data.isActive || false);
        }
      } catch (error) {
        console.error("Error fetching popup announcement:", error);
        setToast({
          isVisible: true,
          message: "Failed to fetch announcement settings.",
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'popup_announcement');
      await setDoc(docRef, {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        buttonText: buttonText.trim(),
        buttonUrl: buttonUrl.trim(),
        isActive,
        updatedAt: new Date().toISOString()
      });

      setToast({
        isVisible: true,
        message: 'Popup announcement configured and saved successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error("Error saving announcement settings:", error);
      setToast({
        isVisible: true,
        message: 'Failed to deploy announcement settings.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Popup Announcement Dashboard">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header Breadcrumb Banner */}
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden mb-8 border border-slate-800">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Megaphone className="w-3.5 h-3.5" /> Broadcast Module
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Popup Announcement Manager</h1>
            <p className="text-slate-400 font-medium text-xs md:text-sm max-w-xl leading-relaxed">
              Configure and push highly visible announcement popups on the homepage of your application to communicate system updates, promo discounts, or urgent announcements.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006e5d] mb-4" />
            <p className="text-slate-500 font-bold text-xs tracking-wider uppercase">Syncing Announcement Config...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Form Side */}
            <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#006e5d]" /> Edit Announcement Content
                </h2>
                
                {/* Status Toggle Badge */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-xs font-black uppercase tracking-wider text-slate-700">
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  Announcement Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MEGA OFFERS ! All-Access Prep Pass at 60% OFF"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e5d] transition-all"
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  Announcement Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide precise details of the announcement here. Keep it snappy and engaging."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e5d] transition-all resize-none"
                />
              </div>

              {/* Optional Cover Image link */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Cover Image URL <span className="text-slate-400 font-semibold">(Optional)</span>
                </label>
                <input 
                  type="url" 
                  placeholder="e.g. https://images.unsplash.com/... or relative path"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e5d] transition-all"
                />
              </div>

              {/* Action Button Option Group */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                  <LinkIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Action Button CTA (Optional)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Button Text
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Claim Offer Now"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#006e5d] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Redirect URL
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. /premium or https://..."
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#006e5d] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-[#006e5d] hover:bg-[#005c4e] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving Settings...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Deploy Announcement Settings
                  </>
                )}
              </button>
            </form>

            {/* Live Preview Side */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Interactive Component Mockup Preview</h2>
              </div>

              {/* Main Preview Block */}
              <div className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-6 md:p-10 flex items-center justify-center relative min-h-[440px] select-none">
                
                {isActive ? (
                  <div className="bg-white rounded-2xl max-w-[380px] w-full overflow-hidden shadow-2xl border border-slate-100 relative">
                    {/* Top banner close button (mock) */}
                    <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-slate-900/5 hover:bg-slate-900/10 rounded-full flex items-center justify-center cursor-pointer transition-colors text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </div>

                    {/* Image Cover Preview */}
                    {imageUrl ? (
                      <div className="w-full aspect-[16/9] bg-slate-100 overflow-hidden relative">
                        <img 
                          src={imageUrl} 
                          alt="Unsplash" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            // Suppress broken image errors visually to present fallback representation
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-3 left-4">
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                            <Sparkles className="w-2.5 h-2.5" /> ANNOUNCEMENT
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full p-4 bg-gradient-to-r from-[#006e5d] to-[#044a3f] text-white">
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 shadow mb-1">
                          <Sparkles className="w-2.5 h-2.5 animate-pulse" /> BROADCAST BROAD
                        </span>
                        <h4 className="text-xs font-[800] tracking-tight text-teal-100 leading-none">Premium Alert Notification</h4>
                      </div>
                    )}

                    {/* Content Section Preview */}
                    <div className="p-6">
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug mb-2">
                        {title || 'Example Title: Dynamic Announcement Title'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6 whitespace-pre-line">
                        {description || 'Example descriptive text. This demonstrates the line coverage and general typographical formatting that standard browser visits will layout.'}
                      </p>

                      {/* CTA button or details mockup */}
                      <div className="space-y-2">
                        {buttonText && (
                          <div className="w-full py-2.5 bg-[#006e5d] hover:bg-[#005a4d] text-white font-black text-xs uppercase tracking-widest rounded-xl text-center cursor-pointer shadow-sm">
                            {buttonText}
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-wider py-1 cursor-pointer hover:text-slate-600">
                          Cancel / Maybe Later
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Popup Broadcast Suspended</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mt-1 font-semibold">
                      Enable the status toggle above to preview and activate the dynamic popups logic for homepage visits.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        <Toast 
          isVisible={toast.isVisible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </AdminLayout>
  );
}
