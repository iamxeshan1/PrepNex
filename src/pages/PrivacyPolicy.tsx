import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ChevronRight } from 'lucide-react';
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
    <div className="pt-24 pb-20 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <Lock className="w-3.5 h-3.5" /> Privacy & Trust
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium">Last updated: April 30, 2026</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <section.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">{section.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="p-12 bg-primary rounded-[2.5rem] text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 tracking-tight">Your Rights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Right to access your data",
                  "Right to data portability",
                  "Right to be forgotten",
                  "Right to restrict processing"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ChevronRight className="w-4 h-4 text-blue-300" />
                    <span className="font-bold opacity-90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <footer className="text-center pt-8">
            <p className="text-slate-400 text-sm font-medium">
              Questions about our privacy policy? <a href="/contact" className="text-primary font-bold hover:underline">Contact us</a>
            </p>
          </footer>
        </div>
      </div>
    </div>
    </Layout>
  );
}
