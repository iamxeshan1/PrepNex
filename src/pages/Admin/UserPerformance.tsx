import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Clock, BookOpen, ChevronRight, Target, Download, ArrowLeft } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { format } from 'date-fns';

export default function UserPerformance() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    bestSubject: '',
    weakestSubject: '',
    accuracy: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        const [resSnap, subSnap] = await Promise.all([
          getDocs(query(collection(db, 'results'), where('userId', '==', userId), orderBy('date', 'desc'))),
          getDocs(collection(db, 'subjects'))
        ]);

        const allResults = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResults(allResults);

        const sMap: Record<string, string> = {};
        const sArr: any[] = [];
        subSnap.forEach(doc => {
          sMap[doc.id] = doc.data().name;
          sArr.push({ id: doc.id, ...doc.data() });
        });
        setSubjectNames(sMap);
        setSubjects(sArr);

        // Calculate Stats
        if (allResults.length > 0) {
          const totalScore = allResults.reduce((acc, curr: any) => acc + (curr.score || 0), 0);
          const avgScore = Math.round(totalScore / allResults.length);
          
          const subjectAggregation: Record<string, { correct: number, total: number }> = {};
          allResults.forEach((res: any) => {
            if (res.subjectStats) {
              Object.entries(res.subjectStats).forEach(([id, s]: [string, any]) => {
                if (id === 'general') return;
                if (!subjectAggregation[id]) subjectAggregation[id] = { correct: 0, total: 0 };
                subjectAggregation[id].correct += s.correct || 0;
                subjectAggregation[id].total += s.total || 0;
              });
            }
          });

          const subjPerformance = Object.entries(subjectAggregation)
            .map(([id, s]) => ({
              id,
              name: sMap[id] || id,
              accuracy: Math.round((s.correct / Math.max(1, s.total)) * 100)
            }))
            .sort((a, b) => b.accuracy - a.accuracy);

          setStats({
            totalTests: allResults.length,
            averageScore: avgScore,
            accuracy: avgScore, // Using avg score as a proxy for total accuracy
            bestSubject: subjPerformance[0]?.name || 'N/A',
            weakestSubject: subjPerformance[subjPerformance.length - 1]?.name || 'N/A'
          });
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Chart Data preparation
  const trendData = results.slice(0, 10).reverse().map(r => ({
    name: format(new Date(r.date.seconds * 1000 || r.date), 'MMM dd'),
    score: r.score
  }));

  const getSubjectChartData = () => {
    const subjectAggregation: Record<string, { correct: number, total: number }> = {};
    results.forEach((res: any) => {
      if (res.subjectStats) {
        Object.entries(res.subjectStats).forEach(([id, s]: [string, any]) => {
          if (id === 'general') return;
          if (!subjectAggregation[id]) subjectAggregation[id] = { correct: 0, total: 0 };
          subjectAggregation[id].correct += s.correct || 0;
          subjectAggregation[id].total += s.total || 0;
        });
      }
    });
    return Object.entries(subjectAggregation).map(([id, s]) => ({
      subject: (subjectNames[id] || id).split(' ').slice(0, 2).join(' '),
      score: Math.round((s.correct / Math.max(1, s.total)) * 100)
    })).sort((a,b) => b.score - a.score).slice(0, 6);
  };

  const subjectData = getSubjectChartData();

  if (loading) return (
    <AdminLayout title="User Performance" backTo="/admin/users">
      <div className="flex items-center justify-center min-h-[50vh]">
         <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={`Performance: ${userProfile?.name || 'User'}`} backTo="/admin/users">
      <div className="max-w-7xl mx-auto space-y-8 p-4">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Attempts', value: stats.totalTests, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Avg Accuracy', value: `${stats.accuracy}%`, icon: Target, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Best Subject', value: stats.bestSubject, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Improvement Area', value: stats.weakestSubject, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' }
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label} 
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 truncate">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Trend */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" /> Score Trend
              </h3>
            </div>
            <div className="h-[300px] w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0d9488" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                  No data to visualize yet.
                </div>
              )}
            </div>
          </div>

          {/* Subject Mastery Radar */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-10 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Subject Mastery
            </h3>
            <div className="flex-1 min-h-[300px]">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="subject" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#002f26' }}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#0d9488' : entry.score > 40 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                  Take more tests to unlock analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test History */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" /> Recent Attempts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                    <tr className="text-left bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Title</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Accuracy</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {results.length > 0 ? results.map((res) => {
                      const date = new Date(res.date.seconds * 1000 || res.date);
                      const isExcellent = res.score >= 80;
                      const isWarning = res.score < 40;
                      
                      return (
                      <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${res.type === 'live' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {res.type === 'live' ? <TrendingUp className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="font-bold text-[#001f19] text-sm">{res.testTitle || 'Mock Test Attempt'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.type || 'Standard'}</p>
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`text-sm font-black ${isExcellent ? 'text-teal-600' : isWarning ? 'text-red-500' : 'text-slate-700'}`}>
                                {res.score}%
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isExcellent ? 'bg-teal-500' : isWarning ? 'bg-red-500' : 'bg-amber-400'}`}
                                    style={{ width: `${res.score}%` }}
                                  />
                                </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center">
                                <p className="text-xs font-bold text-slate-600">{format(date, 'MMM dd, yyyy')}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{format(date, 'hh:mm a')}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => navigate(`/result/${res.id}`)}
                              className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                                Review <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                      </tr>
                    )}) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">
                              No performance records for this user.
                          </td>
                        </tr>
                    )}
                </tbody>
              </table>
            </div>
        </section>
      </div>
    </AdminLayout>
  );
}
