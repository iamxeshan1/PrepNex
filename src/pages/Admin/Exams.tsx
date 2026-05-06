import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  X, 
  Loader2, 
  Edit3, 
  MoreVertical,
  Activity,
  FileText
} from 'lucide-react';

export default function AdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [cat, setCat] = useState('GOVERNMENT');
  const [price, setPrice] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [status, setStatus] = useState('live');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExamsAndAgencies();
  }, []);

  const fetchExamsAndAgencies = async () => {
    try {
      const [examsSnap, agenciesSnap] = await Promise.all([
        getDocs(collection(db, 'exams')),
        getDocs(collection(db, 'agencies'))
      ]);
      setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAgencies(agenciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const examData = {
      name,
      agencyId,
      category: cat,
      price: Number(price),
      isPaid: isPaid,
      status,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      await updateDoc(doc(db, 'exams', editingId), examData);
    } else {
      await addDoc(collection(db, 'exams'), {
        ...examData,
        createdAt: new Date().toISOString()
      });
    }

    setShowAddForm(false);
    setEditingId(null);
    fetchExamsAndAgencies();
    resetForm();
  };

  const startEdit = (exam: any) => {
    setEditingId(exam.id);
    setName(exam.name);
    setAgencyId(exam.agencyId || '');
    setCat(exam.category || 'GOVERNMENT');
    setPrice((exam.price ?? 0).toString());
    setIsPaid(exam.isPaid || false);
    setStatus(exam.status || 'live');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(''); setAgencyId(''); setPrice('0'); setIsPaid(false); setStatus('live');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      try {
        await deleteDoc(doc(db, 'exams', id));
        fetchExamsAndAgencies();
      } catch (error) {
        alert("Failed to delete exam");
      }
    }
  };

  const StatCard = ({ title, value, span, trend, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {trend && <p className="text-xs font-semibold text-emerald-600">{trend}</p>}
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="Exam Catalog">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage and monitor high-stakes recruitment and entrance examinations.</p>
        <button 
          onClick={() => { if(showAddForm) { resetForm(); setShowAddForm(false); } else { setShowAddForm(true); } }}
          className="bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Cancel Form' : 'Create New Exam'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Exams" value={exams.length} trend="~12% this month" />
        <StatCard title="Active Candidates" value="8.4k" trend="~4.2k active now" />
        <StatCard title="Avg. Revenue/Exam" value="₹4.2k" span="Last 30 days" />
        <div className="bg-[#111827] text-white p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
           <div>
             <p className="text-sm font-medium text-slate-400 mb-2">System Health</p>
             <h3 className="text-4xl font-bold tracking-tight mb-2">99.9% Uptime</h3>
           </div>
           <p className="text-xs text-slate-300 relative z-10 w-2/3 leading-relaxed">
             All regional servers operating at peak performance for current active test sessions.
           </p>
           <Activity className="absolute bottom-4 right-4 w-24 h-24 text-slate-800" />
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingId ? 'Edit Exam' : 'Add New Exam'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Exam Name</label>
                <input required placeholder="e.g. JKSSB Sub-Inspector" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Organization</label>
                <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                  <option value="">Select Governing Body</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                 <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white uppercase" value={cat} onChange={(e) => setCat(e.target.value)}>
                    <option value="GOVERNMENT">Government</option>
                    <option value="MEDICAL">Medical</option>
                    <option value="STAFF SELECTION">Staff Selection</option>
                    <option value="CIVIL SERVICES">Civil Services</option>
                 </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Access Type</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white" value={isPaid ? 'paid' : 'free'} onChange={(e) => setIsPaid(e.target.value === 'paid')}>
                  <option value="free">Free Access</option>
                  <option value="paid">Paid Premium</option>
                </select>
              </div>
              {isPaid && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price (INR)</label>
                  <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="live">Published</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
               <button type="submit" className="bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-800 transition-colors">
                 {editingId ? 'Save Changes' : 'Create Exam'}
               </button>
            </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <button className="px-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white shadow-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Filter By Category
             </button>
             <button className="px-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white shadow-sm flex items-center gap-2">
                Organization: All
             </button>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing 1 - {exams.length} of {exams.length} EXAMS</p>
        </div>
        
        {loading ? (
           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-teal-600 w-8 h-8" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Exam Details</th>
                <th className="p-4 font-semibold">Organization</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Pricing</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const org = agencies.find(a => a.id === exam.agencyId)?.name || 'Unknown';
                return (
                  <tr key={exam.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                           <Link to={`/admin/tests/${exam.id}`} className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                             {exam.name}
                           </Link>
                           <p className="text-xs font-medium text-slate-400 mt-0.5">ID: {exam.id.slice(0,12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{org}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {exam.category || 'GOVERNMENT'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{exam.isPaid ? `₹${exam.price}` : '₹0'}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex w-fit mt-1 ${exam.isPaid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {exam.isPaid ? 'PAID' : 'FREE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 capitalize">
                         <span className={`w-2 h-2 rounded-full ${exam.status === 'draft' ? 'bg-slate-300' : 'bg-emerald-500'}`}></span>
                         {exam.status === 'live' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                       <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button onClick={() => startEdit(exam)} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors">
                             <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(exam.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/admin/exam/management/${exam.id}`)} className="p-2 hover:bg-slate-200 rounded transition-colors" title="Manage Exam">
                             <MoreVertical className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
