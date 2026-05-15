import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { FileText, ExternalLink, Search, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function PYQs() {
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPYQs = async () => {
      try {
        const q = query(collection(db, 'pyqs'), orderBy('year', 'desc'));
        const snap = await getDocs(q);
        setPyqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching PYQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPYQs();
  }, []);

  const filteredPYQs = pyqs.filter(p => 
    p.examName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.year.includes(searchTerm)
  );

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="bg-[#002f26] text-white pt-24 pb-16 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
           <div className="max-w-7xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-5xl font-sans font-[800] tracking-tighter mb-4">Previous Year Papers Vault</h1>
              <p className="text-emerald-100/80 text-lg max-w-2xl mx-auto font-medium tracking-tight mb-8">
                Master your exams by practicing with authentic previous year question papers and accurate solutions.
              </p>
              
              <div className="max-w-xl mx-auto relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by exam name, subject, or year..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl"
                />
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 relative z-10">
           {loading ? (
             <div className="text-center py-20 text-slate-500 font-medium">Loading archives...</div>
           ) : filteredPYQs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-lg mx-auto">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Papers Found</h3>
                <p className="text-slate-500">We couldn't find any papers matching your search criteria.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPYQs.map((pyq, idx) => (
                  <motion.div 
                    key={pyq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#006e5d]/30 hover:shadow-xl transition-all group flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                       <div className="bg-[#006e5d]/10 text-[#006e5d] p-3 rounded-xl">
                          <FileText className="w-6 h-6" />
                       </div>
                       <span className="px-3 py-1 bg-slate-100 text-slate-700 font-black text-xs rounded-lg">{pyq.year}</span>
                    </div>
                    
                    <h3 className="text-lg font-[800] text-slate-900 mb-1 group-hover:text-[#006e5d] transition-colors">{pyq.examName}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6 flex-grow">{pyq.subject}</p>
                    
                    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                      {pyq.paperUrl && (
                        <a href={pyq.paperUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-[#006e5d] text-slate-700 hover:text-white rounded-xl text-sm font-bold transition-all">
                          Paper <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {pyq.solutionUrl && (
                        <a href={pyq.solutionUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-xl text-sm font-bold transition-all">
                          Solution <ShieldCheck className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
