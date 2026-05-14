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
  Wallet,
  X,
  FileText,
  Shield,
  Loader2,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';


export default function AdminSubscriptions() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'basic'>('all');
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);

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
          const rawAmount = data.amount ?? data.totalAmount ?? data.price ?? 0;
          const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
          const date = data.purchaseDate || data.createdAt || data.date;
          if (date) { allTransactions.push({ amount, date: new Date(date) }); }
        });
      };
      
      addTransactions(subsSnap);
      addTransactions(premiumSnap);

      let total = 0;
      let monthTotal = 0;
      const now = new Date();
      
      allTransactions.forEach(tx => {
        total += tx.amount || 0;
        if (tx.date.getMonth() === now.getMonth() && tx.date.getFullYear() === now.getFullYear()) {
          monthTotal += tx.amount || 0;
        }
      });

      setTotalRevenue(total);
      setThisMonthRevenue(monthTotal);
    } catch (error) {
       console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
       console.error(error);
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
       console.error(error);
    }
  };

  const revokeAccess = async (userId: string, confirmed = false) => {
    if (!window.confirm("Verify: Revoke premium access for this entity?")) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionExpiry: null,
        isPremium: false
      });
      fetchUsers();
    } catch (error) {
       console.error(error);
    }
  };

  const exportSubscriptions = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ["PrepNext - Global Subscriptions Ledger"],
      ["Date Generated:", new Date().toLocaleString()],
      [],
      ["MEMBERSHIP AUDIT"],
      ["Total Entities", users.length],
      ["Premium Nodes", users.filter(u => !!u.subscriptionExpiry).length],
      ["Basic Nodes", users.filter(u => !u.subscriptionExpiry).length],
      ["Lifecycle Revenue", `₹${totalRevenue.toLocaleString()}`],
      [],
      ["MONTHLY PERFORMANCE"],
      ["Cycle Yield", `₹${thisMonthRevenue.toLocaleString()}`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Audit Summary");

    const detailData = users.map(u => ({
      "Entity Name": u.name || 'Anonymous',
      "Alias Email": u.email,
      "Membership Tier": u.subscriptionExpiry ? 'PREMIUM' : 'BASIC',
      "Expiry Offset": u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : 'N/A',
      "Assessment History": u.testsAttempted || 0,
      "Network Integrity": u.emailVerified ? 'VERIFIED' : 'PENDING'
    }));
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, wsDetail, "Entity Register");

    XLSX.writeFile(wb, `Dispatch_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || (filterType === 'premium' ? !!u.subscriptionExpiry : !u.subscriptionExpiry))
  );

  return (
    <AdminLayout title="Membership Control">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Subscription Registry</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Monitor and authorize global membership permissions</p>
        </div>
        <button 
          onClick={exportSubscriptions}
          className="px-8 py-4 bg-[#064e40] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
        >
          <Download className="w-5 h-5 flex-shrink-0" /> Extract Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
         {[
           { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50' },
           { label: 'Cycle Yield', value: `₹${thisMonthRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Premium Nodes', value: users.filter(u => !!u.subscriptionExpiry).length, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' }
         ].map((stat, i) => (
           <motion.div 
             key={stat.label} 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -translate-y-1/2 translate-x-1/2 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                 <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tight font-display">{stat.value}</h4>
           </motion.div>
         ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] outline-none shadow-sm focus:ring-4 focus:ring-teal-500/5 font-bold text-slate-700"
            placeholder="Search entity registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
          {(['all', 'premium', 'basic'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-[#064e40] text-white shadow-lg' : 'text-slate-400 hover:text-teal-600 hover:bg-slate-50'}`}
            >
              {type} Nodes
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3.5rem] shadow-sm overflow-hidden mb-40">
        {loading ? (
          <div className="py-24 text-center">
             <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Registry Nodes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Identity</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Threshold Offset</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidacy Status</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(user => {
                  const isPremium = !!user.subscriptionExpiry;
                  const expiry = isPremium ? new Date(user.subscriptionExpiry) : null;
                  const isExpired = expiry && expiry < new Date();

                  return (
                    <tr key={user.id} className="hover:bg-teal-50/20 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black relative overflow-hidden group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            {user.name?.[0].toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-black text-[#001f19] uppercase tracking-tight text-sm leading-none mb-1.5">{user.name || 'Anonymous Node'}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight italic">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-slate-200" />
                          <span className="text-xs font-black text-slate-600">
                            {expiry ? expiry.toLocaleDateString() : 'Baseline Tier'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        {isPremium ? (
                          isExpired ? (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100">
                               <X className="w-3.5 h-3.5" /> Expired Access
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Premium Verified
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                             Basic Access
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          {[1, 3, 12].map(m => (
                            <button
                              key={m}
                              onClick={() => setSubscription(user.id, m)}
                              className="px-4 py-2 bg-white border border-slate-100 text-slate-400 hover:text-teal-600 hover:border-teal-100 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95"
                              title={`Grant ${m} Month Access`}
                            >
                              +{m}M
                            </button>
                          ))}
                          {isPremium && (
                            <button
                              onClick={() => revokeAccess(user.id)}
                              className="w-10 h-10 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                              title={`Revoke Permissions`}
                            >
                              <X className="w-5 h-5" />
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
              <div className="py-40 text-center">
                 <Users className="w-20 h-20 text-slate-50 mx-auto mb-6" />
                 <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Target Node Not Found in Current Segment</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#064e40] py-4 px-8 rounded-full shadow-2xl flex items-center gap-6 z-40 border border-[#001f19]">
         <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Institutional Privacy Enforced</span>
         </div>
      </div>
    </AdminLayout>
  );
}
