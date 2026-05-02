import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookOpen, Search, ExternalLink, Download, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
}

export default function StudyMaterial() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const q = query(collection(db, 'study_material'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setMaterials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (e: React.MouseEvent, url: string) => {
    if (!user) {
      e.preventDefault();
      if (window.confirm("Please login first to download the study material. Would you like to login now?")) {
        navigate('/login');
      }
      return;
    }
    
    // If logged in, the natural <a> behavior will take over if we return.
    // However, to be extra safe and ensure absolute URLs:
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-primary pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] mb-6"
            >
              <BookOpen className="w-4 h-4 fill-white/20" /> Student Library
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Study Material & <span className="text-secondary">Notes</span></h1>
            <p className="text-slate-300 font-medium text-lg max-w-2xl mx-auto mb-10">
              Accessed shared notes, PDFs, and practice materials for various competitive exams.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-secondary transition-colors" />
              <input 
                type="text"
                placeholder="Search by topic, exam or category..."
                className="w-full pl-16 pr-8 py-5 bg-white rounded-3xl shadow-xl shadow-primary/20 outline-none focus:ring-4 focus:ring-secondary/20 transition-all text-primary font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 -mt-10 mb-20 relative z-20">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-slate-100 rounded" />
                      <div className="h-3 w-32 bg-slate-50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid gap-4">
              {filteredMaterials.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group border-b-4 border-b-slate-100 hover:border-b-secondary"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-primary tracking-tight">{m.title}</h3>
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-widest">
                            {m.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                          {m.description || 'Access high-quality study material curated for serious aspirants.'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDownload(e, m.url)}
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 hover:bg-secondary hover:shadow-secondary/20 transition-all whitespace-nowrap active:scale-95"
                    >
                      Download <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-primary tracking-tight">No Materials Found</h3>
              <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-2">
                We couldn't find any documents matching your search. Try adjusting the query.
              </p>
            </div>
          )}

          {/* Help Note */}
          <div className="mt-12 bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100/50 flex items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-indigo-900 uppercase tracking-[0.1em] mb-1">Standard Access</p>
              <p className="text-xs text-indigo-600/80 font-medium leading-relaxed">
                Clicking "Download" will open the document safely. You must be logged in to access our premium resource library.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
