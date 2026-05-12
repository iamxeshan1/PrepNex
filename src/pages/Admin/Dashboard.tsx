import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Plus,
  Zap,
  Shield,
  Star,
  Target,
  Rocket,
  Loader2,
  Calendar,
  ArrowRight,
  GraduationCap,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';

const chartData = [
  { name: 'WEEK 1', yield: 45000, active: 1200 },
  { name: 'WEEK 2', yield: 52000, active: 1500 },
  { name: 'WEEK 3', yield: 48000, active: 1400 },
  { name: 'WEEK 4', yield: 61000, active: 1800 },
  { name: 'WEEK 5', yield: 59000, active: 1700 },
  { name: 'WEEK 6', yield: 75000, active: 2200 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    exams: 0,
    activeSubscriptions: 0,
    tests: 0,
    revenue: 0
  });
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const unsubExams = onSnapshot(collection(db, 'exams'), (snap) => {
      setStats(prev => ({ ...prev, exams: snap.docs.filter(d => d.data().status === 'live').length }));
    });

    // Fetch recent transactions from both subscriptions and premium_subscriptions
    const fetchRecent = async () => {
      const [subsSnap, premSnap] = await Promise.all([
        getDocs(query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'), limit(10))),
        getDocs(query(collection(db, 'premium_subscriptions'), orderBy('createdAt', 'desc'), limit(10)))
      ]);
      
      const allSubs = [
        ...subsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ...premSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      ].sort((a: any, b: any) => {
        const da = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt).getTime() || 0);
        const dbTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt).getTime() || 0);
        return dbTime - da;
      }).slice(0, 10);
      
      setRecentSubs(allSubs);
      setLoading(false);
    };

    fetchRecent();

    // Real revenue calculation from both collections
    Promise.all([
      getDocs(collection(db, 'subscriptions')),
      getDocs(collection(db, 'premium_subscriptions'))
    ]).then(([subsSnap, premSnap]) => {
       const subsTotal = subsSnap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
       const premTotal = premSnap.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
       setStats(prev => ({ ...prev, revenue: subsTotal + premTotal }));
    });

    return () => {
      unsubUsers();
      unsubExams();
    };
  }, []);

  const StatCard = ({ title, value, span, icon: Icon, colorIcon, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
         <p className="text-sm font-medium text-slate-500">{title}</p>
         <Icon className={`w-5 h-5 ${colorIcon}`} />
      </div>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Dashboard">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Overview of system operations, user growth, and financial metrics.</p>
        <button className="bg-teal-700 text-white px-5 py-2.5 font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors">
           <Download className="w-5 h-5" /> Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.users.toLocaleString()} 
          span="+14% from last month" 
          icon={Users} 
          colorIcon="text-indigo-500" 
        />
        <StatCard 
          title="Revenue" 
          value={`₹${(stats.revenue/1000).toFixed(1)}K`} 
          span="+8.2% from last month" 
          icon={CreditCard} 
          colorIcon="text-emerald-500" 
        />
        <StatCard 
          title="Active Exams" 
          value={stats.exams} 
          span="Currently live and visible" 
          icon={BookOpen} 
          colorIcon="text-teal-500" 
        />
        <StatCard 
          title="System Health" 
          value="99.9%" 
          span="All subsystems fully operational" 
          icon={Shield} 
          colorIcon="text-emerald-500" 
          colorClass="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900">Revenue & Engagement</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Daily trend of active users and successful transactions.</p>
                 </div>
                 <div className="flex bg-slate-100 p-1 border border-slate-200">
                    {['7D', '30D', '90D', 'ALL'].map(t => (
                       <button key={t} className={`px-4 py-1.5 text-sm font-bold transition-all ${t === '30D' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {t}
                       </button>
                    ))}
                 </div>
              </header>

              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}K`} dx={-10} />
                       <Tooltip contentStyle={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: '600' }} />
                       <Area type="monotone" dataKey="yield" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                       <Area type="monotone" dataKey="active" stroke="#94a3b8" strokeWidth={2} fillOpacity={0} borderDasharray="3 3" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
         </div>

         <div className="space-y-8">
            <div className="bg-white p-6 border border-slate-200 flex flex-col min-h-[450px]">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
                   <p className="text-sm font-medium text-slate-500">Latest active plan purchases</p>
                 </div>
                 <button className="text-teal-600 hover:text-teal-700 p-2 border border-slate-200">
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
 
               <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                 {recentSubs.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100">
                       <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-4" />
                       <p className="text-sm font-bold text-slate-400">Loading records...</p>
                    </div>
                 ) : recentSubs.map((sub, i) => {
                    const dateObj = sub.createdAt?.seconds ? new Date(sub.createdAt.seconds * 1000) : new Date(sub.createdAt);
                    return (
                    <div key={sub.id} className="p-4 border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm">
                             {(sub.userName?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900">{sub.userName || 'Anonymous'}</p>
                             <p className="text-xs font-semibold text-slate-500">{dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">₹{sub.amount || 0}</p>
                          <p className="text-xs font-bold text-slate-400">{sub.planName || 'Plan'}</p>
                       </div>
                    </div>
                 )})}
               </div>
            </div>
         </div>
      </div>
    </AdminLayout>
  );
}
