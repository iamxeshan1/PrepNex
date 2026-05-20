import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Download, 
  BookOpen, 
  Search, 
  Unlock, 
  Sparkles, 
  ArrowRight,
  BookMarked,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  createdAt: string;
  isFree?: boolean;
  coverUrl?: string;
  price?: number;
}

export default function MyEbooks() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user, profile, isAdmin } = useAuth();
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

  const hasAccessToBook = (book: Material) => {
    if (book.isFree !== false) return true;
    if (isAdmin) return true;
    if (profile?.isPremium) return true;
    if (profile?.purchasedExams && profile.purchasedExams.includes(book.id)) return true;
    return false;
  };

  // We only show books the user has purchased/unlocked!
  // This means:
  // 1. Paid books where book.id is in profile.purchasedExams
  // 2. Or if they are premium, all premium booklets
  // 3. And let's also list free books they saved or have universal access to for completeness!
  const myPurchasedBooks = materials.filter(book => {
    // Only premium/paid books they have access to, OR free books (which are universally accessible)
    // Actually, let's prioritize books they have purchased/unlocked!
    const isFreeBook = book.isFree !== false;
    
    if (isFreeBook) return false; // Let's keep the purchased eBooks tab focused on PAID eBooks they bought or have premium access to!
    return hasAccessToBook(book);
  });

  const filteredBooks = myPurchasedBooks.filter(book => {
    return book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           book.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           book.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDownload = (e: React.MouseEvent, book: Material) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const finalUrl = book.url.startsWith('http') ? book.url : `https://${book.url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="bg-[#f8fafc] min-h-screen pb-20">
        {/* Header section */}
        <section className="bg-white border-b border-slate-200 pt-32 pb-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#006e5d] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#006e5d]/5 border border-[#006e5d]/10 rounded-full text-[#006e5d] text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                <BookMarked className="w-3.5 h-3.5" /> Checked Out Study Guides
              </div>
              
              <h1 className="text-3xl md:text-4xl font-sans font-[900] text-slate-900 tracking-tight leading-none mb-3">
                My Purchased eBooks
              </h1>
              
              <p className="text-slate-500 font-semibold text-sm max-w-xl leading-relaxed">
                Direct downlinks to the preparatory guides and syllabus manuals you have purchased for your studies.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Grid section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 mt-10">
          {myPurchasedBooks.length > 0 && (
            <div className="max-w-md mb-8 relative group">
              <div className="relative bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center shadow-sm focus-within:shadow-md transition-all">
                <Search className="w-4 h-4 text-slate-400 ml-3" />
                <input 
                  type="text" 
                  placeholder="Search purchased booklets..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none font-bold text-slate-700"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006e5d]" />
            </div>
          ) : myPurchasedBooks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 md:p-20 text-center max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Purchased Books Yet</h3>
              <p className="text-slate-500 font-semibold max-w-md mx-auto mt-3 text-sm leading-relaxed">
                You haven't purchased any premium eBook booklets individually yet. Unlock preparation manuals to read study materials offline.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate('/study-material')}
                  className="px-6 py-3.5 bg-[#006e5d] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#005a4d] transition-all flex items-center justify-center gap-2"
                >
                  Browse eBook Store <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => navigate('/premium')}
                  className="px-6 py-3.5 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  Get All-Access Prep Pass <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 py-16 text-center">
              <p className="text-slate-400 font-bold text-base">No titles match your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((m) => {
                return (
                  <motion.div
                    key={m.id}
                    layoutId={`purchased-book-${m.id}`}
                    className="group bg-white rounded-3xl border border-slate-200/65 overflow-hidden flex flex-col p-5 hover:border-teal-500/20 hover:shadow-xl hover:shadow-[#006e5d]/5 transition-all duration-300"
                  >
                    {/* Visual Cover Layer container */}
                    <div className="relative aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden select-none mb-4 shrink-0 flex items-center justify-center border border-slate-200/50">
                      {m.coverUrl ? (
                        <img 
                          src={m.coverUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0c5c4e] to-slate-900 flex flex-col justify-between p-4 text-white">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 opacity-80">{m.category}</p>
                          <div className="space-y-2 my-auto">
                            <h4 className="text-sm font-black tracking-tight leading-snug line-clamp-3 text-emerald-100">{m.title}</h4>
                            <div className="w-8 h-1 bg-amber-400 rounded" />
                          </div>
                          <div className="text-[8px] font-bold text-slate-400 text-right uppercase tracking-widest mt-auto">Purchased</div>
                        </div>
                      )}

                      {/* Purchased Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-1 bg-[#006e5d] text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-2.5 h-2.5 text-teal-200" /> Unlocked
                        </span>
                      </div>

                      {/* Gloss Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                    </div>

                    {/* Book Metadata */}
                    <div className="flex-grow flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{m.category}</span>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 mb-1">
                          {m.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 line-clamp-2 leading-relaxed">
                          {m.description || 'Comprehensive notes and strategy guide for optimal student performance.'}
                        </p>
                      </div>

                      <button 
                        onClick={(e) => handleDownload(e, m)}
                        className="w-full py-2.5 bg-[#006e5d] hover:bg-[#005345] transition-all text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        Download Booklet <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
