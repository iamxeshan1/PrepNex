import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Layout } from '../components/Layout';
import { 
  Zap, 
  Users, 
  Clock, 
  Calendar, 
  ArrowRight,
  Shield,
  Loader2,
  Lock,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LiveTests() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'liveTests'), (snap) => {
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by start time (upcoming first)
      fetched.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setLiveTests(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = liveTests.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="bg-[#f8fafc] min-h-screen">
        {/* Header Section */}
        <section className="bg-[#0f172a] pt-24 pb-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(45,212,191,0.1),transparent)]" />
          <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 text-[#2dd4bf] px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8 border border-[#2dd4bf]/20"
            >
              <Zap className="w-3 h-3 fill-current" /> Live Examination Portal
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-sans font-[800] text-white mb-6 tracking-tighter"
            >
              Real-Time Competitive <span className="text-[#2dd4bf]">Trials.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg font-medium max-w-2xl mx-auto mb-10 tracking-tight"
            >
              Participate in globally scheduled live tests and see where you stand among thousands of aspirants across J&K.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto relative group"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#2dd4bf] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by exam category or title..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-medium outline-none focus:ring-2 focus:ring-[#2dd4bf]/20 focus:border-[#2dd4bf] transition-all"
              />
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20 pb-24">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#2dd4bf] animate-spin mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Live Schedule...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-slate-200 shadow-xl">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No live tests found</h3>
              <p className="text-slate-500 font-medium">Try searching with a different keyword or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((test, idx) => {
                const startTime = new Date(test.startTime);
                const isUpcoming = startTime > new Date();
                const isLive = new Date() >= startTime && new Date() <= new Date(test.endTime);
                
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-[#2dd4bf]/30 transition-all group overflow-hidden flex flex-col"
                  >
                    <div className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                          isLive 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {isLive ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                              LIVE NOW
                            </span>
                          ) : (
                            isUpcoming ? 'UPCOMING' : 'FINISHED'
                          )}
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${test.isFree ? 'bg-[#ccfbf1] text-[#0f766e]' : 'bg-amber-100 text-amber-700'} uppercase tracking-widest`}>
                          {test.isFree ? 'FREE ACCESS' : `₹ ${test.price}`}
                        </span>
                      </div>

                      <span className="text-[10px] font-black text-[#2dd4bf] mb-2 block tracking-[0.2em] uppercase">{test.category || 'GENERAL'}</span>
                      <h3 className="text-xl font-sans font-[800] text-[#0f172a] group-hover:text-[#008770] transition-colors tracking-tight line-clamp-2 mb-6">
                        {test.title}
                      </h3>

                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-slate-500">
                          <Calendar className="w-4 h-4 text-[#008770]" />
                          <span className="text-xs font-bold uppercase tracking-wider">{startTime.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <Clock className="w-4 h-4 text-[#008770]" />
                          <span className="text-xs font-bold uppercase tracking-wider">{startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <Users className="w-4 h-4 text-[#008770]" />
                          <span className="text-xs font-bold uppercase tracking-wider">{(test.enrolledUsers?.length || 0) + 120}+ Aspirants</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto p-8 pt-0">
                      <button 
                        onClick={() => navigate(`/live-test/${test.id}`)}
                        className={`w-full py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                          isLive 
                            ? 'bg-[#0f172a] text-white hover:bg-slate-800 shadow-xl shadow-slate-200' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        disabled={!isLive && isUpcoming === false}
                      >
                        {isLive ? 'Enroll & Participate' : (isUpcoming ? 'Scheduled Soon' : 'Already Ended')}
                        {isLive && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Premium Upgrade CTA */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="bg-[#0f172a] rounded-[3.5rem] p-12 md:p-20 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(45,212,191,0.15),transparent)] pointer-events-none" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div>
                  <div className="w-16 h-16 bg-[#2dd4bf]/10 rounded-2xl flex items-center justify-center text-[#2dd4bf] mb-8">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-sans font-[800] text-white mb-6 tracking-tighter leading-none">
                    Unlock Unlimited <br/> Live Access.
                  </h2>
                  <p className="text-slate-400 text-lg font-medium max-w-sm mb-10 leading-relaxed tracking-tight">
                    Premium members get priority access to all live tests, expert evaluations, and detailed ranking analytics.
                  </p>
                  <button 
                    onClick={() => navigate('/premium')}
                    className="bg-[#2dd4bf] text-[#0f172a] px-10 py-4.5 rounded-2xl font-black text-xs hover:bg-[#5eead4] transition-all uppercase tracking-[0.2em]"
                  >
                    UPGRADE TO PREMIUM
                  </button>
                </div>
                <div className="hidden lg:grid grid-cols-2 gap-6">
                  {[
                    { label: 'Instant Ranking', icon: Zap },
                    { label: 'Subject Insights', icon: Shield },
                    { label: 'Global Aspirants', icon: Users },
                    { label: 'Timed Precision', icon: Clock },
                  ].map((feat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                      <feat.icon className="w-8 h-8 text-[#2dd4bf] mb-4" />
                      <p className="text-white font-bold text-sm tracking-tight">{feat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
