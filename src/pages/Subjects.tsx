import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
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
  ArrowLeft
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
  MessageSquare
};

export default function Subjects() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
        } else {
          const q = query(collection(db, 'subjects'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
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
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
                  <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 shrink-0">
                    {IconComp && <IconComp className="w-12 h-12" />}
                  </div>
                  <div className="text-center md:text-left">
                    <h1 className="text-3xl font-black text-primary tracking-tight mb-2">{selectedSubject.name}</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">{selectedSubject.description || 'Focused training module for competitive excellence.'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-black text-primary tracking-tight px-2">Available Practice Sets</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {tests.map((test) => (
                      <div key={test.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${test.isFree ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {test.isFree ? <Zap className="w-6 h-6 fill-green-600/20" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-primary tracking-tight group-hover:text-secondary transition-colors">{test.title}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="w-3 h-3" /> {test.duration} MIN</span>
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Award className="w-3 h-3" /> {test.totalMarks} MARKS</span>
                              {!test.isFree && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Premium</span>}
                            </div>
                          </div>
                        </div>
                        <Link 
                          to={`/test/${test.id}`}
                          className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${test.isFree ? 'bg-primary text-white shadow-lg shadow-primary/10 hover:scale-105' : 'bg-slate-100 text-slate-400 hover:bg-amber-600 hover:text-white cursor-pointer'}`}
                        >
                          {test.isFree ? 'Start Test' : 'Unlock Pro'}
                        </Link>
                      </div>
                    ))}
                    {tests.length === 0 && (
                      <div className="py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
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
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary transition-all duration-500 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 mb-8">
                          <IconComp className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-2xl font-black text-primary mb-3 tracking-tight group-hover:text-secondary transition-colors">{subject.name}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                          {subject.description || 'Master the concepts and shortcuts of this subject through specialized practice sets.'}
                        </p>
                      </div>
                      
                      <Link 
                        to={`/subject-tests/${subject.id}`} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        Explore Mock Tests
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
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
