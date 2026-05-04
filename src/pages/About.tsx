import React from 'react';
import { motion } from 'motion/react';
import { Target, Users, BookOpen, Award } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Logo } from '../components/Logo';

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      content: "To democratize high-quality education and provide every aspirant with the tools they need to succeed in their dream exams."
    },
    {
      icon: Users,
      title: "Our Community",
      content: "We believe in the power of peer learning and expert guidance. Our platform brings together top educators and serious aspirants."
    },
    {
      icon: BookOpen,
      title: "Our Approach",
      content: "Data-driven preparation. We don't just provide mock tests; we provide detailed analytics to help you identify and improve your weak areas."
    },
    {
      icon: Award,
      title: "Our Guarantee",
      content: "Only the highest quality content makes it to our platform. Every question is vetted by subject matter experts."
    }
  ];

  return (
    <Layout>
      <div className="pt-24 pb-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <Users className="w-3.5 h-3.5" /> Who we are
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-6 flex flex-col md:flex-row items-center justify-center gap-3">
              Empowering <Logo className="text-4xl md:text-5xl" />
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto flex flex-col items-center gap-2">
              <Logo className="text-xl inline-flex" /> was founded with a single mission: to revolutionize how students prepare for competitive exams. We combine cutting-edge technology with expert-curated content.
            </p>
          </motion.div>

          {/* Stats/Highlight */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-primary text-white rounded-[3rem] p-12 md:p-16 mb-20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <h3 className="text-4xl md:text-5xl font-black mb-2">500+</h3>
                <p className="text-white/80 font-bold uppercase tracking-wider text-sm">Mock Tests</p>
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black mb-2">10k+</h3>
                <p className="text-white/80 font-bold uppercase tracking-wider text-sm">Active Aspirants</p>
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black mb-2">98%</h3>
                <p className="text-white/80 font-bold uppercase tracking-wider text-sm">Success Rate</p>
              </div>
            </div>
          </motion.div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm"
                >
                  <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-2xl mb-6 text-primary">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4">{v.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">{v.content}</p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </Layout>
  );
}
