import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Clock, Send, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';

export default function Contact() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) setSettings(snap.data());
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <Layout>
      <div className="pt-24 pb-24 px-4 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full text-teal-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <MessageSquare className="w-3.5 h-3.5" /> Support Console
            </div>
            <h1 className="text-4xl md:text-6xl font-sans font-[800] text-slate-900 tracking-tight mb-4">How can we help?</h1>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">
              Whether you need technical support or have questions about our premium plans, our team is ready to assist.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Info Column */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-2xl font-black mb-10 tracking-tight relative z-10">Direct Channels</h3>
                
                <div className="space-y-8 relative z-10">
                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Support</p>
                      <p className="text-lg font-bold text-white">{settings?.contactEmail || 'support@prepnext.in'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Voice Helpline</p>
                      <p className="text-lg font-bold text-white">{settings?.contactPhone || '+91 7006 XXX XXX'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                      <p className="text-lg font-bold text-white max-w-xs">{settings?.contactAddress || 'Digital Hub, New Delhi, India'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Response Window</h4>
                  </div>
                  <div className="space-y-2 text-sm font-medium text-slate-300">
                    <p>Weekdays: 09:00 AM — 08:00 PM</p>
                    <p>Saturdays: 10:00 AM — 04:00 PM</p>
                    <p className="text-teal-400/60 mt-4 text-xs italic">Emergency tickets are processed 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-sm">
                {submitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-[800] text-slate-900 mb-4 tracking-tight">Message Received!</h3>
                    <p className="text-slate-500 font-medium">We've logged your request. Our team will get back to you shortly.</p>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="mt-8 text-teal-600 font-black text-xs uppercase tracking-widest hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 font-bold text-slate-600 transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Email Address</label>
                        <input 
                          required
                          type="email" 
                          placeholder="john@example.com" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 font-bold text-slate-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Inquiry Subject</label>
                      <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 font-bold text-slate-600 transition-all appearance-none cursor-pointer">
                        <option>General Support</option>
                        <option>Premium Billing</option>
                        <option>Technical Issue</option>
                        <option>Content Feedback</option>
                        <option>Partnership Inquiry</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Your Message</label>
                      <textarea 
                        required
                        rows={6}
                        placeholder="How can we assist you today?" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 font-bold text-slate-600 transition-all resize-none"
                      />
                    </div>

                    <button className="w-full bg-[#0f172a] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200">
                      Transmit Message <Send className="w-4 h-4" />
                    </button>
                    
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       Secure Encryption Protocols Enabled
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
