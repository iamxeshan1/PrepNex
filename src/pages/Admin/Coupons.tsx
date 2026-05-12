import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Plus, Trash2, Ticket, Power, Activity, X, Zap, Loader2, Search, Users } from 'lucide-react';
import { useItemTitles } from '../../hooks/useItemTitles';

export default function AdminCoupons() {
  const { getItemTitle } = useItemTitles();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Usage Modal State
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [couponUsers, setCouponUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'coupons'));
    setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;
    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minAmount: discountType === 'fixed' && minAmount ? Number(minAmount) : null,
        isActive,
        createdAt: new Date().toISOString()
      });
      setCode(''); setDiscountValue(''); setMinAmount(''); setDiscountType('fixed'); setIsActive(true);
      setShowAdd(false);
      fetchCoupons();
    } catch (err) {
       console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { isActive: !currentStatus });
      fetchCoupons();
    } catch (err) {
       console.error(err);
    }
  };

  const handleDelete = async (id: string, confirmed = false) => {
    if (!confirmed) { uiConfirm("Delete this coupon?", () => handleDelete(id, true)); return; }
    try {
      await deleteDoc(doc(db, 'coupons', id));
      fetchCoupons();
    } catch (err) {
       console.error(err);
    }
  };

  const viewCouponUsage = async (coupon: any) => {
    setSelectedCoupon(coupon);
    setUsageModalOpen(true);
    setLoadingUsers(true);
    setCouponUsers([]);
    try {
      const q1 = query(collection(db, 'subscriptions'), where('couponCode', '==', coupon.code));
      const q2 = query(collection(db, 'premium_subscriptions'), where('couponCode', '==', coupon.code));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const usages: any[] = [];
      
      const processSnap = (snap: any) => {
        snap.forEach((docSnap: any) => {
           const data = docSnap.data();
           usages.push({
              id: docSnap.id,
              userId: data.userId,
              userName: data.userName || data.userEmail?.split('@')[0] || 'Unknown User',
              purchaseDate: data.purchaseDate || data.createdAt || new Date().toISOString(),
              amount: data.amount || 0,
              type: data.type || 'Purchase',
              collection: snap === snap2 ? "premium_subscriptions" : "subscriptions",
              examId: data.examId || null
           });
        });
      };
      
      processSnap(snap1);
      processSnap(snap2);
      
      usages.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      setCouponUsers(usages);
    } catch (err) {
      console.error("Failed to fetch coupon usages:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const StatCard = ({ title, value, span, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-4">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {span && <p className="text-xs font-semibold text-slate-400 mt-1">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage promotional tokens and discount protocols.</p>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-indigo-800 transition-colors"
        >
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAdd ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Coupons" value={coupons.length} span="All time" colorClass="text-indigo-600" />
        <StatCard title="Active Protocols" value={coupons.filter(c => c.isActive).length} span="Currently active" colorClass="text-emerald-600" />
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 mb-8 relative border-b border-slate-200">
           <button type="button" onClick={() => setShowAdd(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Ticket className="w-5 h-5 text-indigo-600" /> Forge New Token</h3>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Coupon Code</label>
               <input 
                 type="text" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase font-bold text-slate-800"
                 value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} 
                 placeholder="e.g. ALPHA2024"
               />
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Type</label>
               <select 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                 value={discountType} onChange={(e) => setDiscountType(e.target.value)}
               >
                 <option value="fixed">Fixed Amount (₹)</option>
                 <option value="percentage">Percentage (%)</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Value</label>
               <input 
                 type="number" required 
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-indigo-500 focus:border-indigo-500 font-bold text-slate-800"
                 value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} 
                 placeholder={discountType === 'fixed' ? '500' : '20'}
               />
             </div>
             
             {discountType === 'fixed' && (
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Amount (Optional)</label>
                 <input 
                   type="number"
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-indigo-500 focus:border-indigo-500 font-bold text-slate-800"
                   value={minAmount} onChange={(e) => setMinAmount(e.target.value)} 
                   placeholder="e.g. 1000"
                 />
               </div>
             )}
           </div>

           <div className="mt-8 flex items-center gap-6">
              <button type="submit" className="bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors flex items-center gap-2">
                <Zap className="w-4 h-4" /> Create Coupon
              </button>
              <label className="flex items-center gap-3 cursor-pointer">
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                   checked={isActive} onChange={(e) => setIsActive(e.target.checked)} 
                 />
                 <span className="text-sm font-bold text-slate-700">Activate Immediately</span>
              </label>
           </div>
        </form>
      )}

      <div className="bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search coupons..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} COUPONS</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Code</th>
                <th className="p-4 font-semibold">Value</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
                          <Ticket className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="font-black text-slate-900 group-hover:text-indigo-700 transition-colors uppercase tracking-wider text-sm mt-0.5">
                           {coupon.code}
                         </p>
                         {coupon.minAmount && (
                            <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase tracking-wider">Min ₹{coupon.minAmount}</p>
                         )}
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <span className="text-sm font-black text-slate-800">
                        {coupon.discountType === 'fixed' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`} OFF
                     </span>
                  </td>
                  <td className="p-4">
                     <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                       coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                     }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {coupon.isActive ? 'Active' : 'Inactive'}
                     </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                     <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button 
                           onClick={() => viewCouponUsage(coupon)}
                           className="p-2 rounded hover:bg-indigo-50 text-indigo-500 transition-colors" 
                           title="View Usage"
                        >
                           <Users className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                           className={`p-2 rounded transition-colors ${coupon.isActive ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-emerald-50 text-emerald-500'}`} 
                           title={coupon.isActive ? "Deactivate" : "Activate"}
                        >
                           {coupon.isActive ? <Power className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No coupons found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {usageModalOpen && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> 
                  Usage: {selectedCoupon.code}
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Total uses: {couponUsers.length}</p>
              </div>
              <button 
                 onClick={() => setUsageModalOpen(false)}
                 className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 hover:bg-rose-50 rounded-lg"
              >
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
               {loadingUsers ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
               ) : couponUsers.length > 0 ? (
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                        <tr>
                          <th className="p-3 rounded-l-lg">User</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3 rounded-r-lg">Date</th>
                        </tr>
                     </thead>
                     <tbody>
                        {couponUsers.map((u, i) => (
                           <tr key={u.id + '_' + i} className="border-b border-slate-50 last:border-0 text-sm">
                              <td className="p-3 font-semibold text-slate-900">{u.userName}</td>
                              <td className="p-3 font-medium text-slate-500">{getItemTitle(u.examId || (u.collection === "premium_subscriptions" ? "PREMIUM_PASS" : null), u.type) || u.examId || 'Purchase'}</td>
                              <td className="p-3 font-black text-slate-700">₹{u.amount}</td>
                              <td className="p-3 font-medium text-slate-400">{new Date(u.purchaseDate).toLocaleDateString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="py-12 text-center text-slate-500 font-medium">
                     No usages found for this coupon yet.
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
