import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Search, 
  Download, 
  FileText, 
  Layers, 
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uiConfirm } from '../lib/customUI';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  createdAt: string;
}

export default function StudyMaterial() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'study_material'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMaterials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching study material:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (!user) {
      uiConfirm("Premium Content: Please login or create an account to download the study material. Would you like to proceed?", () => {
        navigate('/login');
      });
      return;
    }
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="bg-[#f8fafc] min-h-screen">
        {/* Modern Hero Section */}
        <section className="bg-white border-b border-slate-200 pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Layers className="w-3.5 h-3.5" /> Comprehensive Resource Vault
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-sans font-[800] text-slate-900 tracking-tighter mb-6 leading-tight">
              Master Your Exams with <br/>
              <span className="text-indigo-600">Curated Materials.</span>
            </h1>
            
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto mb-12">
              High-quality notes, question banks, and strategy guides designed to give you a competitive edge.
            </p>

            {/* Premium Search Experience */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-[3rem] group-focus-within:bg-indigo-500/10 transition-all duration-500" />
              <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-2 flex items-center shadow-sm focus-within:shadow-xl focus-within:shadow-indigo-500/5 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-6" />
                <input 
                  type="text"
                  placeholder="Search by topic, exam or subject..."
                  className="w-full px-4 py-4 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="hidden md:flex items-center gap-2 pr-2">
                  <span className="px-3 py-1.5 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                    Search Archive
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="flex flex-col gap-12">
            {/* Materials Grid */}
            <div className="w-full">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 4, 5, 6, 7].map(i => (
                    <div key={i} className="h-72 bg-slate-100 rounded-[2.5rem] animate-pulse border border-slate-200" />
                  ))}
                </div>
              ) : filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredMaterials.map((m, index) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
                    >
                      {/* Accent Decorative Element */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] group-hover:bg-indigo-50 transition-colors pointer-events-none -mr-4 -mt-4" />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-8">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            {m.category}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {m.title}
                        </h3>
                        
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 line-clamp-2 min-h-[2.5rem]">
                          {m.description || 'Comprehensive study resource carefully compiled for optimal preparation and clarity.'}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Digital Archive</span>
                          </div>
                          <button 
                            onClick={(e) => handleDownload(e, m.url)}
                            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20"
                          >
                            Access PDF <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">No Resources Found</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">
                    We couldn't find any materials matching your filters. Try adjusting the keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-24">
          <div className="bg-indigo-600 rounded-[3rem] p-12 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3" /> Can't find what you need?
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-4">Request Custom Study Content</h2>
                <p className="text-indigo-100 font-medium">
                  If there's a specific exam or topic you need materials for, let us know and our academic team will prioritize it.
                </p>
              </div>
              <button 
                onClick={() => navigate('/contact')}
                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/20 flex items-center gap-3 hover:translate-x-1 transition-all"
              >
                Reach Out <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

