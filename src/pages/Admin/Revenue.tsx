import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Download, 
  Search, 
  TrendingUp,
  Wallet,
  Calendar
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
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const subsSnap = await getDocs(query(collection(db, 'subscriptions')));
      const premiumSnap = await getDocs(query(collection(db, 'premium_subscriptions')));
      
      const allTransactions: any[] = [];
      const addTransactions = (snap: any, type: string) => {
        snap.docs.forEach((doc: any) => {
          const data = doc.data();
          if (data.purchaseDate) {
            allTransactions.push({
              id: doc.id,
              amount: data.amount || 0,
              date: new Date(data.purchaseDate),
              type: type,
              coupon: data.couponCode || 'N/A',
              userName: data.userName || 'Anonymous'
            });
          }
        });
      };
      
      addTransactions(subsSnap, 'Standard');
      addTransactions(premiumSnap, 'Premium');
      
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

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
      setTransactions(allTransactions);

      const chartFormatted = Object.entries(monthlyData).map(([name, amount]) => ({
        name,
        amount
      })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
      
      setChartData(chartFormatted);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue:", error);
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    const wb = XLSX.utils.book_new();
    const exportData = transactions.map(t => ({
      "Transaction ID": t.id,
      "User Name": t.userName,
      "Amount": t.amount,
      "Date": t.date.toLocaleDateString(),
      "Type": t.type,
      "Coupon": t.coupon
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `PrepNext_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTransactions = transactions.filter(t => 
    t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Revenue Management">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 flex-shrink-0">
              <Wallet className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-1">Total Revenue</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">₹{totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary flex-shrink-0">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-1">This Month</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">₹{thisMonthRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Revenue Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                  <Tooltip formatter={(value: number) => [`₹${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="#e0e7ff" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Transaction Table */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-primary font-medium"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                onClick={exportTransactions}
                className="flex items-center gap-2 px-6 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all"
            >
                <Download className="w-4 h-4" /> Export Excel
            </button>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Plan Bought</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coupon Used</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-slate-700">{t.userName}</td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600">{t.type}</td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700">
                      {t.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{t.date.toLocaleDateString()}</td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{t.coupon}</td>
                    <td className="px-8 py-6 text-sm font-black text-primary">₹{t.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
