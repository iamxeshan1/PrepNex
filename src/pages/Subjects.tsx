import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { collection, getDocs, query, orderBy, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

export default function Subjects() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
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
        if (subjectId) {
          const [sSnap, tSnap] = await Promise.all([
            getDoc(doc(db, 'subjects', subjectId)),
            getDocs(query(collection(db, 'tests'), where('subjectId', '==', subjectId), orderBy('createdAt', 'desc')))
          ]);
          if (sSnap.exists()) setSelectedSubject({ id: sSnap.id, ...sSnap.data() });
          
          const fetchedTests = tSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          setTests(fetchedTests.filter(t => t.status !== 'draft'));
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
    const IconComp = selectedSubject ? ICON_MAP[selectedSubject.icon] : BookOpen;
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
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedSubject.description || 'Focused training module for competitive excellence.'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-sans font-[800] text-slate-900 tracking-tight px-2">Available Practice Sets</h2>
                  <div className="flex flex-col gap-4">
                    {tests.map((test) => (
                      <div key={test.id} className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 ${test.isFree ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {test.isFree ? <Zap className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <h4 className="font-sans font-[800] text-slate-900 text-[15px] tracking-tight group-hover:text-primary transition-colors">{test.title}</h4>
                              {!test.isFree && (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Premium</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {test.duration} min</span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Award className="w-3.5 h-3.5" /> {test.totalMarks} marks</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link 
                          to={`/test/${test.id}`}
                          className={`flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-[0.75rem] font-sans font-[800] text-xs uppercase tracking-widest transition-all ${test.isFree ? 'bg-[#002f26] text-white hover:bg-primary' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {test.isFree ? 'Start Test' : 'Unlock Pro'}
                        </Link>
                      </div>
                    ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse" />)}
              </div>
            ) : subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subject, index) => {
                  const IconComp = ICON_MAP[subject.icon] || BookOpen;
                  const colorClass = COLOR_VARIANTS[index % COLOR_VARIANTS.length];
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/subject-tests/${subject.id}`)}
                      className="flex flex-col items-center text-center p-8 bg-white border border-slate-100 rounded-[1.5rem] hover:shadow-xl transition-all cursor-pointer group shadow-sm"
                    >
                      <div className={`w-14 h-14 ${colorClass} rounded-[1rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                        <IconComp className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-sans font-[800] text-slate-900 mb-2 tracking-tight">{subject.name}</h4>
                      <p className="text-[11px] font-medium text-slate-400 line-clamp-2">
                        {subject.description || 'Master the concepts and shortcuts.'}
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
