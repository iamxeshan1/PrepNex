import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import LiveTestsSection from '../components/LiveTestsSection';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { 
  CheckCircle, 
  Award, 
  BarChart3, 
  Clock, 
  Zap, 
  Target, 
  ArrowRight, 
  Bell, 
  Info, 
  AlertTriangle, 
  Sparkles, 
  Star,
  Quote, 
  MessageSquare,
  Calculator, 
  Brain, 
  Globe, 
  Microscope, 
  History, 
  Map, 
  Cpu, 
  FileText, 
  Palette, 
  Atom, 
  Search, 
  BookOpen, 
  Layers, 
  ChevronRight,
  Crown
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'firebase/firestore';

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
  Layers
};

const NoticesSection = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Home notices error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (!loading && notices.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
              <Bell className="w-6 h-6 fill-secondary opacity-20" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-primary tracking-tight">Latest Notices</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">Important announcements from <Logo className="text-[10px]" /></p>
            </div>
          </div>
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active announcements at this time.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
            <Bell className="w-6 h-6 fill-secondary opacity-20" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Latest Notices</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">Important announcements from <Logo className="text-[10px]" /></p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)
          ) : (
            notices.map((notice) => {
              const isNew = notice.createdAt ? (new Date().getTime() - new Date(notice.createdAt).getTime()) < (3 * 24 * 60 * 60 * 1000) : false;
              
              return (
                <Link to="/dashboard" key={notice.id} className="group relative flex flex-col md:flex-row md:items-center gap-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-secondary transition-all hover:bg-white hover:shadow-lg hover:shadow-primary/5">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    notice.type === 'info' ? 'bg-blue-100 text-blue-600' :
                    notice.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {notice.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-black text-primary truncate group-hover:text-secondary transition-colors">{notice.title}</h4>
                      {isNew && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-white text-[8px] font-black uppercase tracking-widest animate-pulse">
                          <Sparkles className="w-2 h-2 fill-white" /> New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 leading-relaxed">{notice.content}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                    <span>
                      {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

const ThoughtOfTheDaySection = () => {
  const [thought, setThought] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThought = async () => {
      try {
        const q = query(collection(db, 'thoughts'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setThought({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (err) {
        console.error("Home thought error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThought();
  }, []);

  if (loading) return null;

  if (!thought) {
    return (
      <section className="py-16 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#3B82F6_0%,transparent_50%)] opacity-20" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-8">
            <Sparkles className="w-3.5 h-3.5 fill-white" /> Daily Motivation
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white italic leading-tight tracking-tight">
            "Your persistence will eventually pay off. Keep moving forward."
          </h2>
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="w-12 h-1 bg-secondary rounded-full" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-2">— <Logo className="text-[10px]" variant="white" /> Core</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#3B82F6_0%,transparent_50%)] opacity-20" />
      <div className="absolute top-0 right-0 p-20 opacity-[0.05] rotate-12 scale-150 z-0 text-white">
        <Quote className="w-96 h-96" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 fill-white" /> Thought of the Day
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight italic">
            "{thought.text}"
          </h2>
          
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="w-12 h-1 bg-secondary rounded-full" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">— {thought.author}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TopicMasterySection = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeSubjects = async () => {
      try {
        const q = query(collection(db, 'subjects'), limit(4));
        const snap = await getDocs(q);
        setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeSubjects();
  }, []);

  if (loading) return null;

  return (
    <section className="py-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4">
              <Zap className="w-3.5 h-3.5 fill-secondary" /> Precision Practice
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight">
              Master Every <span className="text-secondary">Subject</span>
            </h2>
            <p className="text-slate-500 font-medium text-lg mt-4 leading-relaxed">
              Target your weaknesses with topic-specific mock tests. From Reasoning to General Science, we've got you covered.
            </p>
          </div>
          <Link to="/subjects" className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
            View All Subjects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.length > 0 ? (
            subjects.map((sub, index) => {
              const IconComp = ICON_MAP[sub.icon] || BookOpen;
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:border-primary transition-all duration-500"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500 mb-6">
                    <IconComp className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-primary mb-2 tracking-tight group-hover:text-secondary transition-colors">{sub.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Specialized Tests</p>
                  
                  <Link to={`/subject-tests/${sub.id}`} className="inline-flex items-center gap-2 text-primary group-hover:text-secondary font-black text-[10px] uppercase tracking-widest">
                    Explore Now <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )
            })
          ) : (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 border-dashed flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200 mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">New Subject Coming</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('status', '==', 'approved'), limit(10));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Home reviews error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const defaultReviews = [
    { id: 'd1', userName: 'Aamir Hassan', content: 'PrepNext is the best platform for JKSSB preparation.', rating: 5 },
    { id: 'd2', userName: 'Priya Sharma', content: 'The analytics section helped me identify my weak spots.', rating: 5 },
    { id: 'd3', userName: 'Rahul Verma', content: 'Affordable pricing and top-notch quality content.', rating: 5 },
    { id: 'd4', userName: 'Saba Jan', content: 'Changed the way I prepare for exams. Truly smart!', rating: 5 },
    { id: 'd5', userName: 'Ishfaq Mir', content: 'The interface is so smooth and distraction-free.', rating: 5 }
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;
  // Duplicate reviews for seamless loop
  const marqueeReviews = [...displayReviews, ...displayReviews, ...displayReviews];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            <MessageSquare className="w-3.5 h-3.5 fill-secondary" /> Student Voice
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <h2 className="text-4xl font-black text-primary tracking-tight">What Aspirants say about</h2>
            <Logo className="text-4xl" />
          </div>
        </div>
      </div>

      <div className="flex overflow-hidden group">
        <motion.div 
          className="flex gap-8 py-4 px-4"
          animate={{ x: [0, -1920] }}
          transition={{ 
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
          whileHover={{ animationPlayState: 'paused' }}
        >
          {marqueeReviews.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative w-[350px] flex-shrink-0 group/card hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 text-primary">
                <Quote className="w-8 h-8" />
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>

              <p className="text-slate-600 font-medium leading-relaxed italic mb-8 h-20 overflow-hidden line-clamp-3">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-black uppercase text-sm">
                  {testimonial.userName?.[0]}
                </div>
                <div>
                  <h4 className="font-black text-primary text-sm tracking-tight">{testimonial.userName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Aspirant</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default function Home() {
  const [recruitmentExams, setRecruitmentExams] = useState<any[]>([]);
  const [competitiveExams, setCompetitiveExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const getAgencyLogo = (organization: string) => {
    const agency = agencies.find(a => a.name === organization);
    return agency ? agency.logoUrl : null;
  };

  useEffect(() => {
    const fetchAgencies = async () => {
      const q = query(collection(db, 'agencies'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const ags = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      ags.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAgencies(ags);
    };
    fetchAgencies();
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2;

    const fetchGeneral = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (err: any) {
        // Log sparingly
        if (retryCount === 0) {
          console.warn("Home settings fetch delayed or offline:", err.message);
        }
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchGeneral, 1500 * retryCount);
        }
      }
    };
    fetchGeneral();
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(
          collection(db, 'exams')
        );
        const snapshot = await getDocs(q);
        const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
          .filter(exam => exam.status !== 'draft')
          .sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));

        setRecruitmentExams(fetchedExams.filter(e => e.type !== 'competitive').slice(0, 4));
        setCompetitiveExams(fetchedExams.filter(e => e.type === 'competitive').slice(0, 4));
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16">
        {/* Trust Badge */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#2ECC71] py-3 px-8 rounded-full shadow-lg shadow-[#2ECC71]/20 flex items-center gap-3 text-white">
            <CheckCircle className="w-5 h-5 fill-white/20" />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Trusted by {settings?.aspirantCount || '10,000+'} Aspirants</span>
          </div>
        </div>

        <div className="absolute inset-0 z-[-1] opacity-40">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-8 tracking-tight leading-[0.9]">
              {settings?.heroTagline ? settings.heroTagline.split(' ').slice(0, -2).join(' ') : 'Practice. Improve.'} <br />
              <span className="text-secondary">{settings?.heroTagline ? settings.heroTagline.split(' ').slice(-2).join(' ') : 'Succeed.'}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Join India's most focused test series platform for JKSSB, UPSC, SSC and more. 
              Real exam simulation with instant insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/agencies" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                Explore Agencies
              </Link>
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-primary border-2 border-primary/20 rounded-xl font-bold text-lg hover:border-primary/40 transition-all">
                Try Free Mock Test
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-black text-primary tracking-tight">Recruitment Agencies</h2>
              <p className="text-slate-500 font-medium mt-1">Browse exams by recruitment body.</p>
            </div>
            <Link to="/agencies" className="text-xs font-bold text-secondary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {agencies.slice(0, 6).map(agency => (
              <Link to={`/agency/${agency.id}`} key={agency.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-primary transition-all text-center flex flex-col items-center gap-2 group">
                 <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50">
                   {agency.logoUrl ? <img src={agency.logoUrl} alt={agency.name} /> : <div className="w-full h-full bg-slate-200" />}
                 </div>
                 <span className="text-xs font-bold text-primary truncate max-w-full">{agency.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Thought of the Day */}
      <ThoughtOfTheDaySection />

      {/* Recruitment Exams Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                <Target className="w-3.5 h-3.5 fill-primary" /> Career Path
              </div>
              <h2 className="text-3xl font-bold text-primary tracking-tight">Recruitment Exams</h2>
              <p className="text-slate-500 mt-2">Find your next government job with focused mocks.</p>
            </div>
            <Link to="/agencies" className="text-sm font-bold text-secondary flex items-center gap-1 group">
              View All Agencies
              <div className="group-hover:translate-x-1 transition-transform">→</div>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loadingExams ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-slate-50 h-48 rounded-3xl animate-pulse" />
              ))
            ) : recruitmentExams.length > 0 ? (
              recruitmentExams.map((exam) => (
                <Link to={`/exam/${exam.id}`} key={exam.id} className="group cursor-pointer">
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl h-full flex flex-col items-center text-center group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/5 transition-all">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center p-2 group-hover:bg-primary/5 transition-colors">
                      {exam.logoUrl || getAgencyLogo(exam.organization) ? (
                        <img src={exam.logoUrl || getAgencyLogo(exam.organization)} alt={exam.name} className="w-full h-full object-contain" />
                      ) : (
                        <Award className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <h3 className="font-bold text-primary group-hover:text-secondary transition-colors">{exam.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.organization}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                        {exam.isPaid ? 'Enroll Now' : 'Free Mock'} <ArrowRight className="w-3 h-3" />
                      </div>
                      {exam.isPaid && <span className="text-[10px] font-black text-secondary">₹{exam.price}</span>}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                No recruitment exams featured yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Competitive Exams Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                <Brain className="w-3.5 h-3.5 fill-secondary" /> Entrance & Eligibility
              </div>
              <h2 className="text-3xl font-bold text-primary tracking-tight">Competitive Exams</h2>
              <p className="text-slate-500 mt-2">Excel in national level entrance and eligibility tests.</p>
            </div>
            <Link to="/agencies" className="text-sm font-bold text-secondary flex items-center gap-1 group">
              Explore All Categories
              <div className="group-hover:translate-x-1 transition-transform">→</div>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loadingExams ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-slate-50 h-48 rounded-3xl animate-pulse" />
              ))
            ) : competitiveExams.length > 0 ? (
              competitiveExams.map((exam) => (
                <Link to={`/exam/${exam.id}`} key={exam.id} className="group cursor-pointer">
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl h-full flex flex-col items-center text-center group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/5 transition-all">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center p-2 group-hover:bg-primary/5 transition-colors">
                      {exam.logoUrl || getAgencyLogo(exam.organization) ? (
                        <img src={exam.logoUrl || getAgencyLogo(exam.organization)} alt={exam.name} className="w-full h-full object-contain" />
                      ) : (
                        <Award className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <h3 className="font-bold text-primary group-hover:text-secondary transition-colors">{exam.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.organization}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary group-hover:translate-x-1 transition-transform uppercase tracking-widest">
                        {exam.isPaid ? 'Enroll Now' : 'Free Mock'} <ArrowRight className="w-3 h-3" />
                      </div>
                      {exam.isPaid && <span className="text-[10px] font-black text-secondary">₹{exam.price}</span>}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white rounded-3xl border-2 border-dashed border-slate-200">
                No competitive exams featured yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Topic Mastery Section */}
      <TopicMasterySection />

      {/* Latest Notices */}
      <NoticesSection />

      {/* Live Tests */}
      <LiveTestsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Stats Section */}
      <section className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Total Tests', value: settings?.totalTests || '500+' },
            { label: 'Exams Covered', value: settings?.examsCovered || '25+' },
            { label: 'Active Users', value: settings?.activeUsers || '12k+' },
            { label: 'Success Rate', value: settings?.successRate || '88%' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-blue-200 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl font-bold text-primary tracking-tight">Why Choose</h2>
              <Logo className="text-3xl" />
            </div>
            <div className="w-20 h-1.5 bg-secondary mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Target}
              title="Real Exam Pattern"
              desc="Our mocks are designed by subject experts following the latest JKSSB and national exam trends."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Instant Analytics"
              desc="Get detailed performance reports immediately after the test with area-wise strengths and weaknesses."
            />
            <FeatureCard 
              icon={Clock}
              title="Time Management"
              desc="Integrated timer with section-wise tracking to help you master the art of time allocation."
            />
          </div>
        </div>
      </section>

      {/* Premium Plan Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 skew-x-12 translate-x-1/2 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6">
                <Crown className="w-4 h-4 fill-purple-600" /> Best Value Selection
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-primary tracking-tight leading-tight mb-6">
                {settings?.premiumTitle?.split(' ').slice(0, 1).join('') || 'All-Access'} <br />
                <span className="text-purple-600">{settings?.premiumTitle?.split(' ').slice(1).join(' ') || 'Premium Pass'}</span>
              </h2>
              <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed max-w-lg">
                Unlock every single mock test across all exam categories for an entire year. The ultimate package for serious aspirants.
              </p>
              
              <div className="space-y-4">
                {(settings?.premiumFeatures ? settings.premiumFeatures.split('\n') : [
                  "Unlimited access to 500+ Mock Tests",
                  "All Exam Categories (JKSSB, UPSC, SSC, etc.)",
                  "Advanced Performance Analytics",
                  "Premium 24/7 Priority Helpdesk",
                  "Ad-free focused exam environment"
                ]).map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-600 to-primary rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative bg-white border-2 border-primary/10 rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-primary/5">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight">{settings?.premiumTitle || 'Unlimited 1-Year Pass'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Validity: {settings?.premiumValidity || '365 Days'}</p>
                  </div>
                  <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20">
                    <Zap className="w-6 h-6 fill-white" />
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary">₹{settings?.premiumPrice || '599'}</span>
                    <span className="text-slate-400 line-through font-bold text-lg">₹{settings?.premiumOriginalPrice || '1499'}</span>
                  </div>
                  <p className="text-sm font-black text-green-600 uppercase tracking-widest mt-2">{settings?.premiumSubtitle || 'Special Launch Offer • 60% OFF'}</p>
                </div>

                <Link to="/premium" className="block w-full py-5 bg-primary text-white text-center rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                  Get Premium Now
                </Link>

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                  Trusted by {settings?.aspirantCount || '10,000+'} Aspirants
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 mb-16 mt-12">
        <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Ready to clear your dream exam?</h2>
          <p className="text-blue-100 mb-10 max-w-lg mx-auto leading-relaxed">
            Stop guessing. Start practicing with the platform designed for serious aspirants.
          </p>
          <Link to="/signup" className="inline-block px-10 py-5 bg-white text-primary rounded-2xl font-bold text-lg shadow-2xl hover:scale-[1.02] transition-all active:scale-95">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </Layout>
  );
}
