import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Download, 
  Search, 
  TrendingUp,
  Wallet,
  Calendar,
  Filter,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminRevenue() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubSubs = onSnapshot(collection(db, 'subscriptions'), () => processData());
    const unsubPremium = onSnapshot(collection(db, 'premium_subscriptions'), () => processData());
    return () => { unsubSubs(); unsubPremium(); };
  }, []);

  const processData = async () => {
    try {
      const [subsSnap, premiumSnap] = await Promise.all([
        getDocs(collection(db, 'subscriptions')),
        getDocs(collection(db, 'premium_subscriptions'))
      ]);

      console.log(`[AdminRevenue] Found ${subsSnap.size} subscription docs and ${premiumSnap.size} premium subscription docs.`);

      const allDocs = [
        ...subsSnap.docs.map(d => ({ ...d.data(), id: d.id, source: 'Standard' })),
        ...premiumSnap.docs.map(d => ({ ...d.data(), id: d.id, source: 'Premium' }))
      ];

      const allTransactions: any[] = [];
      let total = 0;
      let monthTotal = 0;
      const now = new Date();
      const monthlyStats: Record<string, number> = {};

      allDocs.forEach((data: any) => {
        console.log("Analyzing data object:", JSON.stringify(data, null, 2));
        const amount = Number(data.amount || data.totalAmount || data.price || data.total_amount || 0);
        const rawDate = data.purchaseDate || data.createdAt || data.date || data.timestamp;
        const date = rawDate?.seconds ? new Date(rawDate.seconds * 1000) : new Date(rawDate || Date.now());
        
        allTransactions.push({
          id: data.id,
          paymentId: data.paymentId || 'N/A',
          amount,
          date,
          type: data.planName || data.type || data.source,
          status: data.paymentStatus || data.status || 'Success',
          userName: data.userName || data.userEmail?.split('@')[0] || 'Student',
          coupon: data.couponCode || 'None',
          userId: data.userId || 'N/A'
        });

        if (data.paymentStatus === 'completed' || data.status === 'Success' || !data.paymentStatus) {
           total += amount;
           if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
             monthTotal += amount;
           }
           const monthKey = date.toLocaleString('default', { month: 'short' });
           monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + amount;
        }
      });

      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setTransactions(allTransactions);
      setTotalRevenue(total);
      setThisMonthRevenue(monthTotal);

      const chartFormatted = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
        name: month,
        amount: monthlyStats[month] || 0
      }));

      setChartData(chartFormatted);
      setLoading(false);
    } catch (error) {
      console.error("Error processing revenue data:", error);
      setLoading(false);
    }
  };

  const clearTransactions = async () => {
    if (!window.confirm("Are you sure you want to clear all transaction records? This cannot be undone.")) return;
    try {
      setLoading(true);
      await fetch('/api/admin/clear-transactions', { method: 'POST' });
      processData();
    } catch (e) {
      alert("Failed to clear transactions");
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    const wb = XLSX.utils.book_new();
    const exportData = filteredTransactions.map(t => ({
      "Transaction ID": t.id,
      "Razorpay Payment ID": t.paymentId,
      "User": t.userName,
      "Amount": t.amount,
      "Date": t.date.toLocaleDateString(),
      "Coupon": t.coupon,
      "Status": t.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Report");
    XLSX.writeFile(wb, `PrepNext_Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTransactions = transactions.filter(t => 
    t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, color, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      </div>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{value.toLocaleString()}</h3>
    </div>
  );

  return (
    <AdminLayout title="Revenue & Finance">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <StatCard title="Total Gross Revenue" value={totalRevenue} color="bg-emerald-50 text-emerald-600" icon={Wallet} />
        <StatCard title="Monthly Recurring Revenue" value={thisMonthRevenue} color="bg-blue-50 text-blue-600" icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-10">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Revenue Trends</h3>
          <button onClick={exportTransactions} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>
        <div className="h-[300px] p-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="amount" stroke="#0ea5e9" fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Recent Transactions</h3>
          <div className="flex gap-2">
            <button onClick={clearTransactions} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-100">
              Clear All
            </button>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Coupon</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-900">{tx.userName}</td>
                  <td className="px-8 py-4 text-[10px] text-slate-500 font-mono">
                    <p className="font-bold text-slate-700">{tx.paymentId !== 'N/A' ? tx.paymentId : 'INTERNAL'}</p>
                    <p className="opacity-50">Ref: {tx.id.slice(-8).toUpperCase()}</p>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-600">{tx.date.toLocaleDateString()}</td>
                  <td className="px-8 py-4 font-bold text-slate-900">₹{tx.amount.toLocaleString()}</td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-500">{tx.coupon}</td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${(tx.status?.toLowerCase() === 'completed' || tx.status === 'Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {(tx.status?.toLowerCase() === 'completed' || tx.status === 'Success') ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}