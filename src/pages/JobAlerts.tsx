import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Bell, Briefcase, Calendar, Users, ChevronRight, ExternalLink, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function JobAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const q = query(collection(db, 'jobAlerts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setAlerts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = filter === 'All' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        {/* Header */}
        <div className="bg-[#002f26] text-white pt-24 pb-16 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                   <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-sans font-[800] tracking-tighter">Latest Govt Jobs & Updates</h1>
             </div>
             <p className="text-emerald-100/80 text-lg max-w-2xl font-medium tracking-tight">
               Stay ahead with real-time notifications for upcoming exams, admit cards, and final results.
             </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-8 relative z-10">
          
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-4 mb-8 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-4 text-slate-500 font-bold text-sm uppercase tracking-wider">
               <Filter className="w-4 h-4" /> Filter By
            </div>
            {['All', 'Notification', 'Admit Card', 'Result'].map(t => (
               <button
                 key={t}
                 onClick={() => setFilter(t)}
                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                   filter === t 
                    ? 'bg-[#006e5d] text-white shadow-md' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                 }`}
               >
                 {t}
               </button>
            ))}
          </div>

          {loading ? (
             <div className="text-center py-20 text-slate-500 font-medium">Loading latest updates...</div>
          ) : filteredAlerts.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No updates found</h3>
                <p className="text-slate-500 max-w-md mx-auto">We couldn't find any job alerts for the selected category.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredAlerts.map((alert, idx) => (
                 <motion.div 
                   key={alert.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#006e5d]/30 hover:shadow-2xl hover:shadow-[#006e5d]/5 transition-all flex flex-col group cursor-pointer"
                 >
                   <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                         alert.type === 'Notification' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                         alert.type === 'Admit Card' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                         'bg-purple-50 text-purple-700 border border-purple-100'
                       }`}>
                         {alert.type}
                      </span>
                      {alert.status === 'Active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                          </span>
                      ) : (
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                             Closed
                          </span>
                      )}
                   </div>

                   <h3 className="font-sans font-[800] text-slate-900 text-lg leading-snug mb-2 group-hover:text-[#006e5d] transition-colors">{alert.postName}</h3>
                   <p className="text-sm font-medium text-slate-500 mb-6">{alert.boardInfo}</p>
                   
                   <div className="mt-auto space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                     {alert.vacancies && (
                       <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                         <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                           <Users className="w-3.5 h-3.5" /> 
                         </div>
                         {alert.vacancies}
                       </div>
                     )}
                     <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                       <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                         <Briefcase className="w-3.5 h-3.5" /> 
                       </div>
                       <span className="truncate" title={alert.qualification}>{alert.qualification || 'Any Qualification'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                       <div className="w-6 h-6 rounded-md bg-white border border-red-100 flex items-center justify-center text-red-400">
                         <Calendar className="w-3.5 h-3.5" /> 
                       </div>
                       Last Date: {new Date(alert.lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </div>
                   </div>

                   {alert.applyLink && (
                     <div className="mt-4 pt-4 border-t border-slate-100">
                       <a 
                         href={alert.applyLink} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all
                           bg-[#006e5d] text-white hover:bg-[#005a4d] shadow-sm hover:shadow-md"
                       >
                         {alert.type === 'Result' ? 'Check Result' : alert.type === 'Admit Card' ? 'Download Admit Card' : 'Apply Now'}
                         <ExternalLink className="w-4 h-4" />
                       </a>
                     </div>
                   )}
                 </motion.div>
               ))}
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
