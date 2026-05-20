import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Search, 
  Download, 
  BookOpen, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Unlock, 
  X,
  BookMarked,
  Filter,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';

interface Material {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  createdAt: string;
  isFree?: boolean; // default true if undef
  coverUrl?: string;
  price?: number;
}

export default function StudyMaterial() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [selectedBook, setSelectedBook] = useState<Material | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{ id: string; name: string; price: number } | null>(null);
  
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

  const categories = ['All', ...Array.from(new Set(materials.map(m => m.category)))];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    
    // handles undefined isFree as true (all older materials default to free)
    const isFreeBook = m.isFree !== false; 
    const matchesPrice = priceFilter === 'all' || 
                         (priceFilter === 'free' && isFreeBook) || 
                         (priceFilter === 'premium' && !isFreeBook);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleBookClick = (book: Material) => {
    setSelectedBook(book);
  };

  const hasAccessToBook = (book: Material) => {
    if (book.isFree !== false) return true;
    if (isAdmin) return true;
    if (profile?.isPremium) return true;
    if (profile?.purchasedExams && profile.purchasedExams.includes(book.id)) return true;
    return false;
  };

  const handleDownload = (e: React.MouseEvent, book: Material) => {
    e.preventDefault();
    if (!user) {
      setSelectedBook(null);
      navigate('/login');
      return;
    }
    
    if (!hasAccessToBook(book)) {
      navigate('/premium');
      return;
    }

    const finalUrl = book.url.startsWith('http') ? book.url : `https://${book.url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="bg-[#f8fafc] min-h-screen pb-20">
        {/* eBook Storefront Hero Banner */}
        <section className="bg-white border-b border-slate-200 pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#006e5d] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#006e5d]/5 border border-[#006e5d]/10 rounded-full text-[#006e5d] text-[10px] font-black uppercase tracking-[0.2em] mb-6"
              >
                <BookMarked className="w-3.5 h-3.5 animate-bounce" /> Digital Study Library & eBook Shelf
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-[900] text-slate-900 tracking-tight leading-none mb-6">
                Premium Exam Books <br/>
                <span className="text-[#006e5d] relative inline-block">
                  At Your Fingertips
                  <span className="absolute bottom-1 left-0 w-full h-1 bg-[#006e5d]/20 rounded" />
                </span>
              </h1>
              
              <p className="text-slate-500 font-semibold text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Unlock instant access to specialized preparation manuals, hand-crafted revision guides, and exam topper ebooks on any device.
              </p>
            </div>

            {/* Smart Library Search Experience */}
            <div className="max-w-2xl mx-auto relative group mb-10">
              <div className="absolute inset-0 bg-[#006e5d]/5 blur-2xl rounded-[3rem] group-focus-within:bg-[#006e5d]/10 transition-all duration-500" />
              <div className="relative bg-white border border-slate-200/80 rounded-2xl p-2 flex items-center shadow-sm focus-within:shadow-xl focus-within:shadow-[#006e5d]/5 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                <input 
                  type="text"
                  placeholder="Insert exam keyword, subject title, or topic..."
                  className="w-full px-4 py-3 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="searchBooksInput"
                />
              </div>
            </div>

            {/* Price Filter Options */}
            <div className="flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-xl max-w-xs mx-auto">
              {(['all', 'free', 'premium'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriceFilter(filter)}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold uppercase transition-all ${priceFilter === filter ? 'bg-white text-[#006e5d] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {filter === 'all' ? 'All Ebooks' : filter === 'free' ? 'Free Books' : 'Premium Only'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Bar & Shelf */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          {/* Categories Horizontal Scroll */}
          <div className="mb-10 overflow-x-auto pb-4 scrollbar-thin">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mr-2 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${selectedCategory === cat ? 'bg-[#006e5d] text-white border-[#006e5d] shadow-md shadow-emerald-900/10' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Core Shelf Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-slate-200 rounded-2xl animate-pulse border border-slate-200" />
                  <div className="h-4 bg-slate-200 w-3/4 rounded animate-pulse" />
                  <div className="h-3 bg-slate-200 w-1/2 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10">
              {filteredMaterials.map((m, index) => {
                const isFree = m.isFree !== false;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    onClick={() => handleBookClick(m)}
                    className="group cursor-pointer flex flex-col items-stretch h-full"
                  >
                    {/* The 3D E-Book Cover Structure */}
                    <div className="relative aspect-[3/4] bg-slate-100 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden mb-4 mr-0.5 select-none border border-slate-200/50">
                      
                      {/* Spine / Crease Binding Effect Overlay */}
                      <div className="absolute left-0 top-0 w-3 h-full bg-gradient-to-r from-black/25 via-white/5 to-transparent z-10" />
                      <div className="absolute left-3 top-0 w-[1px] h-full bg-black/10 z-10" />

                      {/* Cover Image or Design Fallback */}
                      {m.coverUrl ? (
                        <img 
                          src={m.coverUrl} 
                          alt={m.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        /* Beautiful Gradient Fallback for Procedural Covers */
                        <div className="w-full h-full bg-gradient-to-br from-[#0c5c4e] to-slate-900 flex flex-col justify-between p-4 relative text-white">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 opacity-80">{m.category}</p>
                          <div className="space-y-2 my-auto">
                            <h4 className="text-sm font-black tracking-tight leading-snug line-clamp-3 text-emerald-100">{m.title}</h4>
                            <div className="w-8 h-1 bg-amber-400 rounded" />
                          </div>
                          <div className="text-[8px] font-bold text-slate-400 text-right uppercase tracking-widest mt-auto">Study Vault</div>
                        </div>
                      )}

                      {/* Access Sash / Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {isFree ? (
                          <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                            <Unlock className="w-2.5 h-2.5" /> Free
                          </span>
                        ) : hasAccessToBook(m) ? (
                          <span className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <CheckCircle className="w-2.5 h-2.5 text-teal-200" /> Purchased
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                            <Lock className="w-2.5 h-2.5" /> {m.price !== undefined && m.price > 0 ? `₹${m.price}` : 'Premium'}
                          </span>
                        )}
                      </div>

                      {/* Gloss Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                    </div>

                    {/* Book Metadata */}
                    <div className="flex-grow flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{m.category}</span>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-snug line-clamp-2 gap-1 group-hover:text-[#006e5d] transition-colors mb-1">
                        {m.title}
                      </h3>
                      <p className="text-[11.5px] font-medium text-slate-400 line-clamp-2 leading-relaxed">
                        {m.description || 'Comprehensive notes and strategy guide for optimal student performance.'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">No Study Booklets Found</h3>
              <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2 text-sm">
                We couldn't locate any study materials matching your filter selections. Try searching with other parameters.
              </p>
            </div>
          )}
        </section>

        {/* Support Section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
          <div className="bg-[#002f26] rounded-[2rem] p-10 md:p-12 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#006e5d] rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white text-[9px] font-black uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3" /> Can't find what you need?
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">Request Custom eBook Content</h2>
                <p className="text-teal-100 font-medium text-sm md:text-base leading-relaxed">
                  If there's a specific syllabus booklet or competitive exam preparation material you need, submit a request and our content curators will bundle it next.
                </p>
              </div>
              <button 
                onClick={() => navigate('/forum')}
                className="px-8 py-4 bg-white text-[#006e5d] rounded-xl font-extrabold text-xs uppercase tracking-[0.15em] shadow-xl hover:translate-x-1 transition-all shrink-0 flex items-center gap-2"
              >
                Ask on Forum <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* eBook Details & Purchase Paywall Dialog Modal */}
        <AnimatePresence>
          {selectedBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backing Blur Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBook(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              {/* Modal Card content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col md:flex-row"
              >
                {/* Book Left Panel Cover */}
                <div className="w-full md:w-[220px] bg-slate-50 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-200/50 shrink-0">
                  <div className="relative w-36 aspect-[3/4] bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200 select-none">
                    {/* Binding effects */}
                    <div className="absolute left-0 top-0 w-2.5 h-full bg-gradient-to-r from-black/25 via-white/5 to-transparent z-10" />
                    <div className="absolute left-2.5 top-0 w-[1px] h-full bg-black/10 z-10" />
                    
                    {selectedBook.coverUrl ? (
                      <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-[#0c5c4e] to-slate-900 flex flex-col justify-between p-3 text-white">
                        <span className="text-[8px] font-black uppercase text-emerald-300 opacity-80">{selectedBook.category}</span>
                        <h4 className="text-xs font-bold leading-tight line-clamp-3 my-auto">{selectedBook.title}</h4>
                        <span className="text-[7px] text-slate-400 uppercase tracking-widest text-right">Study Book</span>
                      </div>
                    )}
                  </div>
                  
                  <span className={`mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${selectedBook.isFree !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedBook.isFree !== false ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                    {selectedBook.isFree !== false ? 'Free Digital Access' : `Price: ₹${selectedBook.price !== undefined && selectedBook.price > 0 ? selectedBook.price : '199'}`}
                  </span>
                </div>

                {/* Book Right Panel Details */}
                <div className="p-8 flex-grow flex flex-col">
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-black uppercase tracking-widest text-[#006e5d] bg-[#006e5d]/5 px-2.5 py-1 rounded-md mb-2 inline-block self-start">
                    {selectedBook.category}
                  </span>

                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight mb-3 pr-6">
                    {selectedBook.title}
                  </h2>

                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Synopsis / About Booklet</h4>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-6 max-h-[140px] overflow-y-auto pr-1">
                    {selectedBook.description || 'This course-aligned comprehensive eBook compiles master definitions, detailed examples, syllabus mapping patterns, and revision notes to elevate subject performance.'}
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-100">
                    {/* Conditionally render login or premium paywall or action download button */}
                    {!user ? (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-slate-500 font-bold text-xs mb-3 text-center">🔐 Access is restricted to registered students.</p>
                        <button 
                          onClick={(e) => handleDownload(e, selectedBook)}
                          className="w-full py-3 bg-[#006e5d] text-white hover:bg-[#005a4d] transition-all font-black text-xs uppercase tracking-widest rounded-xl text-center"
                        >
                          Sign In to Download E-Book
                        </button>
                      </div>
                    ) : !hasAccessToBook(selectedBook) ? (
                      /* Elegant Locked Premium Paywall Experience */
                      <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 p-5 rounded-2xl border border-amber-500/20 shadow-sm shadow-amber-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 text-amber-500/20 translate-x-2 -translate-y-2">
                          <Lock className="w-16 h-16" />
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-amber-700 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" /> Premium eBook Locked
                          </h4>
                          <p className="text-slate-600 text-xs font-semibold leading-normal mb-4">
                            Unlock this individual booklet for lifetime access, or get instant digital access to all premium booklets, mock exams, and revision notes.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button 
                              onClick={() => {
                                setCheckoutItem({
                                  id: selectedBook.id,
                                  name: selectedBook.title,
                                  price: selectedBook.price !== undefined && selectedBook.price > 0 ? selectedBook.price : 199
                                });
                              }}
                              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-1"
                            >
                              Buy Booklet • ₹{selectedBook.price !== undefined && selectedBook.price > 0 ? selectedBook.price : '199'}
                            </button>
                            <button 
                              onClick={() => { setSelectedBook(null); navigate('/premium'); }}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#d97706] hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-md hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              Upgrade Prep Pass <ArrowRight className="w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Granted Access - Download PDF */
                      <button 
                        onClick={(e) => handleDownload(e, selectedBook)}
                        className="w-full py-3 bg-[#006e5d] hover:bg-[#005345] transition-all text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/10"
                      >
                        Download PDF Booklet <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CheckoutModal 
          isOpen={checkoutItem !== null}
          onClose={() => setCheckoutItem(null)}
          item={checkoutItem || { id: '', name: '', price: 0 }}
          onSuccess={() => {
            setCheckoutItem(null);
          }}
        />
      </div>
    </Layout>
  );
}
