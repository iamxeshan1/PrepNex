import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Search, FileText, Users, CheckCircle2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Exams() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const agencyParam = searchParams.get('agency');
  const [activeTab, setActiveTab] = useState(agencyParam || 'All');
  const [loading, setLoading] = useState(true);

  // Sync activeTab if agencyParam changes
  useEffect(() => {
    if (agencyParam) {
      setActiveTab(agencyParam);
    }
  }, [agencyParam]);
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        
        const agencySnapshot = await getDocs(collection(db, 'agencies'));
        const testsSnapshot = await getDocs(collection(db, 'tests'));
        const testsData = testsSnapshot.docs.map(doc => doc.data());
        const tCounts = {};
        testsData.forEach(t => {
          if (t.examId) tCounts[t.examId] = (tCounts[t.examId] || 0) + 1;
        });
        
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, mockCount: tCounts[doc.id] || doc.data().mockCount || 0, ...doc.data() })));
        setAgencies([{ name: 'All', id: 'All' }, ...agencySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExams = exams.filter(exam => {
    const matchesCategory = activeTab === 'All' || exam.agencyId === activeTab;
    const nameMatches = (exam.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const agencyName = (agencies.find(a => a.id === exam.agencyId)?.name || '').toLowerCase();
    const agencyMatches = agencyName.includes(searchQuery.toLowerCase());
    return matchesCategory && (nameMatches || agencyMatches);
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter mb-4">Explore All Exam Series</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">Access the most comprehensive test series library. Verified by toppers, designed for excellence.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide mb-8">
          {agencies.map((agency) => (
            <button
              key={agency.id}
              onClick={() => setActiveTab(agency.id)}
              className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${
                activeTab === agency.id 
                  ? 'bg-[#006e5d] text-white shadow-lg shadow-[#006e5d]/20' 
                  : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {agency.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {loading ? (
             [1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)
          ) : filteredExams.length > 0 ? (
            filteredExams.map(exam => {
              const agency = agencies.find(a => a.id === exam.agencyId);
              const logo = agency?.logoUrl || exam.logoUrl;
              const isEnrolled = profile?.isPremium || profile?.purchasedExams?.includes(exam.id) || profile?.freeExams?.includes(exam.id) || false;
              return (
                  <motion.div 
                    key={exam.id}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-[#006e5d]/30 transition-all cursor-pointer group flex flex-col relative"
                  >
                    {/* Top Accent Bar */}
                    <div className="h-1.5 w-full bg-[#006e5d]"></div>
                    
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4 gap-2">
                         <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                           {logo ? (
                              <img src={logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                           ) : (
                              <BookOpen className="w-5 h-5 text-slate-300" />
                           )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {exam.isPopular && (
                            <span className="bg-[#b91c1c] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">Popular</span>
                          )}
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase ${exam.isPaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {exam.isPaid ? 'Pass Pro' : 'Free'}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-sans font-[800] text-slate-900 group-hover:text-[#006e5d] transition-colors leading-tight mb-3 line-clamp-2">{exam.name}</h3>
                      
                      <div className="space-y-2 mt-auto pb-4">
                         <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <FileText className="w-4 h-4 text-[#006e5d]" />
                            <span>{exam.mockCount || 0} Total Tests</span>
                         </div>
                         <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Users className="w-4 h-4 text-[#006e5d]" />
                            <span>{exam.enrollCount || 0}+ Enrolled</span>
                         </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-auto">
                        {isEnrolled ? (
                          <div className="w-full text-center py-2 bg-slate-50 text-[#006e5d] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                             <CheckCircle2 className="w-4 h-4" /> Enrolled
                          </div>
                        ) : (
                           <button className="w-full text-center py-2 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                              {exam.isPaid ? 'Unlock Now' : 'Start Free Test'}
                           </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
              )})
          ) : (
            <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
               <p className="text-slate-500 font-bold">No exams found.</p>
               <button onClick={() => setActiveTab('All')} className="mt-4 text-[#006e5d] font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Unlock Pass Section */}
        <div className="bg-[#002f26] rounded-[2rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-display font-black tracking-tight mb-6">Unlock All Exams with One Pass</h2>
            <p className="text-slate-400 font-medium text-base mb-8">Get unlimited access to 500+ test series, previous year papers, and detailed performance analytics.</p>
            <button onClick={() => navigate('/premium')} className="bg-[#006e5d] hover:bg-[#005a4d] text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#006e5d]/20">Get Ultimate Pass</button>
          </div>
          <div className="relative z-10 hidden md:block w-72 h-48 bg-[#002f26] rounded-xl opacity-50 flex items-center justify-center">
            {/* Replace with an image placeholder or illustration */}
            <FileText className="w-16 h-16 text-slate-600" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
