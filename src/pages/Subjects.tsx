import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { seedDefaultData } from '../services/seed';
import { 
  BookOpen, 
  ChevronRight, 
  ArrowRight, 
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
  MessageSquare,
  Sparkles,
  Clock,
  Award,
  Lock,
  Zap,
  ArrowLeft,
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
  Compass,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSubjectIcon, getSubjectDescription, ICON_MAP } from '../lib/subjectHelpers';

const COLOR_VARIANTS = [
  'bg-emerald-50 text-emerald-500',
  'bg-amber-50 text-amber-500',
  'bg-blue-50 text-blue-500',
  'bg-[#006e5d]/10 text-[#006e5d]',
  'bg-orange-50 text-orange-500',
  'bg-[#006e5d]/10 text-[#006e5d]',
  'bg-rose-50 text-rose-500',
  'bg-purple-50 text-purple-500',
];

export default function Subjects() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const fetchPortalData = async () => {
      setLoading(true);
      try {
        await seedDefaultData();
        if (subjectId) {
          const [sSnap, tSnap] = await Promise.all([
            getDoc(doc(db, 'subjects', subjectId)),
            getDocs(query(collection(db, 'tests'), where('subjectId', '==', subjectId)))
          ]);
          if (sSnap.exists()) setSelectedSubject({ id: sSnap.id, ...sSnap.data() });
          
          const fetchedTests = tSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          const sortedTests = fetchedTests.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            
            if (timeA !== timeB) {
              return timeA - timeB; // Ascending order: older/first created at the top
            }
            
            const getMockNumber = (title: string) => {
              const match = title?.match(/(?:Mock Set|Mock|Set)\s*(\d+)/i);
              return match ? parseInt(match[1], 10) : null;
            };
            const numA = getMockNumber(a.title || "");
            const numB = getMockNumber(b.title || "");
            
            if (numA !== null && numB !== null) {
              if (numA !== numB) {
                return numA - numB;
              }
            }
            
            return (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: 'base' });
          });
          
          setTests(sortedTests.filter(t => t.status !== 'draft'));
          setLoading(false);
        } else {
          unsub = onSnapshot(collection(db, 'subjects'), (snap) => {
            const fetchedSubjects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedSubjects.sort((a: any, b: any) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            setSubjects(fetchedSubjects);
            setLoading(false);
          });
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchPortalData();
    return () => {
      if (unsub) unsub();
    };
  }, [subjectId]);

  if (subjectId) {
    const IconComp = selectedSubject ? getSubjectIcon(selectedSubject) : BookOpen;
    return (
      <Layout>
        <div className="bg-slate-50 min-h-screen py-12">
          <div className="max-w-5xl mx-auto px-4">
            <Link to="/subjects" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Subjects
            </Link>

            {loading ? (
              <div className="space-y-4">
                <div className="h-40 bg-white rounded-[2.5rem] animate-pulse" />
                <div className="h-64 bg-white rounded-[2.5rem] animate-pulse" />
              </div>
            ) : selectedSubject ? (
              <div className="space-y-10">
                <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center shrink-0">
                    {IconComp && <IconComp className="w-10 h-10 text-primary" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-sans font-[800] text-slate-900 tracking-tight mb-2">{selectedSubject.name}</h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{getSubjectDescription(selectedSubject)}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-sans font-[800] text-slate-900 tracking-tight px-2">Available Practice Sets</h2>
                  <div className="flex flex-col gap-4">
                    {tests.map((test) => {
                      const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
                      const isUnlocked = Boolean(
                        test.isFree || 
                        profile?.isPremium || 
                        isAdmin || 
                        (subjectId && profile?.purchasedSubjects?.includes(subjectId)) ||
                        (test.examId && profile?.purchasedExams?.includes(test.examId))
                      );

                      return (
                        <div key={test.id} className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {isUnlocked ? <Zap className="w-5 h-5 text-emerald-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <h4 className="font-sans font-[800] text-slate-900 text-[15px] tracking-tight group-hover:text-primary transition-colors">{test.title}</h4>
                                {isUnlocked && !test.isFree && (
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Unlocked (Pass Active)
                                  </span>
                                )}
                                {!isUnlocked && (
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Premium</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {test.duration} min</span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Award className="w-3.5 h-3.5" /> {test.totalMarks} marks</span>
                              </div>
                            </div>
                          </div>
                          
                          {isUnlocked ? (
                            <Link 
                              to={`/test/${test.id}`}
                              className="flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-[0.75rem] font-sans font-[800] text-xs uppercase tracking-widest transition-all bg-[#006e5d] text-white hover:bg-[#005a4d] shadow-sm shadow-emerald-700/20"
                            >
                              Start Test
                            </Link>
                          ) : (
                            <Link 
                              to="/premium"
                              className="flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-[0.75rem] font-sans font-[800] text-xs uppercase tracking-widest transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                            >
                              Unlock Pro
                            </Link>
                          )}
                        </div>
                      );
                    })}
                    {tests.length === 0 && (
                      <div className="py-16 bg-white rounded-[1.5rem] border border-slate-100 text-center">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tests uploaded for this topic yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-40">Subject not found.</div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen">
        {/* Header Section */}
        <section className="bg-white pt-20 pb-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight mb-6">
                Topic-Wise <span className="text-secondary text-transparent bg-clip-text bg-gradient-to-r from-secondary to-orange-400">Mastery</span>
              </h1>
              <p className="max-w-2xl mx-auto text-slate-500 font-medium text-lg leading-relaxed">
                Don't let one weak subject hold you back. Practice specific topic-based mock tests created by experts to boost your overall percentile.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Subjects Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="mb-12">
              <input
                type="text"
                placeholder="Search subjects..."
                className="w-full md:max-w-md mx-auto block px-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-56 bg-white rounded-[1.5rem] animate-pulse" />)}
              </div>
            ) : subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 md:gap-8">
                {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subject, index) => {
                  const IconComp = getSubjectIcon(subject);
                  const colorClass = COLOR_VARIANTS[index % COLOR_VARIANTS.length];
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => navigate(`/subject-tests/${subject.id}`)}
                      className="flex flex-col items-center text-center p-4 sm:p-7 bg-white border border-slate-100 rounded-[1.25rem] sm:rounded-[1.5rem] hover:shadow-xl transition-all cursor-pointer group shadow-sm"
                    >
                      <div className={`w-11 h-11 sm:w-14 sm:h-14 ${colorClass} rounded-[0.85rem] sm:rounded-[1rem] flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform shrink-0`}>
                        <IconComp className="w-5 h-5 sm:w-7 sm:h-7" />
                      </div>
                      <h4 className="text-xs sm:text-base font-sans font-[800] text-slate-900 mb-1.5 tracking-tight line-clamp-1">{subject.name}</h4>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 line-clamp-2 leading-tight">
                        {getSubjectDescription(subject)}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-40">
                 <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                 <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No matching subjects found</h2>
                 <p className="text-slate-400 font-medium mt-2">Try a different search term.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
