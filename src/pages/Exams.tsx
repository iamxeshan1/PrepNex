import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getExams } from '../services/db';
import { Search, Filter, ShieldCheck, Lock } from 'lucide-react';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchExams = async () => {
      const data = await getExams();
      setExams(data || []);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const categories = ['All', 'Government Jobs', 'Medical', 'Engineering', 'Banking', 'Police'];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All' || exam.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-4">Exam Prep Library</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto md:mx-0">Find and unlock comprehensive test series for all major competitive exams.</p>
        </header>

        <section className="flex flex-col md:flex-row gap-6 mb-12 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Search Exams</label>
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
          
          <div className="w-full md:w-64 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none appearance-none cursor-pointer font-bold text-sm text-primary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {filteredExams.map((exam) => (
              <div 
                key={exam.id} 
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:border-primary transition-all group flex flex-col justify-between h-full"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden p-3 group-hover:bg-primary/5 transition-colors shrink-0">
                    {exam.logoUrl ? (
                      <img src={exam.logoUrl} alt={exam.name} className="w-full h-full object-contain" />
                    ) : (
                      <ShieldCheck className="w-full h-full text-slate-300 group-hover:text-primary transition-colors" />
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
                    
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.25em]">
                      <span className="text-primary/60">{exam.organization}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span>{exam.category}</span>
                      <span className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.25em]">&bull;</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${exam.difficulty === 'Easy' ? 'text-green-500' : exam.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-500'}`}>{exam.difficulty || 'Medium'}</span>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                      {exam.description || "Comprehensive mock test series and study material for thorough preparation. Includes detailed solutions and real-time performance analytics."}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-primary mb-2">No exams found</h3>
            <p className="text-slate-500">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
