import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Quote,
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
  FileText,
  CheckCircle2,
  Calculator,
  Brain,
  Globe,
  Microscope,
  History,
  Map,
  Cpu,
  Palette,
  Atom,
  MessageSquare,
  Languages,
  FlaskConical,
  Dna,
  Binary,
  Code,
  Music,
  HeartPulse,
  Scale,
  Briefcase,
  Church,
  Sigma,
  Gamepad2,
  Brush,
  Variable,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, onSnapshot, limit, orderBy, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ICON_MAP: Record<string, any> = {
  Brain,
  Calculator,
  Globe,
  Microscope,
  History,
  Map,
  Cpu,
  FileText,
  Palette,
  BookOpen,
  Atom,
  Search,
  MessageSquare,
  Compass,
  LayoutGrid,
  Languages,
  FlaskConical,
  Dna,
  Binary,
  Code,
  Music,
  HeartPulse,
  Scale,
  Briefcase,
  Church,
  Sigma,
  Zap,
  Gamepad2,
  Brush,
  Variable
};

const COLOR_VARIANTS = [
  'bg-emerald-50 text-emerald-500',
  'bg-amber-50 text-amber-500',
  'bg-blue-50 text-blue-500',
  'bg-teal-50 text-teal-500',
  'bg-orange-50 text-orange-500',
  'bg-teal-50 text-teal-500',
  'bg-rose-50 text-rose-500',
  'bg-purple-50 text-purple-500',
];

const tabs = ['All', 'UPSC', 'SSC', 'NEET', 'JEE', 'IBPS', 'GATE'];

export default function Home() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [realSubjects, setRealSubjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [latestThought, setLatestThought] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        
        const agencySnapshot = await getDocs(collection(db, 'agencies'));
        const testsSnapshot = await getDocs(collection(db, 'tests'));
        const testsData = testsSnapshot.docs.map(doc => doc.data());
        const tCounts = {};
        testsData.forEach(t => {
          if (t.examId) tCounts[t.examId] = (tCounts[t.examId] || 0) + 1;
        });
        
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, mockCount: tCounts[doc.id] || doc.data().mockCount || 0, ...doc.data() })));
        setAgencies([{ name: 'All', id: 'All' }, ...agencySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubLive = onSnapshot(collection(db, 'liveTests'), (snap) => {
        setLiveClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
        const fetchedSubjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt desc on client
        fetchedSubjects.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setRealSubjects(fetchedSubjects.slice(0, 6));
    });

    const unsubThought = onSnapshot(query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'), limit(1)), (snap) => {
      if (!snap.empty) setLatestThought({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    fetchData();
    return () => {
      unsubLive();
      unsubSubjects();
      unsubSettings();
      unsubThought();
    };
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
            <Zap className="w-3 h-3 fill-[#0f766e]" /> The Trusted Learning Partner
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-sans font-[800] text-slate-900 mb-8 tracking-tighter max-w-4xl mx-auto leading-[1.15]"
          >
            {settings.heroHeading ? (
              settings.heroHeading.includes('|') ? (
                <>
                  {settings.heroHeading.split('|')[0]} <span className="text-slate-900">{settings.heroHeading.split('|')[1]}</span>
                </>
              ) : (
                settings.heroHeading
              )
            ) : (
              <>Master Exams with <span className="text-slate-900">Confidence.</span></>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed tracking-tight"
          >
            {settings.heroTagline || "Get the most comprehensive mock tests and AI-driven performance insights."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link to="/signup" className="w-full sm:w-auto bg-[#006e5d] text-white px-12 py-4.5 rounded-xl font-black text-sm hover:bg-[#005a4d] transition-all shadow-xl shadow-[#002f26]/20 active:scale-95 uppercase tracking-widest">
              Start Free Trial
            </Link>
            <Link to="/exams" className="w-full sm:w-auto bg-white text-[#001f19] border-2 border-slate-200 px-12 py-4.5 rounded-xl font-black text-sm hover:border-slate-300 transition-all active:scale-95 uppercase tracking-widest">
              Browse Exams
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mock Test Series Section */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl font-sans font-[800] text-slate-900 mb-4 tracking-tighter">Top Rated Mock Test Series</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <p className="text-slate-500 font-medium max-w-xl tracking-tight">Curated by subject matter experts following the latest examination patterns.</p>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {agencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => setActiveTab(agency.id)}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${
                      activeTab === agency.id 
                        ? 'bg-[#006e5d] text-white shadow-lg shadow-[#002f26]/20' 
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
                const isEnrolled = profile?.isPremium || profile?.purchasedExams?.includes(exam.id) || profile?.freeExams?.includes(exam.id) || false;
                return (
                  <motion.div 
                    key={exam.id}
                    whileHover={{ y: -8 }}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#002f26]/20 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 group-hover:bg-teal-50 transition-colors shadow-sm shrink-0">
                             {logo ? (
                                <img src={logo} alt="" loading="lazy" decoding="async" width="48" height="48" className="w-full h-full object-contain" />
                             ) : (
                                <Shield className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
                             )}
                          </div>
                          <h3 className="text-lg font-sans font-[800] text-slate-900 group-hover:text-slate-900 transition-colors tracking-tighter line-clamp-1">{exam.name}</h3>
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
                      {isEnrolled ? (
                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-700 tracking-[0.05em] uppercase">
                           <CheckCircle2 className="w-3.5 h-3.5" /> ENROLLED
                        </div>
                      ) : (
                        <button className="text-[10px] font-black text-slate-900 tracking-[0.05em] uppercase hover:underline transition-all">
                          {exam.isPaid ? 'ENROLL NOW' : 'TRY FREE'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
            })}
          </div>

          <div className="text-center">
            <Link to="/exams" className="inline-flex items-center gap-3 bg-white border border-slate-200 text-slate-900 px-10 py-3.5 rounded-xl font-[700] text-sm hover:border-slate-300 transition-all group">
              View All Exams <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Thought of the Day Section */}
      {latestThought && (
        <section className="py-16 bg-white border-y border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
            <Quote className="w-64 h-64 -ml-20 -mt-20 transform -rotate-12" />
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-500 shadow-sm border border-teal-100">
                <Quote className="w-6 h-6 fill-current" />
              </div>
              <p className="text-xl md:text-2xl font-sans font-[600] text-slate-700 italic leading-relaxed tracking-tight max-w-2xl px-4">
                "{latestThought.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-8 bg-slate-200" />
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] font-sans">
                  {latestThought.author || 'PrepNext Daily Inspiration'}
                </span>
                <div className="h-[1px] w-8 bg-slate-200" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Individual Subject Mastery / Live Now Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Left Side: Subject Mastery */}
              <div className="lg:col-span-7">
                <div className="mb-12 text-center md:text-left">
                  <h2 className="text-4xl font-sans font-[800] text-slate-900 mb-4 tracking-tighter">Individual Subject Mastery</h2>
                  <p className="text-slate-500 font-medium tracking-tight">Focus on your weaknesses with targeted modules.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[1.5rem] animate-pulse" />)
                  ) : realSubjects.map((sub, idx) => {
                    const IconComp = ICON_MAP[sub.icon] || BookOpen;
                    const colorClass = COLOR_VARIANTS[idx % COLOR_VARIANTS.length];
                    return (
                      <div 
                        key={sub.id} 
                        onClick={() => navigate(`/subject-tests/${sub.id}`)}
                        className="flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-[1.5rem] hover:shadow-xl transition-all cursor-pointer group shadow-sm"
                      >
                        <div className={`w-14 h-14 ${colorClass} rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                          <IconComp className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-sans font-[800] text-slate-900 mb-2 tracking-tight">{sub.name}</h4>
                        <p className="text-[11px] font-medium text-slate-400 line-clamp-2">
                          {sub.description || 'Master the concepts and shortcuts.'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-12 text-center md:text-left">
                   <button 
                    onClick={() => navigate('/subjects')}
                    className="inline-block px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-full text-xs font-[700] tracking-tight hover:border-slate-400 transition-all uppercase"
                   >
                      VIEW ALL SUBJECTS
                   </button>
                </div>
              </div>

              {/* Right Side: Live Now Sidebar */}
              <div className="lg:col-span-5">
                 <div className="bg-[#002f26] rounded-[3rem] p-10 sticky top-28 border border-white/5 shadow-2xl">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-2xl font-sans font-[800] text-white tracking-tight">Live Now</h3>
                       <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-4 py-1.5 rounded-full border border-red-500/20">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">LIVE NOW</span>
                       </div>
                    </div>

                    <div className="space-y-6 mb-10">
                       {liveClasses.length === 0 ? (
                         <p className="text-slate-500 text-center py-8 font-medium italic">No live tests currently active.</p>
                       ) : liveClasses.slice(0, 3).map((live) => (
                         <div 
                           key={live.id} 
                           onClick={() => navigate(`/live-test/${live.id}`)}
                           className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition-colors cursor-pointer group"
                         >
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[9px] font-black text-[#2dd4bf] block tracking-[0.2em] uppercase">{live.category || 'GENERAL'}</span>
                               <span className={`text-[9px] font-black px-2 py-1 rounded bg-white/10 ${live.isFree ? 'text-emerald-400' : 'text-amber-400'} uppercase tracking-widest`}>
                                 {live.isFree ? 'FREE' : `₹${live.price}`}
                               </span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#2dd4bf] transition-colors">{live.title}</h4>
                            
                            <div className="flex flex-wrap gap-4 mb-6">
                               <div className="flex items-center gap-1.5 text-slate-400">
                                  <Calendar className="w-3.5 h-3.5 text-[#2dd4bf]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                     {new Date(live.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {new Date(live.endTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                  </span>
                               </div>
                               <div className="flex items-center gap-1.5 text-slate-400">
                                  <Clock className="w-3.5 h-3.5 text-[#2dd4bf]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                     {new Date(live.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            </div>

                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/10 flex items-center justify-center text-white/50">
                                     <Users className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-bold text-slate-300 mb-0.5">{(live.enrolledUsers?.length || 0) + 120}+ ENROLLED</p>
                                     <p className="text-[10px] font-bold text-[#2dd4bf]">LIVE</p>
                                  </div>
                               </div>
                               <button className="bg-[#2dd4bf] text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-[#5eead4] transition-colors uppercase tracking-widest">ENROLL NOW</button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <button 
                      onClick={() => navigate('/live-tests')}
                      className="w-full py-4.5 border border-white/10 text-white rounded-2xl text-[10px] font-black hover:bg-white/5 transition-all mb-8 uppercase tracking-[0.2em]"
                    >
                       BROWSE LIVE TESTS
                    </button>

                    <div 
                      onClick={() => navigate('/premium')}
                      className="bg-[#5eead4]/10 rounded-2xl p-6 border border-[#5eead4]/20 flex items-center gap-5 cursor-pointer hover:bg-[#5eead4]/20 transition-all shadow-lg"
                    >
                       <div className="w-14 h-14 bg-[#5eead4] rounded-2xl flex items-center justify-center text-slate-900">
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
                 <div className="w-16 h-16 bg-[#ccfbf1] rounded-[1.5rem] flex items-center justify-center text-slate-900 shrink-0 transform hover:rotate-6 transition-transform">
                    <Zap className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-sans font-[800] text-slate-900 mb-3 tracking-tight">AI-Powered Analysis</h3>
                    <p className="text-slate-500 text-sm font-medium leading-[1.8] max-w-sm tracking-tight">Get personalized insights into your performance bottlenecks and time-management skills.</p>
                 </div>
              </div>
              <div className="flex items-start gap-10">
                 <div className="w-16 h-16 bg-[#ccfbf1] rounded-[1.5rem] flex items-center justify-center text-slate-900 shrink-0 transform hover:-rotate-6 transition-transform">
                    <Shield className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-sans font-[800] text-slate-900 mb-3 tracking-tight">Expert Authority</h3>
                    <p className="text-slate-500 text-sm font-medium leading-[1.8] max-w-sm tracking-tight">Designed for all competitive exams with comprehensive context and updated current affairs.</p>
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
                     <h2 className="text-5xl md:text-6xl font-sans font-[800] text-slate-900 mb-8 tracking-tighter leading-none">Ready to Ace Your Exams?</h2>
                     <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md tracking-tight">Join thousands of successful candidates who started their journey with PrepNext.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 lg:justify-end">
                     <Link to="/signup" className="w-full sm:w-auto bg-[#006e5d] text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-[#005a4d] transition-all shadow-xl shadow-[#002f26]/20 active:scale-95 uppercase tracking-widest text-center">
                        Claim Your Free Mock
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gradient-to-r from-[#004d40] to-[#006e5d] py-20 border-y border-[#002f26]/30 shadow-inner">
         <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
               <div className="py-6 md:py-0">
                  <h3 className="text-5xl font-sans font-[800] text-white mb-2 tracking-tighter drop-shadow-md">{settings.aspirantCount || '50k+'}</h3>
                  <p className="text-emerald-200 font-extrabold text-[11px] uppercase tracking-[0.3em] opacity-90">Aspirants Enrolled</p>
               </div>
               <div className="py-6 md:py-0">
                  <h3 className="text-5xl font-sans font-[800] text-white mb-2 tracking-tighter drop-shadow-md">{settings.totalTests || '1.2k+'}</h3>
                  <p className="text-emerald-200 font-extrabold text-[11px] uppercase tracking-[0.3em] opacity-90">Full Mock Tests</p>
               </div>
               <div className="py-6 md:py-0">
                  <h3 className="text-5xl font-sans font-[800] text-white mb-2 tracking-tighter drop-shadow-md">{settings.successRate || '98%'}</h3>
                  <p className="text-emerald-200 font-extrabold text-[11px] uppercase tracking-[0.3em] opacity-90">Success Rate</p>
               </div>
            </div>
         </div>
      </section>
    </Layout>
  );
}
