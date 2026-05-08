import React from 'react';
import { motion } from 'motion/react';
import { Target, Users, BookOpen, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';

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
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="relative mb-24 overflow-hidden rounded-[3rem] bg-[#0f172a] text-white p-8 md:p-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2dd4bf]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full text-[#2dd4bf] text-[10px] font-black uppercase tracking-widest mb-6">
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" /> Established 2024
                </div>
                <h1 className="text-4xl md:text-6xl font-sans font-[800] tracking-tight mb-8 leading-[1.1]">
                  Revolutionizing <br/>
                  <span className="text-teal-400">Competitive Trials</span>
                </h1>
                <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10 max-w-lg">
                  PrepNext is a premier ed-tech ecosystem designed to bridge the gap between traditional learning and modern examination standards.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/signup" className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-xl shadow-teal-900/20">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-4 pt-8">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-4xl font-black text-teal-400 mb-1">50k+</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Students</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-4xl font-black text-teal-400 mb-1">1.2k+</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mocks</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-teal-500 p-8 rounded-3xl shadow-2xl shadow-teal-500/20">
                    <h3 className="text-4xl font-black text-[#0f172a] mb-1">98%</h3>
                    <p className="text-xs font-bold text-[#0f172a]/70 uppercase tracking-widest">Accuracy</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-4xl font-black text-teal-400 mb-1">24/7</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mentorship</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Our Core Philosophy</h2>
              <h3 className="text-4xl font-sans font-[800] text-slate-900 tracking-tight">The PrepNext Foundation</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-2xl mb-8 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-[800] text-slate-900 tracking-tight mb-4">{v.title}</h3>
                    <p className="text-slate-500 leading-relaxed font-medium text-sm">{v.content}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Mission Details */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24">
            <div className="relative">
               <div className="aspect-square bg-slate-200 rounded-[4rem] overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Students" />
               </div>
               <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 hidden md:block">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quality Assurance</p>
                        <p className="text-lg font-bold text-slate-900 tracking-tight">Verified Content</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-sans font-[800] text-slate-900 tracking-tight leading-tight">
                Why we built <span className="text-teal-600">PrepNext?</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                We observed a significant gap in the quality of test series accessible to aspirants. PrepNext was born out of the need for high-fidelity simulations that actually reflect the complexity of real examinations.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time examination environment",
                  "Detailed solution methodology",
                  "Performance benchmarking",
                  "Expert curated subject matter"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
