import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { Layout } from '../components/Layout';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: Eye,
      title: "Data Collection",
      content: "We collect information you provide directly to us, such as when you create an account, participate in any interactive features of our services, or communicate with us. This include your name, email address, and academic preferences."
    },
    {
      icon: Lock,
      title: "Data Security",
      content: "We use appropriate technical and organizational measures to protect the security of your personal information. However, please remember that no method of transmission over the Internet is 100% secure."
    },
    {
      icon: Shield,
      title: "How We Use Data",
      content: "We use the information we collect to provide, maintain, and improve our services, such as to personalize your experience, provide mock test results, and send you technical notices and support messages."
    }
  ];

  return (
    <Layout>
      <div className="pt-24 pb-24 px-4 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <Shield className="w-3.5 h-3.5" /> Governance
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-[800] text-[#002f26] tracking-tight mb-4">Privacy Framework</h1>
            <p className="text-slate-500 font-medium">Last comprehensive update: May 01, 2026</p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                    <section.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-[800] text-[#002f26] mb-4 tracking-tight uppercase text-xs tracking-[0.2em]">{section.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-10 md:p-16 bg-[#002f26] rounded-[2.5rem] text-white overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-[800] tracking-tight">Your Digital Rights</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "Data Portability", desc: "Request your data in a machine-readable format anytime." },
                    { label: "Right to Erasure", desc: "Permanent account and data deletion upon request." },
                    { label: "Access Control", desc: "Full visibility into what data we store about you." },
                    { label: "Processing Limits", desc: "Opt-out from non-essential data processing." }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-3">
                         <CheckCircle2 className="w-4 h-4 text-teal-400" />
                         <span className="font-bold text-white text-lg tracking-tight">{item.label}</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium pl-7">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="text-center pt-10">
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Questions or concerns?</p>
              <a href="/contact" className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                Connect with Compliance Team <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
