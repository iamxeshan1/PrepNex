import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Clock } from 'lucide-react';
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

        <div className="flex justify-center">
          {/* Info Side */}
          <div className="w-full max-w-2xl space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <h2 className="text-3xl font-black text-primary tracking-tight mb-4">Contact Support</h2>
              
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
        </div>
      </div>
    </div>
    </Layout>
  );
}
