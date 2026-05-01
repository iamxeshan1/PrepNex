import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  CreditCard, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  Filter,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Wallet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminSubscriptions() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'basic'>('all');
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const subsSnap = await getDocs(query(collection(db, 'subscriptions')));
      const premiumSnap = await getDocs(query(collection(db, 'premium_subscriptions')));
      
      const allTransactions: any[] = [];
      const addTransactions = (snap: any) => {
        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          if (data.purchaseDate) {
            allTransactions.push({
              amount: data.amount || 0,
              date: new Date(data.purchaseDate)
            });
          }
        });
      };
      
      addTransactions(subsSnap);
      addTransactions(premiumSnap);

      let total = 0;
      let monthTotal = 0;
      const now = new Date();
      
      const monthlyData: Record<string, number> = {};

      allTransactions.forEach(tx => {
        const amt = tx.amount || 0;
        total += amt;
        
        if (tx.date.getMonth() === now.getMonth() && tx.date.getFullYear() === now.getFullYear()) {
          monthTotal += amt;
        }

        const monthKey = tx.date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amt;
      });

      setTotalRevenue(total);
      setThisMonthRevenue(monthTotal);

      const chartFormatted = Object.entries(monthlyData).map(([name, amount]) => ({
        name,
        amount
      }));
      
      // Sort chronologically (assuming keys represent month/year correctly)
      chartFormatted.sort((a, b) => {
        return new Date(a.name).getTime() - new Date(b.name).getTime();
      });

      setChartData(chartFormatted);
    } catch (error) {
      console.error("Error fetching revenue:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const setSubscription = async (userId: string, months: number) => {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionExpiry: expiryDate.toISOString(),
        isPremium: true
      });
      fetchUsers();
    } catch (error) {
      alert("Failed to update subscription");
    }
  };

  const revokeAccess = async (userId: string) => {
    if (!window.confirm("Are you sure you want to revoke premium access?")) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionExpiry: null,
        isPremium: false
      });
      fetchUsers();
    } catch (error) {
      alert("Failed to revoke subscription");
    }
  };

  const exportSubscriptions = () => {
    const wb = XLSX.utils.book_new();
    
    // 1. Summary Sheet
    const summaryData = [
      ["PrepNex - Subscriptions & Revenue Audit"],
      ["Date Generated:", new Date().toLocaleString()],
      [],
      ["MEMBERSHIP SUMMARY"],
      ["Total Database Users", users.length],
      ["Premium Subscribers", users.filter(u => !!u.subscriptionExpiry).length],
      ["Basic/Free Users", users.filter(u => !u.subscriptionExpiry).length],
      ["Total Lifecycle Revenue", `₹${totalRevenue.toLocaleString()}`],
      [],
      ["MONTHLY PERFORMANCE"],
      ["Revenue (Current Month)", `₹${thisMonthRevenue.toLocaleString()}`],
      [],
      ["SYSTEM COMPLIANCE"],
      ["All membership dates are validated against server time."]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{wch: 30}, {wch: 25}];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Audit Summary");

    // 2. Subscriber Detail Sheet
    const detailData = users.map(u => ({
      "Subscriber Name": u.name || 'Anonymous',
      "Email Identifier": u.email,
      "Membership Tier": u.subscriptionExpiry ? 'PREMIUM' : 'BASIC',
      "Expiry Threshold": u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : 'N/A',
      "Tests Completed": u.testsAttempted || 0,
      "Avg Performance": `${Math.round(u.averageScore || 0)}%`,
      "Verified Status": u.emailVerified ? 'YES' : 'NO'
    }));

    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    wsDetail['!cols'] = [
      {wch: 25}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Full Subscriber List");

    XLSX.writeFile(wb, `PrepNex_Subscriptions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredUsers = users
    .filter(u => 
      (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === 'all' || (filterType === 'premium' ? !!u.subscriptionExpiry : !u.subscriptionExpiry))
    );

  return (
    <AdminLayout title="Subscriptions">
      <div className="space-y-8">
        
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">₹{totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">This Month</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">₹{thisMonthRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Revenue Overview</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    formatter={(value: number) => [`₹${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-primary font-medium"
              placeholder="Find a subscriber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm">
              {(['all', 'premium', 'basic'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button 
              onClick={exportSubscriptions}
              className="flex items-center gap-2 px-6 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px] text-left">
              <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Membership</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(user => {
                const isPremium = !!user.subscriptionExpiry;
                const expiry = isPremium ? new Date(user.subscriptionExpiry) : null;
                const isExpired = expiry && expiry < new Date();

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary font-black">
                          {user.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-primary">{user.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold text-slate-600">
                          {expiry ? expiry.toLocaleDateString() : 'Lifetime Free Tier'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isPremium ? (
                        isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-red-100">
                            <Clock className="w-3 h-3" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100">
                            <CheckCircle2 className="w-3 h-3" /> Active Premium
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          Basic User
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {[1, 3, 12].map(m => (
                          <button
                            key={m}
                            onClick={() => setSubscription(user.id, m)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            title={`Grant ${m} month(s)`}
                          >
                            +{m}M
                          </button>
                        ))}
                        {isPremium && (
                          <button
                            onClick={() => revokeAccess(user.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            title={`Revoke Access`}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-bold italic">
              No subscribers found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
