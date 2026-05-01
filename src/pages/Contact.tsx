import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';

export default function Contact() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) setSettings(snap.data());
      setLoading(false);
    };
    fetchSettings();
  }, []);

  return (
    <Layout>
    <div className="pt-24 pb-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/5 rounded-full text-secondary text-[10px] font-black uppercase tracking-widest mb-6">
            <MessageSquare className="w-3.5 h-3.5" /> Reach Out
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight mb-4">Contact Us</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            Have questions about PrepNex? We're here to help you on your educational journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <h2 className="text-3xl font-black text-primary tracking-tight mb-4">Get in touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email us</p>
                    <p className="text-lg font-bold text-primary">{settings?.contactEmail || 'support@prepnex.com'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-14 h-14 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Call us</p>
                    <p className="text-lg font-bold text-primary">{settings?.contactPhone || '+91 0000 000 000'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visit us</p>
                    <p className="text-lg font-bold text-primary max-w-xs">{settings?.contactAddress || 'PrepNex Headquarters, New Delhi'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-black uppercase tracking-tight">Working Hours</h3>
              </div>
              <div className="space-y-2 opacity-80 font-medium">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 2:00 PM</p>
                <p className="text-amber-400 text-sm italic mt-2">Closed on Sundays & Public Holidays</p>
              </div>
            </div>
          </div>

          {/* Map / Message Side */}
          <div className="h-full min-h-[500px]">
            {settings?.contactMapUrl ? (
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                <iframe 
                  src={settings.contactMapUrl}
                  className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-[2.5rem] bg-white p-12 border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Send className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-2">Message Us</h3>
                <p className="text-slate-400 font-medium mb-8">We usually respond within 24 hours.</p>
                <div className="w-full max-w-sm space-y-4">
                  <input type="text" placeholder="Your Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium" />
                  <textarea placeholder="Your Message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium min-h-[120px]" />
                  <button className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">Send Message</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}
