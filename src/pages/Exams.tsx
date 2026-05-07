import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Search, FileText, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Exams() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        setExams(examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const agencySnapshot = await getDocs(collection(db, 'agencies'));
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
    return matchesCategory && nameMatches;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tighter mb-4">Explore All Exam Series</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">Access Jammu & Kashmir's most comprehensive test series library. Verified by toppers, designed for excellence.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-6 scrollbar-hide mb-8">
          {agencies.map((agency) => (
            <button
              key={agency.id}
              onClick={() => setActiveTab(agency.id)}
              className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${
                activeTab === agency.id 
                  ? 'bg-[#006e5d] text-white shadow-lg shadow-[#008770]/20' 
                  : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {agency.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {loading ? (
             [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />)
          ) : filteredExams.length > 0 ? (
            filteredExams.map(exam => {
              const agency = agencies.find(a => a.id === exam.agencyId);
              const logo = agency?.logoUrl || exam.logoUrl;
              const isEnrolled = profile?.isPremium || profile?.purchasedExams?.includes(exam.id) || profile?.freeExams?.includes(exam.id) || false;
              return (
              <motion.div 
                 key={exam.id}
                 whileHover={{ y: -8 }}
                 onClick={() => navigate(`/exam/${exam.id}`)} 
                 className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#008770]/20 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 group-hover:bg-teal-50 transition-colors shadow-sm shrink-0">
                         {logo ? (
                            <img src={logo} alt="" className="w-full h-full object-contain" />
                         ) : (
                            <Shield className="w-6 h-6 text-slate-300 group-hover:text-[#008770] transition-colors" />
                         )}
                      </div>
                      <h3 className="text-lg font-display font-[800] text-[#0f172a] group-hover:text-[#008770] transition-colors tracking-tighter line-clamp-1">{exam.name}</h3>
                   </div>
                   {exam.isPopular && (
                     <span className="bg-[#b91c1c] text-white text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase shrink-0">MOST POPULAR</span>
                   )}
                   {exam.isNew && (
                     <span className="bg-[#ccfbf1] text-[#0f766e] text-[8px] font-black px-2 py-1 rounded-md tracking-widest uppercase shrink-0">NEW BATCH</span>
                   )}
                </div>
                
                <div className="flex items-center gap-4 mb-6 text-slate-400">
                   <div className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-bold">{exam.mockCount || 0} Mocks</span>
                   </div>
                   <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-bold">{exam.enrollCount || 0} Enrolled</span>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">{exam.isPaid ? 'PREMIUM' : 'FREE TRIAL'}</span>
                  {isEnrolled ? (
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-700 tracking-[0.05em] uppercase">
                       <CheckCircle2 className="w-3.5 h-3.5" /> ENROLLED
                    </div>
                  ) : (
                    <button className="text-[10px] font-black text-[#008770] tracking-[0.05em] uppercase hover:underline transition-all">
                      {exam.isPaid ? 'ENROLL NOW' : 'TRY FREE'}
                    </button>
                  )}
                </div>
              </motion.div>
            )})
          ) : (
            <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
               <p className="text-slate-500 font-bold">No exams found.</p>
               <button onClick={() => setActiveTab('All')} className="mt-4 text-teal-600 font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Unlock Pass Section */}
        <div className="bg-[#0f172a] rounded-[2rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-display font-black tracking-tight mb-6">Unlock All Exams with One Pass</h2>
            <p className="text-slate-400 font-medium text-base mb-8">Get unlimited access to 500+ test series, previous year papers, and detailed performance analytics.</p>
            <button onClick={() => navigate('/premium')} className="bg-[#008770] hover:bg-[#006e5d] text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#008770]/20">Get Ultimate Pass</button>
          </div>
          <div className="relative z-10 hidden md:block w-72 h-48 bg-slate-800 rounded-xl opacity-50 flex items-center justify-center">
            {/* Replace with an image placeholder or illustration */}
            <FileText className="w-16 h-16 text-slate-600" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
