import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, getDocs, doc, updateDoc, writeBatch, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, 
  User, 
  Mail, 
  Ban, 
  ShieldCheck, 
  Trophy, 
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  MoreVertical,
  Star,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('name', 'asc'))),
        getDocs(collection(db, 'exams'))
      ]);
      setUsers(uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setExams(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      setConfirmingDeleteId(null);
      alert("User deleted permanently.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user record.");
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: !currentStatus
      });
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
    } catch (error) {
      alert("Failed to update block status");
    }
  };

  const handleExportUsers = () => {
    const wb = XLSX.utils.book_new();

    // 1. Executive Summary
    const summaryData = [
      ["PrepNext - Student Roster & Growth Metrics"],
      ["Snapshot Date:", new Date().toLocaleString()],
      [],
      ["ACCOUNTS OVERVIEW"],
      ["Total Registered Students", users.length],
      ["Verified Accounts", users.filter(u => u.emailVerified).length],
      ["Blocked Accounts", users.filter(u => u.isBlocked).length],
      [],
      ["MEMBERSHIP TIERS"],
      ["Premium Plan Subscribers", users.filter(u => u.isPremium).length],
      ["Basic Plan Students", users.filter(u => !u.isPremium).length],
      [],
      ["ENGAGEMENT SUMMARY"],
      ["Total Mock Tests Taken", users.reduce((acc, curr) => acc + (curr.testsAttempted || 0), 0)],
      ["Avg. Student Score (Overall)", `${Math.round(users.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / (users.length || 1))}%`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{wch: 30}, {wch: 25}];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Growth Summary");

    // 2. Student Master List
    const data = users.map(u => ({
      'Legal Name': u.name || 'N/A',
      'Email Identity': u.email,
      'Phone': u.phone || 'N/A',
      'Address': u.address || 'N/A',
      'District': u.district || 'N/A',
      'State': u.state || 'N/A',
      'System Role': u.role?.toUpperCase() || 'STUDENT',
      'Account Health': u.isBlocked ? 'SUSPENDED' : 'OPERATIONAL',
      'Access Type': u.subscriptionExpiry ? 'PREMIUM' : 'BASIC',
      'Proficiency %': `${Math.round(u.averageScore || 0)}%`,
      'Mock Tests Done': u.testsAttempted || 0,
      'Account Created': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
      'Email Verified': u.emailVerified ? 'YES' : 'NO'
    }));

    const wsUsers = XLSX.utils.json_to_sheet(data);
    wsUsers['!cols'] = [
      {wch: 25}, {wch: 30}, {wch: 15}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 18}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 15}
    ];
    XLSX.utils.book_append_sheet(wb, wsUsers, "Student Roster");

    XLSX.writeFile(wb, `PrepNext_Student_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const grantFreeAccess = async (userId: string, examId: string) => {
    const user = users.find(u => u.id === userId);
    const freeExams = user.freeExams || [];
    if (freeExams.includes(examId)) return;

    const newFreeExams = [...freeExams, examId];
    try {
      await updateDoc(doc(db, 'users', userId), {
        freeExams: newFreeExams
      });
      setUsers(users.map(u => u.id === userId ? { ...u, freeExams: newFreeExams } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, freeExams: newFreeExams });
    } catch (error) {
      alert("Failed to grant access");
    }
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1); // 1 year by default
      
      await updateDoc(doc(db, 'users', userId), {
        isPremium: !currentStatus,
        premiumExpiry: !currentStatus ? expiry.toISOString() : null
      });
      
      setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentStatus, premiumExpiry: !currentStatus ? expiry.toISOString() : null } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, isPremium: !currentStatus, premiumExpiry: !currentStatus ? expiry.toISOString() : null });
    } catch (error) {
      alert("Failed to update premium status");
    }
  };

  const revokeFreeAccess = async (userId: string, examId: string) => {
    const user = users.find(u => u.id === userId);
    const newFreeExams = (user.freeExams || []).filter((id: string) => id !== examId);
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        freeExams: newFreeExams
      });
      setUsers(users.map(u => u.id === userId ? { ...u, freeExams: newFreeExams } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, freeExams: newFreeExams });
    } catch (error) {
      alert("Failed to revoke access");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="User Management">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 font-bold" />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-primary font-medium"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportUsers}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" /> Export Student Data
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[800px]">
              <thead>
                  <tr className="border-b border-slate-50">
                   <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                   <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subscription</th>
                   <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Performance</th>
                   <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                   <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity</th>
                   <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredUsers.map(user => {
                   const status = user.isPremium ? 'Premium' : (user.purchasedExams?.length > 0 || user.freeExams?.length > 0 ? 'Basic' : 'Free');
                   const lastActive = user.lastLogin || user.lastActive || user.createdAt;
                   return (
                     <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${user.isBlocked ? 'bg-red-50/20' : ''}`}>
                       <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${user.role === 'admin' ? 'bg-orange-500' : 'bg-primary'}`}>
                             {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : user.name?.[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="font-bold text-primary flex items-center gap-2">
                               {user.name}
                               {user.role === 'admin' && <span className="text-[8px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">ADMIN</span>}
                             </p>
                             <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                              {user.phone && <p className="text-[10px] text-secondary font-black">{user.phone}</p>}
                              {user.district && <p className="text-[10px] text-slate-400">{user.district}, {user.state}</p>}
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                         <div className="flex flex-col gap-2">
                           <span className={`w-fit inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                             status === 'Premium' ? 'bg-purple-50 text-purple-600 border-purple-100 shadow-sm shadow-purple-100' :
                             status === 'Basic' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             'bg-slate-50 text-slate-400 border-slate-100'
                           }`}>
                             {status} Access
                           </span>
                           {user.isPremium && user.premiumExpiry && (
                             <p className="text-[9px] font-bold text-purple-400 uppercase flex items-center gap-1">
                               <Calendar className="w-2.5 h-2.5" /> Expires {new Date(user.premiumExpiry).toLocaleDateString()}
                             </p>
                           )}
                           {!user.isPremium && (user.freeExams?.length > 0 || user.purchasedExams?.length > 0) && (
                             <p className="text-[9px] font-bold text-blue-400 uppercase">
                               {(user.freeExams?.length || 0) + (user.purchasedExams?.length || 0)} Exams Unlocked
                             </p>
                           )}
                         </div>
                       </td>
                       <td className="px-8 py-6">
                         <div className="w-48 space-y-3">
                           <div className="space-y-1">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                               <span>Performance Rank</span>
                               <span className="text-primary">{Math.round(user.averageScore || 0)}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                               <div 
                                 className="h-full bg-primary transition-all duration-1000" 
                                 style={{ width: `${Math.min(100, user.averageScore || 0)}%` }} 
                               />
                             </div>
                           </div>
                           <div className="space-y-1">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                               <span>Exam Stamina</span>
                               <span className="text-secondary">{user.testsAttempted || 0} Tests</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                               <div 
                                 className="h-full bg-secondary transition-all duration-1000" 
                                 style={{ width: `${Math.min(100, ((user.testsAttempted || 0) / 50) * 100)}%` }} 
                               />
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                     {user.isBlocked ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-red-100">
                         <Ban className="w-3 h-3" /> Blocked
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100">
                         <CheckCircle2 className="w-3 h-3" /> Active
                       </span>
                     )}
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                          <Clock className="w-3 h-3 text-secondary" /> {lastActive ? new Date(lastActive).toLocaleDateString() : 'Never'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {lastActive ? new Date(lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                     <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => { setSelectedUser(user); setShowPrivilegeModal(true); }}
                         className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl transition-all"
                         title="Manage Privileges"
                       >
                         <Trophy className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => handleToggleBlock(user.id, !!user.isBlocked)}
                         className={`p-2.5 rounded-xl transition-all ${user.isBlocked ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400 hover:text-red-500'}`}
                         title={user.isBlocked ? 'Unblock' : 'Block'}
                       >
                         <Ban className="w-5 h-5" />
                       </button>

                       {confirmingDeleteId === user.id ? (
                         <div className="flex items-center gap-1 bg-red-100 p-1 rounded-xl animate-in slide-in-from-right-2">
                           <button 
                             onClick={() => handleDeleteUser(user.id)}
                             className="px-3 py-1.5 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase"
                           >
                             Confirm
                           </button>
                           <button 
                             onClick={() => setConfirmingDeleteId(null)}
                             className="px-3 py-1.5 bg-white text-slate-400 text-[9px] font-black rounded-lg border border-red-200 uppercase"
                           >
                             X
                           </button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setConfirmingDeleteId(user.id)}
                           className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                           title="Delete User"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                     </div>
                   </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Privilege Modal */}
      {showPrivilegeModal && selectedUser && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight">Access & Privileges</h2>
                <p className="text-slate-500 font-bold text-sm">Managing account: {selectedUser.name}</p>
              </div>
              <button onClick={() => setShowPrivilegeModal(false)} className="p-3 hover:bg-white rounded-2xl transition-colors">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-10 max-h-[60vh] overflow-y-auto">
              {/* Premium Section */}
              <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-200">
                      <Star className="w-7 h-7 fill-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-purple-900 tracking-tight leading-none mb-1">Global Premium Pass</h3>
                      <p className="text-xs font-bold text-purple-500 uppercase tracking-widest italic">All Exams • No Limits • Lifetime Access</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleTogglePremium(selectedUser.id, !!selectedUser.isPremium)}
                    className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg ${
                      selectedUser.isPremium 
                        ? 'bg-white text-purple-600 border border-purple-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                        : 'bg-purple-600 text-white shadow-purple-300 hover:scale-[1.05]'
                    }`}
                  >
                    {selectedUser.isPremium ? 'Revoke Premium' : 'Activate Premium'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Exam Specific Access
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exams.map(exam => {
                    const isGranted = (selectedUser.freeExams || []).includes(exam.id);
                    return (
                      <div key={exam.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isGranted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:border-primary/20'}`}>
                        <div className="flex-1 pr-4">
                          <p className="text-sm font-black text-primary leading-tight">{exam.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{exam.organization}</p>
                        </div>
                        {isGranted ? (
                          <button 
                            onClick={() => revokeFreeAccess(selectedUser.id, exam.id)}
                            className="p-2 bg-red-50 text-red-500 rounded-xl border border-red-100 shadow-sm hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => grantFreeAccess(selectedUser.id, exam.id)}
                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
              <button 
                onClick={() => setShowPrivilegeModal(false)}
                className="px-16 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.01] active:scale-95 transition-all"
              >
                Done Managing
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

