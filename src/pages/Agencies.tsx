import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, ShieldCheck } from 'lucide-react';

export default function Agencies() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const q = query(collection(db, 'agencies'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const ags = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })).filter(a => a.status !== 'draft');
        ags.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAgencies(ags);
      } catch (err) {
        console.error("Error fetching agencies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  const filteredAgencies = agencies.filter(agency => 
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-4">Recruitment Agencies</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto md:mx-0">Select your target recruitment agency to view all related exams and study materials.</p>
        </header>

        <section className="mb-12 max-w-md">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Search Agencies</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search by agency name... (e.g. JKSSB)"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : filteredAgencies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgencies.map((agency) => (
              <Link 
                key={agency.id} 
                to={`/agency/${agency.id}`}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:border-primary transition-all group flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden p-3 border border-slate-100 mb-6 group-hover:scale-105 transition-transform">
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt={agency.name} className="w-full h-full object-contain" />
                  ) : (
                    <ShieldCheck className="w-10 h-10 text-slate-300 group-hover:text-primary transition-colors" />
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-primary tracking-tight mb-2 group-hover:text-secondary">{agency.name}</h3>
                {agency.description && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">{agency.description}</p>
                )}
                <div className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold group-hover:bg-primary group-hover:text-white transition-all uppercase tracking-widest">
                  View Exams
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-primary mb-2">No agencies found</h3>
            <p className="text-slate-500">Try adjusting your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
