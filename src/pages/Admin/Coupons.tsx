import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Trash2, Ticket, Power, Activity } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'coupons'));
    setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;
    
    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        isActive,
        createdAt: new Date().toISOString()
      });
      setCode('');
      setDiscountValue('');
      setDiscountType('fixed');
      setIsActive(true);
      setShowAdd(false);
      fetchCoupons();
    } catch (err) {
      alert("Failed to create coupon.");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), {
        isActive: !currentStatus
      });
      fetchCoupons();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this coupon permanently?")) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      fetchCoupons();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <AdminLayout title="Coupons">
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in">
        <div>
          <h2 className="text-xl font-black text-secondary tracking-tight">Active Promo Codes</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage discounts for purchases</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all font-logo"
        >
          {showAdd ? 'Cancel' : <><Plus className="w-5 h-5" /> Create Coupon</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Coupon Code</label>
              <input 
                type="text" required uppercase 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary uppercase font-mono tracking-widest font-bold"
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} 
                placeholder="e.g. FESTIVAL50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Discount Type</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                value={discountType} onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Discount Value</label>
              <input 
                type="number" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} 
                placeholder={discountType === 'fixed' ? 'e.g. 500' : 'e.g. 20'}
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-100">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                checked={isActive} onChange={(e) => setIsActive(e.target.checked)} 
              />
              <span className="text-sm font-bold text-slate-700">Activate Immediately</span>
            </div>
          </div>
          
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo">
            Save Coupon
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full z-0 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    coupon.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {coupon.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                
                <h3 className="text-2xl font-black font-mono text-secondary tracking-tight mb-2 uppercase break-all">
                  {coupon.code}
                </h3>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6">
                  <div className="text-center font-bold text-primary font-logo text-xl">
                    {coupon.discountType === 'fixed' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                    className="flex-[3] py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
                  >
                    {coupon.isActive ? <Power className="w-4 h-4 text-red-500" /> : <Activity className="w-4 h-4 text-green-500" />}
                    {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={() => handleDelete(coupon.id)}
                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group/btn"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
