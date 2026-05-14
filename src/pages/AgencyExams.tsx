import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, ShieldCheck, Lock, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AgencyExams() {
  const { profile } = useAuth();
  const { agencyId } = useParams();
  const [agency, setAgency] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!agencyId) return;
      try {
        const agencySnap = await getDoc(doc(db, 'agencies', agencyId));
        if (agencySnap.exists()) {
          setAgency({ id: agencySnap.id, ...agencySnap.data() });
        }

        const q = query(collection(db, 'exams'), where('agencyId', '==', agencyId));
        const examSnap = await getDocs(q);
        setExams(examSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(e => e.status !== 'draft'));
      } catch (err) {
        console.error("Error fetching agency exams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agencyId]);

  const filteredExams = exams.filter(exam => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {agency && (
          <header className="mb-12 flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
             {/* Background decorative */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center p-4 border-4 border-white shadow-xl z-10 shrink-0">
                {agency.logoUrl ? (
                  <img src={agency.logoUrl} alt={agency.name} loading="lazy" decoding="async" width="128" height="128" className="w-full h-full object-contain" />
                ) : (
                  <ShieldCheck className="w-16 h-16 text-slate-300" />
                )}
             </div>
             <div className="z-10 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Link to="/agencies" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">Agencies</Link>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{agency.name}</span>
                </div>
                <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">{agency.name} Exams</h1>
                {agency.description && (
                  <p className="text-slate-500 font-medium max-w-2xl">{agency.description}</p>
                )}
             </div>
          </header>
        )}

        <section className="mb-8 max-w-md mx-auto md:mx-0">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Search in {agency?.name}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search by exam name..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {filteredExams.map((exam) => {
              const isEnrolled = profile?.isPremium || profile?.purchasedExams?.includes(exam.id) || profile?.freeExams?.includes(exam.id) || false;
              return (
              <div 
                key={exam.id} 
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:border-primary transition-all group flex flex-col justify-between h-full"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden p-3 group-hover:bg-primary/5 transition-colors shrink-0">
                    {agency?.logoUrl ? (
                      <img src={agency.logoUrl} alt={agency.name} loading="lazy" decoding="async" width="80" height="80" className="w-full h-full object-contain" />
                    ) : (
                      <FileText className="w-full h-full text-slate-300 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-2xl font-black text-primary tracking-tight group-hover:text-secondary transition-colors">{exam.name}</h3>
                      <div className="flex gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${exam.isPaid ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {exam.isPaid ? 'Premium' : 'Free'}
                        </span>
                        {exam.isPopular && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">Popular</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.25em] flex-wrap">
                      <span className="text-primary/60">{agency?.name}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span>{exam.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${exam.difficulty === 'Easy' ? 'text-green-500' : exam.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-500'}`}>{exam.difficulty || 'Medium'}</span>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl line-clamp-3">
                      Comprehensive mock test series and study material for thorough preparation. Includes detailed solutions and real-time performance analytics.
                    </p>
                  </div>
                  
                  <div className="w-full md:w-56 shrink-0 space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 flex flex-col justify-center">
                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-1 mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.isPaid ? 'Premium Access' : 'Free Access'}</span>
                      <div className="text-3xl font-black text-primary flex items-center gap-2">
                        {exam.isPaid ? `₹${exam.price}` : 'FREE'}
                        {exam.isPaid && <Lock className="w-4 h-4 text-slate-300 mb-1" />}
                      </div>
                    </div>
                    {isEnrolled ? (
                      <div className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] bg-[#001f19] text-white opacity-80 cursor-default">
                        <CheckCircle2 className="w-4 h-4" /> ENROLLED
                      </div>
                    ) : (
                      <Link 
                        to={`/exam/${exam.id}`}
                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:scale-[1.03] transition-all shadow-xl active:scale-95 ${
                          exam.isPaid 
                            ? 'bg-secondary text-white shadow-secondary/20' 
                            : 'bg-primary text-white shadow-primary/20'
                        }`}
                      >
                        {exam.isPaid ? 'Enroll Now' : 'Get Started'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-primary mb-2">No exams found for {agency?.name}</h3>
            <p className="text-slate-500">Check back later for updates.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
