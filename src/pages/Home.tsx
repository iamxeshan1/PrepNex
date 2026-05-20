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
  Calendar,
  Sparkles,
  Newspaper,
  ChevronRight,
  Bell,
  Lock,
  Unlock,
  BookMarked
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
  'bg-[#006e5d]/5 text-[#006e5d]',
  'bg-orange-50 text-orange-500',
  'bg-[#006e5d]/5 text-[#006e5d]',
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
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [latestThought, setLatestThought] = useState<any>(null);
  const [jobAlerts, setJobAlerts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

    const unsubStudyMaterial = onSnapshot(collection(db, 'study_material'), (snap) => {
        const fetchedBooks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedBooks.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setStudyMaterials(fetchedBooks.slice(0, 4));
    });

    const unsubThought = onSnapshot(query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'), limit(1)), (snap) => {
      if (!snap.empty) setLatestThought({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    const unsubAlerts = onSnapshot(query(collection(db, 'jobAlerts'), orderBy('createdAt', 'desc'), limit(5)), (snap) => {
      setJobAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchData();
    return () => {
      unsubLive();
      unsubSubjects();
      unsubStudyMaterial();
      unsubSettings();
      unsubThought();
      unsubAlerts();
    };
  }, []);

  const filteredExams = activeTab === 'All' 
    ? exams 
    : exams.filter(exam => exam.agencyId === activeTab);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50 via-white to-white pt-20 pb-12 overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-100/50 text-[#006e5d] px-4 py-2 rounded-full text-xs font-bold tracking-wide mb-6"
          >
            <Zap className="w-4 h-4 fill-[#006e5d]" /> Premium Learning Platform for Exams
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-sans font-[800] text-slate-900 mb-6 tracking-tight max-w-4xl mx-auto leading-tight"
          >
            {settings.heroHeading ? (
              settings.heroHeading.includes('|') ? (
                <>
                  {settings.heroHeading.split('|')[0]} <span className="text-[#006e5d]">{settings.heroHeading.split('|')[1]}</span>
                </>
              ) : (
                settings.heroHeading
              )
            ) : (
              <>Crack your Target Exam with <span className="text-[#006e5d]">PrepNext</span></>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {settings.heroTagline || "Get the most comprehensive mock tests, live classes, and performance insights."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto mb-12 relative"
          >
            <div className="flex items-center bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
              <div className="pl-4 pr-2 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) navigate(`/exams?search=${encodeURIComponent(searchTerm.trim())}`);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for Exams, Subjects or Providers" 
                className="w-full bg-transparent border-none outline-none text-slate-900 font-medium px-2 py-3 placeholder:text-slate-400"
              />
              <button onClick={() => { if(searchTerm.trim()) navigate(`/exams?search=${encodeURIComponent(searchTerm.trim())}`); }} className="bg-[#006e5d] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#005a4d] transition-all shrink-0">
                Search
              </button>
            </div>
            
            {/* Quick Links / Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {agencies.filter(a => a.id !== 'All').slice(0, 8).map((agency, idx) => (
                <span key={idx} onClick={() => navigate(`/exams?agency=${encodeURIComponent(agency.id)}`)} className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-full hover:border-[#006e5d] hover:text-[#006e5d] cursor-pointer transition-colors shadow-sm">
                  {agency.name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats in Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-8 border-t border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[#006e5d]">
                <Users className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-slate-900">{settings.aspirantCount || '50k+'}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-slate-900">{settings.totalTests || '1.2k+'}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mock Tests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <CheckCircle className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-slate-900">{settings.successRate || '98%'}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Success Rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PrepNext Pass Promotion (Testbook Pass style) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-[#002f26] rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between text-left shadow-2xl border border-slate-800">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10 w-full md:w-auto">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-950 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm">
                <Sparkles className="w-3 h-3" /> Recommended
              </div>
              <h2 className="text-3xl md:text-4xl font-sans font-[800] text-white mb-2 tracking-tight">PrepNext <span className="text-emerald-400">Pass Pro</span></h2>
              <ul className="text-slate-300 font-medium space-y-2 mt-4 text-sm max-w-md">
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlock 70,000+ Mock Tests</li>
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 17,000+ Previous Year Papers</li>
                 <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Re-attempts on all tests</li>
              </ul>
            </div>
            <div className="relative z-10 mt-8 md:mt-0 flex flex-col items-center md:items-end w-full md:w-auto bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-emerald-400 font-bold text-sm tracking-wider uppercase mb-1">Limited Time Offer</div>
              <div className="text-white text-4xl font-black mb-1">₹{settings?.premiumPlans?.find((p: any) => p.months === 12 || p.id === 'p_1y')?.price || 3999} <span className="text-lg text-slate-400 font-medium line-through">₹{settings?.premiumPlans?.find((p: any) => p.months === 12 || p.id === 'p_1y')?.originalPrice || 11988}</span></div>
              <div className="text-slate-300 text-xs mb-4">Valid for 1 Year</div>
              <button 
                onClick={() => navigate('/premium')}
                className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Get Pass Pro Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Job Alerts & Notifications */}
      {jobAlerts.length > 0 && (
        <section className="py-12 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Bell className="w-5 h-5 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-sans font-[800] text-slate-900 tracking-tight">Latest Job Alerts</h2>
                  <p className="text-sm font-medium text-slate-500">Stay updated with latest govt jobs, admit cards & results</p>
                </div>
              </div>
              <Link to="/job-alerts" className="hidden sm:flex text-sm font-bold text-blue-600 hover:text-blue-700 items-center gap-1 group">
                View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {jobAlerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col group relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform origin-left md:scale-y-0 group-hover:scale-y-100 transition-transform"></div>
                  <div className="flex items-start justify-between mb-3">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        alert.type === 'Notification' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        alert.type === 'Admit Card' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {alert.type}
                     </span>
                     {alert.status === 'Active' && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </div>
                  <h3 className="font-sans font-[800] text-slate-900 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{alert.postName}</h3>
                  <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-1">{alert.boardInfo}</p>
                  
                  <div className="mt-auto space-y-2 pt-4 border-t border-slate-50">
                    {alert.vacancies && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {alert.vacancies}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                         <Calendar className="w-3.5 h-3.5" />
                         {new Date(alert.lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </div>
                       {alert.applyLink && (
                         <a href={alert.applyLink} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-blue-600 transition-colors">
                           {alert.type === 'Result' ? 'Check Result' : alert.type === 'Admit Card' ? 'Download' : 'Apply Now'}
                         </a>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                          ? 'bg-[#006e5d] text-white shadow-lg shadow-[#006e5d]/20' 
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                    {agency.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)
            ) : filteredExams.map((exam) => {
                const agency = agencies.find(a => a.id === exam.agencyId);
                const logo = agency?.logoUrl || exam.logoUrl;
                const isEnrolled = profile?.isPremium || profile?.purchasedExams?.includes(exam.id) || profile?.freeExams?.includes(exam.id) || false;
                return (
                  <motion.div 
                    key={exam.id}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-[#006e5d]/30 transition-all cursor-pointer group flex flex-col relative"
                  >
                    {/* Top Accent Bar */}
                    <div className="h-1.5 w-full bg-[#006e5d]"></div>
                    
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4 gap-2">
                         <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                           {logo ? (
                              <img src={logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                           ) : (
                              <BookOpen className="w-5 h-5 text-slate-300" />
                           )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {exam.isPopular && (
                            <span className="bg-[#b91c1c] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">Popular</span>
                          )}
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase ${exam.isPaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {exam.isPaid ? 'Pass Pro' : 'Free'}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-sans font-[800] text-slate-900 group-hover:text-[#006e5d] transition-colors leading-tight mb-3 line-clamp-2">{exam.name}</h3>
                      
                      <div className="space-y-2 mt-auto pb-4">
                         <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <FileText className="w-4 h-4 text-[#006e5d]" />
                            <span>{exam.mockCount || 0} Total Tests</span>
                         </div>
                         <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Users className="w-4 h-4 text-[#006e5d]" />
                            <span>{exam.enrollCount || 0}+ Enrolled</span>
                         </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-auto">
                        {isEnrolled ? (
                          <div className="w-full text-center py-2 bg-slate-50 text-[#006e5d] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                             <CheckCircle2 className="w-4 h-4" /> Enrolled
                          </div>
                        ) : (
                          <button className="w-full text-center py-2 bg-white border border-[#006e5d] text-[#006e5d] group-hover:bg-[#006e5d] group-hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                            View Test Series
                          </button>
                        )}
                      </div>
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
              <div className="w-12 h-12 bg-[#006e5d]/10 rounded-2xl flex items-center justify-center text-[#006e5d] shadow-sm border border-[#006e5d]/20">
                <Quote className="w-6 h-6 fill-current" />
              </div>
              <p className="text-xl md:text-2xl font-sans font-[600] text-slate-700 italic leading-relaxed tracking-tight max-w-2xl px-4">
                "{latestThought.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-8 bg-slate-200" />
                <span className="text-[10px] font-black text-[#006e5d] uppercase tracking-[0.3em] font-sans">
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
                               <span className="text-[9px] font-black text-[#006e5d] block tracking-[0.2em] uppercase">{live.category || 'GENERAL'}</span>
                               <span className={`text-[9px] font-black px-2 py-1 rounded bg-white/10 ${live.isFree ? 'text-emerald-400' : 'text-amber-400'} uppercase tracking-widest`}>
                                 {live.isFree ? 'FREE' : `₹${live.price}`}
                               </span>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#006e5d] transition-colors">{live.title}</h4>
                            
                            <div className="flex flex-wrap gap-4 mb-6">
                               <div className="flex items-center gap-1.5 text-slate-400">
                                  <Calendar className="w-3.5 h-3.5 text-[#006e5d]" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                     {new Date(live.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {new Date(live.endTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                  </span>
                               </div>
                               <div className="flex items-center gap-1.5 text-slate-400">
                                  <Clock className="w-3.5 h-3.5 text-[#006e5d]" />
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
                                     <p className="text-[10px] font-bold text-[#006e5d]">LIVE</p>
                                  </div>
                               </div>
                               {(!live.enrollmentEndTime || new Date() < new Date(live.enrollmentEndTime)) && (!live.endTime || new Date() < new Date(live.endTime)) ? (
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/live-test/${live.id}`); }} className="bg-[#002f26] text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-[#002f26]/80 transition-colors uppercase tracking-widest">ENROLL NOW</button>
                               ) : (
                                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-4 py-2 bg-rose-500/10 rounded-xl">Closed</span>
                                )}
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
                      className="bg-[#006e5d]/10 rounded-2xl p-6 border border-[#006e5d]/20 flex items-center gap-5 cursor-pointer hover:bg-[#006e5d]/20 transition-all shadow-lg"
                    >
                       <div className="w-14 h-14 bg-[#006e5d] rounded-2xl flex items-center justify-center text-white">
                          <Zap className="w-7 h-7 fill-current" />
                       </div>
                       <div>
                          <h5 className="text-white font-sans font-bold text-sm mb-1 uppercase tracking-widest">GO PRO</h5>
                          <p className="text-[#006e5d]/70 text-[10px] font-bold uppercase tracking-wider">Unlock all premium live sessions.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Premium Study Materials / E-Books Section */}
      <section className="py-24 bg-[#f8fafc] border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#006e5d]/5 border border-[#006e5d]/10 rounded-full text-[#006e5d] text-[10px] font-black uppercase tracking-wider mb-3">
                <BookMarked className="w-3 h-3" /> Digital Library
              </div>
              <h2 className="text-4xl font-sans font-[800] text-slate-900 tracking-tighter">Premium E-Books & Study Material</h2>
              <p className="text-slate-500 font-medium tracking-tight mt-1">Get comprehensive revision notes, exam syllabus booklets, and reference manuals.</p>
            </div>
            
            <button 
              onClick={() => navigate('/study-material')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-xs font-black tracking-wider transition-all uppercase shadow-sm shrink-0"
            >
              View All Study Material <ArrowRight className="w-3.5 h-3.5 text-[#006e5d]" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : studyMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
               <p className="text-slate-400 font-bold text-sm">No premium books or syllabus manuals available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {studyMaterials.map((m) => {
                const isFree = m.isFree !== false;
                const price = m.price !== undefined ? m.price : 199;
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate('/study-material')}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col p-4 hover:border-[#006e5d]/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    {/* Cover Container */}
                    <div className="relative aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden mb-4 shrink-0 flex items-center justify-center border border-slate-200/50">
                      {m.coverUrl ? (
                        <img 
                          src={m.coverUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0c5c4e] to-slate-900 flex flex-col justify-between p-4 text-white">
                          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300 opacity-80">{m.category}</p>
                          <div className="space-y-1 my-auto">
                            <h4 className="text-xs font-black tracking-tight leading-snug line-clamp-3 text-emerald-100">{m.title}</h4>
                            <div className="w-6 h-0.5 bg-amber-400 rounded" />
                          </div>
                          <div className="text-[8px] font-bold text-slate-400 text-right uppercase tracking-widest mt-auto">Study Guide</div>
                        </div>
                      )}

                      {/* Pricing Tag */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        {isFree ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                            <Unlock className="w-2 h-2" /> Free
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                            <Lock className="w-2 h-2" /> ₹{price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{m.category}</span>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 mb-1 group-hover:text-[#006e5d] transition-colors">
                          {m.title}
                        </h3>
                        {m.description && (
                          <p className="text-[10px] font-semibold text-slate-400 line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-[#006e5d] uppercase tracking-wider">
                        <span>Get Booklet</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="flex items-start gap-10">
                 <div className="w-16 h-16 bg-[#006e5d]/10 rounded-[1.5rem] flex items-center justify-center text-[#006e5d] shrink-0 transform hover:rotate-6 transition-transform">
                    <Zap className="w-8 h-8 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-sans font-[800] text-slate-900 mb-3 tracking-tight">AI-Powered Analysis</h3>
                    <p className="text-slate-500 text-sm font-medium leading-[1.8] max-w-sm tracking-tight">Get personalized insights into your performance bottlenecks and time-management skills.</p>
                 </div>
              </div>
              <div className="flex items-start gap-10">
                 <div className="w-16 h-16 bg-[#006e5d]/10 rounded-[1.5rem] flex items-center justify-center text-[#006e5d] shrink-0 transform hover:-rotate-6 transition-transform">
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
                     <Link to="/signup" className="w-full sm:w-auto bg-[#006e5d] text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-[#005a4d] transition-all shadow-xl shadow-[#006e5d]/20 active:scale-95 uppercase tracking-widest text-center">
                        Claim Your Free Mock
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gradient-to-r from-[#002f26] to-[#006e5d] py-20 border-y border-[#006e5d]/30 shadow-inner">
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
