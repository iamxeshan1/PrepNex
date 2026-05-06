import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  ArrowRight, 
  Shield, 
  BookOpen, 
  Search, 
  CheckCircle, 
  Clock, 
  Zap, 
  Play, 
  Star,
  Users,
  Compass,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, onSnapshot, limit } from 'firebase/firestore';

const tabs = ['All', 'JKSSB', 'JKPSC', 'UPSC', 'NEET', 'IBPS'];

const subjects = [
  { name: 'J&K History', count: '3,200+ Questions', icon: Compass, color: 'bg-emerald-50 text-emerald-500' },
  { name: 'Quant Aptitude', count: '1,500+ Practice Sets', icon: LayoutGrid, color: 'bg-amber-50 text-amber-500' },
  { name: 'General Science', count: 'Concept Maps & PDFs', icon: BookOpen, color: 'bg-blue-50 text-blue-500' },
  { name: 'English Grammar', count: '2,000+ Practice MCQs', icon: FileText, color: 'bg-teal-50 text-teal-500' },
  { name: 'Current Affairs', count: 'Daily & Monthly Sets', icon: Zap, color: 'bg-orange-50 text-orange-500' },
  { name: 'Computer Apps', count: 'Focus on JKSSB', icon: Shield, color: 'bg-indigo-50 text-indigo-500' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('All');
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const agencySnapshot = await getDocs(collection(db, 'agencies'));
        setAgencies([{ name: 'All', id: 'All' }, ...agencySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const unsubLive = onSnapshot(collection(db, 'liveTests'), (snap) => {
        setLiveClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchData();
    return () => unsubLive();
  }, []);

  const filteredExams = activeTab === 'All' 
    ? exams 
    : exams.filter(exam => exam.agencyId === activeTab);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-white pt-16 pb-24 overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-[#ccfbf1] text-[#0f766e] px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8"
          >
            <Zap className="w-3 h-3 fill-[#0f766e]" /> J&K's Trusted Learning Partner
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-sans font-[800] text-[#0f172a] mb-8 tracking-tighter max-w-4xl mx-auto leading-[1.15]"
          >
            Master Exams with <span className="text-[#008770]">Confidence.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed tracking-tight"
          >
            Get J&K's most comprehensive mock tests and AI-driven performance insights.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link to="/signup" className="w-full sm:w-auto bg-[#006e5d] text-white px-12 py-4.5 rounded-xl font-black text-sm hover:bg-[#005a4d] transition-all shadow-xl shadow-[#008770]/20 active:scale-95 uppercase tracking-widest">
              Start Free Trial
            </Link>
            <Link to="/exams" className="w-full sm:w-auto bg-white text-slate-800 border-2 border-slate-200 px-12 py-4.5 rounded-xl font-black text-sm hover:border-slate-300 transition-all active:scale-95 uppercase tracking-widest">
              Browse Exams
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mock Test Series Section */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl font-sans font-[800] text-[#0f172a] mb-4 tracking-tighter">Top Rated Mock Test Series</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <p className="text-slate-500 font-medium max-w-xl tracking-tight">Curated by subject matter experts following the latest JKSSB and JKPSC patterns.</p>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {agencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => setActiveTab(agency.id)}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${
                      activeTab === agency.id 
                        ? 'bg-[#006e5d] text-white shadow-lg shadow-[#008770]/20' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {agency.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse" />)
            ) : filteredExams.map((exam) => {
                const agency = agencies.find(a => a.id === exam.agencyId);
                const logo = agency?.logoUrl || exam.logoUrl;
                return (
                  <motion.div 
                    key={exam.id}
                    whileHover={{ y: -8 }}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#008770]/20 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 group-hover:bg-teal-50 transition-colors shadow-sm shrink-0">
                             {logo ? (
                                <img src={logo} alt="" className="w-full h-full object-contain" />
                             ) : (
                                <Shield className="w-6 h-6 text-slate-300 group-hover:text-[#008770] transition-colors" />
                             )}
                          </div>
                          <h3 className="text-lg font-sans font-[800] text-[#0f172a] group-hover:text-[#008770] transition-colors tracking-tighter line-clamp-1">{exam.name}</h3>
                       </div>
                       {exam.isPopular && (
                         <span className="bg-[#b91c1c] text-white text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase shrink-0">MOST POPULAR</span>
                       )}
                       {exam.isNew && (
                         <span className="bg-[#ccfbf1] text-[#0f766e] text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase shrink-0">NEW BATCH</span>
                       )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6 text-slate-400">
                       <div className="flex items-center gap-1.5 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] text-slate-500 whitespace-nowrap font-bold">{exam.mockCount || 0} Mocks</span>
                       </div>
                       <div className="flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] text-slate-500 whitespace-nowrap font-bold">{exam.enrollCount || 0} Enrolled</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">{exam.isPaid ? 'PREMIUM' : 'FREE TRIAL'}</span>
                      <button className="text-[10px] font-black text-[#008770] tracking-[0.05em] uppercase hover:underline transition-all">
                        {exam.isPaid ? 'ENROLL NOW' : 'TRY FREE'}
                      </button>
                    </div>
                  </motion.div>
                )
            })}
          </div>

          <div className="text-center">
            <Link to="/exams" className="inline-flex items-center gap-3 bg-white border border-slate-200 text-[#0f172a] px-10 py-3.5 rounded-xl font-[700] text-sm hover:border-slate-300 transition-all group">
              View All Exams <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Individual Subject Mastery / Live Now Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Left Side: Subject Mastery */}
              <div className="lg:col-span-7">
                <div className="mb-12 text-center md:text-left">
                  <h2 className="text-4xl font-sans font-[800] text-[#0f172a] mb-4 tracking-tighter">Individual Subject Mastery</h2>
                  <p className="text-slate-500 font-medium tracking-tight">Focus on your weaknesses with targeted modules.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {subjects.map((sub) => (
                    <div key={sub.name} className="flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-[1.5rem] hover:shadow-xl transition-all cursor-pointer group shadow-sm">
                      <div className={`w-14 h-14 ${sub.color} rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <sub.icon className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-sans font-[800] text-[#0f172a] mb-2 tracking-tight">{sub.name}</h4>
                      <p className="text-[11px] font-medium text-slate-400">{sub.count}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 text-center md:text-left">
                   <button className="px-8 py-3 bg-white border border-slate-200 text-[#0f172a] rounded-full text-xs font-[700] tracking-tight hover:border-slate-400 transition-all">
                      VIEW ALL SUBJECTS
                   </button>
                </div>
              </div>

              {/* Right Side: Live Now Sidebar */}
              <div className="lg:col-span-5">
                 <div className="bg-[#0f172a] rounded-[3rem] p-10 sticky top-28 border border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-2xl font-sans font-[800] text-white tracking-tight">Live Now</h3>
                       <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-4 py-1.5 rounded-full border border-red-500/20">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
                       </div>
                    </div>

                    <div className="space-y-6 mb-10">
                       {[
                         { subject: 'QUANTITATIVE APTITUDE', title: 'Advanced Trigonometry for JKPSC', teacher: 'Prof. Sameer Ahmed', watching: '840 Watching' },
                         { subject: 'CURRENT AFFAIRS', title: 'J&K Weekly Roundup - June 1st Week', teacher: 'By Dr. Zoya Mir', watching: '1.2k Watching' },
                       ].map((live, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition-colors cursor-pointer group">
                            <span className="text-[9px] font-black text-[#2dd4bf] mb-2 block tracking-[0.2em] uppercase">{live.subject}</span>
                            <h4 className="text-lg font-bold text-white mb-6 line-clamp-1 group-hover:text-[#2dd4bf] transition-colors">{live.title}</h4>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                                     <img src={`https://ui-avatars.com/api/?name=${live.teacher}&background=random`} alt="" />
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-bold text-slate-300 mb-0.5">{live.teacher}</p>
                                     <p className="text-[10px] font-bold text-[#2dd4bf]">{live.watching}</p>
                                  </div>
                               </div>
                               <button className="bg-[#2dd4bf] text-[#0f172a] px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-[#5eead4] transition-colors uppercase tracking-widest">JOIN CLASS</button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <button className="w-full py-4.5 border border-white/10 text-white rounded-2xl text-[10px] font-black hover:bg-white/5 transition-all mb-8 uppercase tracking-[0.2em]">
                       VIEW FULL SCHEDULE
                    </button>

                    <div className="bg-[#5eead4]/10 rounded-2xl p-6 border border-[#5eead4]/20 flex items-center gap-5">
                       <div className="w-14 h-14 bg-[#5eead4] rounded-2xl flex items-center justify-center text-[#0f172a]">
                          <Zap className="w-7 h-7 fill-current" />
                       </div>
                       <div>
                          <h5 className="text-white font-sans font-bold text-sm mb-1 uppercase tracking-widest">GO PRO</h5>
                          <p className="text-[#5eead4]/70 text-[10px] font-bold uppercase tracking-wider">Unlock all premium live sessions.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="flex items-start gap-10">
                 <div className="w-16 h-16 bg-[#ccfbf1] rounded-[1.5rem] flex items-center justify-center text-[#008770] shrink-0 transform hover:rotate-6 transition-transform">
                    <Zap className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-sans font-[800] text-[#0f172a] mb-3 tracking-tight">AI-Powered Analysis</h3>
                    <p className="text-slate-500 text-sm font-medium leading-[1.8] max-w-sm tracking-tight">Get personalized insights into your performance bottlenecks and time-management skills.</p>
                 </div>
              </div>
              <div className="flex items-start gap-10">
                 <div className="w-16 h-16 bg-[#ccfbf1] rounded-[1.5rem] flex items-center justify-center text-[#008770] shrink-0 transform hover:-rotate-6 transition-transform">
                    <Shield className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-sans font-[800] text-[#0f172a] mb-3 tracking-tight">Regional Authority</h3>
                    <p className="text-slate-500 text-sm font-medium leading-[1.8] max-w-sm tracking-tight">Exclusively designed for J&K state exams with local context and updated current affairs.</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Ready Section */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="bg-slate-50 rounded-[3.5rem] p-10 md:p-24 relative overflow-hidden border border-slate-100">
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                     <h2 className="text-5xl md:text-6xl font-sans font-[800] text-[#0f172a] mb-8 tracking-tighter leading-none">Ready to Ace Your Exams?</h2>
                     <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md tracking-tight">Join thousands of successful candidates who started their journey with PrepNext.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:justify-end">
                     <button className="w-full sm:w-auto bg-[#006e5d] text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-[#005a4d] transition-all shadow-xl shadow-[#008770]/20 active:scale-95 uppercase tracking-widest">
                        Claim Your Free Mock
                     </button>
                     <button className="w-full sm:w-auto bg-[#1e293b] text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-[#0f172a] transition-all active:scale-95 uppercase tracking-widest">
                        Talk to Mentor
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#0f172a] py-24 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
               <div className="py-8 md:py-0">
                  <h3 className="text-6xl font-sans font-[800] text-white mb-2 tracking-tighter">50k+</h3>
                  <p className="text-[#2dd4bf] font-black text-xs uppercase tracking-[0.4em]">Aspirants Enrolled</p>
               </div>
               <div className="py-8 md:py-0">
                  <h3 className="text-6xl font-sans font-[800] text-white mb-2 tracking-tighter">1.2k+</h3>
                  <p className="text-[#2dd4bf] font-black text-xs uppercase tracking-[0.4em]">Full Mock Tests</p>
               </div>
               <div className="py-8 md:py-0">
                  <h3 className="text-6xl font-sans font-[800] text-white mb-2 tracking-tighter">98%</h3>
                  <p className="text-[#2dd4bf] font-black text-xs uppercase tracking-[0.4em]">Success Rate</p>
               </div>
            </div>
         </div>
      </section>
    </Layout>
  );
}
