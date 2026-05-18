import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  writeBatch, 
  where 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useItemTitles } from '../../hooks/useItemTitles';
import { 
  Search, 
  Ban, 
  CheckCircle2,
  XCircle,
  Download,
  MoreVertical,
  Filter,
  Users as UsersIcon,
  Crown,
  Trophy,
  User,
  Activity,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  FileText,
  CreditCard,
  Ticket,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';
import PremiumGrantModal from '../../components/PremiumGrantModal';
import Toast, { ToastType } from '../../components/Toast';
import { addDoc } from 'firebase/firestore';


export default function AdminUsers() {
  const navigate = useNavigate();
  const { getItemTitle } = useItemTitles();
  const [users, setUsers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [premiumGrantModal, setPremiumGrantModal] = useState({
    isOpen: false,
    loading: false
  });

  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as ToastType
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [userPurchases, setUserPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const confirmDelete = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id;
    
    try {
        setLoading(true);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        
        // ... rest of the code ...
        // Collections where userId is a field
        const collectionsToClean = [
          'results',
          'subscriptions',
          'premium_subscriptions',
          'tickets',
          'activity_logs',
          'reviews'
        ];

        // We use a helper to delete in batches of 500 to stay within Firestore limits
        const deleteInBatches = async (querySnap: any) => {
          let batch = writeBatch(db);
          let count = 0;
          
          for (const docSnap of querySnap.docs) {
            batch.delete(docSnap.ref);
            count++;
            
            if (count === 490) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          
          if (count > 0) {
            await batch.commit();
          }
        };

        // 1. Process related collections
        for (const collName of collectionsToClean) {
          const q = query(collection(db, collName), where('userId', '==', userId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            await deleteInBatches(snap);
          }
        }

        // 2. Subcollections (specifically pushTokens as identified in server.ts)
        const tokensSnap = await getDocs(collection(db, 'users', userId, 'pushTokens'));
        if (!tokensSnap.empty) {
          await deleteInBatches(tokensSnap);
        }

        // 3. Remove user from enrollment lists in liveTests
        const liveTestsQ = query(collection(db, 'liveTests'), where('enrolledUsers', 'array-contains', userId));
        const liveSnap = await getDocs(liveTestsQ);
        if (!liveSnap.empty) {
            const enrollBatch = writeBatch(db);
            liveSnap.docs.forEach(testDoc => {
                const enrolled = testDoc.data().enrolledUsers || [];
                enrollBatch.update(testDoc.ref, { enrolledUsers: enrolled.filter((id: string) => id !== userId) });
            });
            await enrollBatch.commit();
        }

        // 4. Delete the user from Firebase Authentication via our backend API
        try {
          const res = await fetch('/api/admin/delete-user', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ uid: userId })
          });
          if (!res.ok) {
             console.error("Failed to delete user from Auth, continuing with DB cleanup.");
          }
        } catch (authDeleteErr) {
          console.error("Error calling delete-user endpoint:", authDeleteErr);
        }

        // 5. Delete the main user document last
        await deleteDoc(doc(db, 'users', userId));

        setUsers(users.filter(u => u.id !== userId));
        setSelectedUser(null);
        setShowDeleteModal(false);
    } catch (error) {
        console.error("Error deleting user data:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    setConfirmModal({
      isOpen: true,
      title: 'Terminating Student Node',
      message: `System Alert: Authorized deletion of user "${user.name}". This will permanently purge all progress, results, and network identification from the registry. This protocol is irreversible.`,
      confirmText: 'Execute Purge',
      type: 'danger',
      onConfirm: confirmDelete
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         await updateDoc(doc(db, 'users', selectedUser.id), {
             name: editFormData.name,
             email: editFormData.email,
             phone: editFormData.phone,
             address: editFormData.address,
             state: editFormData.state
         });
         setUsers(users.map(u => u.id === selectedUser.id ? {...u, ...editFormData} : u));
         setToast({
           isVisible: true,
           message: "Student node identity updated successfully.",
           type: 'success'
         });
         setShowEditModal(false);
      } catch (error) {
          console.error("Error updating user:", error);
          setToast({
            isVisible: true,
            message: "Node update rejected by registry.",
            type: 'error'
          });
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uSnap, eSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('name', 'asc'))),
        getDocs(collection(db, 'exams')),
        getDocs(collection(db, 'agencies'))
      ]);
      setUsers(uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setExams(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAgencies(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
     const action = currentStatus ? 'unblock' : 'block';
     setConfirmModal({
        isOpen: true,
        title: `${currentStatus ? 'Unblock' : 'Restrict'} Registry Access`,
        message: `System Confirmation: You are about to ${action} node ID: ${userId}. This will ${currentStatus ? 'restore' : 'terminate'} their ability to access the platform nodes immediately.`,
        confirmText: currentStatus ? 'System Restore' : 'Authorize Restriction',
        type: currentStatus ? 'info' : 'warning',
        onConfirm: async () => {
           try {
              await updateDoc(doc(db, 'users', userId), { isBlocked: !currentStatus });
              setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
           } catch (error) {
              // handle error
           }
        }
     });
  };

  const confirmPremiumGrant = async (months: number) => {
     if (!selectedUser) return;
     try {
        setPremiumGrantModal(prev => ({ ...prev, loading: true }));
        const expiry = new Date();
        if (months === 0) {
           expiry.setFullYear(expiry.getFullYear() + 99); // Lifetime
        } else {
           expiry.setMonth(expiry.getMonth() + months);
        }
        
        // 1. Update user document
        await updateDoc(doc(db, 'users', selectedUser.id), {
          isPremium: true,
          premiumExpiry: expiry.toISOString(),
          subscriptionExpiry: expiry.toISOString()
        });
        
        // 2. Create premium subscription record so it shows in dashboard and logs
        await addDoc(collection(db, "premium_subscriptions"), {
           userId: selectedUser.id,
           userName: selectedUser.name || "Aspirant",
           type: "Premium (Admin Grant)",
           purchaseDate: new Date().toISOString(),
           expiryDate: expiry.toISOString(),
           paymentId: 'ADMIN_GRANT',
           orderId: 'ADMIN_AUTH',
           paymentStatus: "completed",
           amount: 0,
           durationMonths: months
        });

        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isPremium: true, premiumExpiry: expiry.toISOString(), subscriptionExpiry: expiry.toISOString() } : u));
        setSelectedUser({ ...selectedUser, isPremium: true, premiumExpiry: expiry.toISOString(), subscriptionExpiry: expiry.toISOString() });
        
        setPremiumGrantModal({ isOpen: false, loading: false });
     } catch (error) {
        console.error("Failed to grant premium:", error);
        setPremiumGrantModal(prev => ({ ...prev, loading: false }));
     }
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Revoke logic
      setConfirmModal({
        isOpen: true,
        title: 'Revoking Ultimate Access',
        message: `System Alert: You are about to terminate the Premium Pass for node: ${selectedUser?.name || userId}. This will instantly restrict their access to exclusive registry features.`,
        confirmText: 'Terminate Clearance',
        type: 'danger',
        onConfirm: async () => {
          try {
             await updateDoc(doc(db, 'users', userId), {
               isPremium: false,
               premiumExpiry: null,
               subscriptionExpiry: null
             });
             setUsers(users.map(u => u.id === userId ? { ...u, isPremium: false, premiumExpiry: null, subscriptionExpiry: null } : u));
             if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, isPremium: false, premiumExpiry: null, subscriptionExpiry: null });
             setConfirmModal(prev => ({ ...prev, isOpen: false }));
          } catch (error) {
             console.error(error);
          }
        }
      });
    } else {
      // Grant logic
      setPremiumGrantModal({ isOpen: true, loading: false });
    }
  };

  const grantFreeAccess = async (userId: string, examId: string) => {
    const user = users.find(u => u.id === userId);
    const freeExams = user.freeExams || [];
    if (freeExams.includes(examId)) return;

    const newFreeExams = [...freeExams, examId];
    try {
      await updateDoc(doc(db, 'users', userId), { freeExams: newFreeExams });
      
      // Also create a subscription record if it's an exam grant
      const exam = exams.find(e => e.id === examId);
      await addDoc(collection(db, "subscriptions"), {
         userId: userId,
         userName: user.name || "Aspirant",
         examId: examId,
         type: (exam?.name || "Exam") + " (Admin Grant)",
         purchaseDate: new Date().toISOString(),
         paymentId: 'ADMIN_GRANT',
         orderId: 'ADMIN_AUTH',
         paymentStatus: "completed",
         amount: 0
      });

      setUsers(users.map(u => u.id === userId ? { ...u, freeExams: newFreeExams } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, freeExams: newFreeExams });
    } catch (error) {
      console.error(error);
    }
  };

  const revokeFreeAccess = async (userId: string, examId: string) => {
    const user = users.find(u => u.id === userId);
    const newFreeExams = (user.freeExams || []).filter((id: string) => id !== examId);
    try {
      await updateDoc(doc(db, 'users', userId), { freeExams: newFreeExams });
      setUsers(users.map(u => u.id === userId ? { ...u, freeExams: newFreeExams } : u));
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, freeExams: newFreeExams });
    } catch (error) {
      console.error(error);
    }
  };

  const viewPurchases = async (user: any) => {
    setSelectedUser(user);
    setShowPurchasesModal(true);
    setLoadingPurchases(true);
    try {
      const subsSnap = await getDocs(query(collection(db, 'subscriptions'), where('userId', '==', user.id)));
      const premSnap = await getDocs(query(collection(db, 'premium_subscriptions'), where('userId', '==', user.id)));
      
      const purchases: any[] = [];
      subsSnap.forEach(snap => purchases.push({ id: snap.id, collection: 'subscriptions', ...snap.data() }));
      premSnap.forEach(snap => purchases.push({ id: snap.id, collection: 'premium_subscriptions', ...snap.data() }));
      
      purchases.sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime());
      setUserPurchases(purchases);
    } catch (error) {
      console.error("Failed to load user purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const revokePurchase = async (purchase: any) => {
    setConfirmModal({
        isOpen: true,
        title: 'Revoking Transaction Node',
        message: `System Alert: You are about to authorize the withdrawal of access for node "${purchase.type || purchase.examId}". This ledger entry will be permanently negated.`,
        confirmText: 'Execute Revocation',
        type: 'danger',
        onConfirm: async () => {
           try {
              // 1. Delete subscription doc
              await deleteDoc(doc(db, purchase.collection, purchase.id));
              
              // 2. Adjust user doc
              const userDocRef = doc(db, 'users', selectedUser.id);
              if (purchase.collection === 'premium_subscriptions') {
                 await updateDoc(userDocRef, { isPremium: false, subscriptionExpiry: null, premiumExpiry: null });
                 setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isPremium: false, premiumExpiry: null, subscriptionExpiry: null } : u));
              } else {
                 const newPurchasedExams = (selectedUser.purchasedExams || []).filter((id: string) => id !== purchase.examId);
                 const newFreeExams = (selectedUser.freeExams || []).filter((id: string) => id !== purchase.examId);
                 await updateDoc(userDocRef, { purchasedExams: newPurchasedExams, freeExams: newFreeExams });
                 setUsers(users.map(u => u.id === selectedUser.id ? { ...u, purchasedExams: newPurchasedExams, freeExams: newFreeExams } : u));
                 
                 // 3. Remove from live test enrolledUsers if it was a live test
                 if (purchase.examId) {
                     const liveRef = doc(db, 'liveTests', purchase.examId);
                     const liveSnap = await getDoc(liveRef);
                     if (liveSnap.exists()) {
                         const enrolled = liveSnap.data().enrolledUsers || [];
                         await updateDoc(liveRef, { enrolledUsers: enrolled.filter((id: string) => id !== selectedUser.id) });
                     }
                 }
              }
              
              setUserPurchases(userPurchases.filter(p => p.id !== purchase.id));
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            } catch (error) {
              console.error("Failed to revoke access:", error);
            }
        }
    });
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, span, trend, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {trend && <p className="text-xs font-semibold text-emerald-600">{trend}</p>}
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  return (
    <AdminLayout title="User Management">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage student accounts, premium access, and learning progress.</p>
        <button className="bg-[#006e5d] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#005a4d] transition-colors">
           <Download className="w-5 h-5" /> Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Students" value={users.length} trend="+124 this week" />
        <StatCard title="Premium Users" value={users.filter(u => u.isPremium).length} span="Paid subscribers" />
        <StatCard title="Active Today" value={users.filter(u => u.lastLogin).length} span="Logged in last 24h" colorClass="text-emerald-600" />
        <StatCard title="Suspended" value={users.filter(u => u.isBlocked).length} span="Account violations" colorClass="text-rose-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-[#006e5d] focus:border-[#006e5d] bg-white shadow-sm"
                />
             </div>
             <button className="px-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white shadow-sm flex items-center gap-2 hover:bg-slate-50">
                <Filter className="w-4 h-4" /> Filter By Plan
             </button>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing 1 - {filteredUsers.length} of {filteredUsers.length} USERS</p>
        </div>
        
        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#006e5d] rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold">Student Information</th>
                <th className="p-4 font-semibold">Subscription</th>
                <th className="p-4 font-semibold">Address</th>
                <th className="p-4 font-semibold">Last Active Date/Time</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                // Subscription Logic
                const freeExamsCount = (user.freeExams || []).length;
                let subType = 'Trial';
                if (user.isPremium) subType = 'Premium';
                else if (freeExamsCount === 1) subType = 'Basic';
                else if (freeExamsCount >= 2) subType = 'Standard';

                return (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        {(user.photoURL || user.profilePicture) ? (
                          <img src={user.photoURL || user.profilePicture} alt={user.name} loading="lazy" decoding="async" width="40" height="40" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#006e5d]/5 flex items-center justify-center text-[#006e5d] font-bold uppercase">
                             {user.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                           <p className="font-bold text-slate-900 group-hover:text-[#006e5d] transition-colors flex items-center gap-2">
                             {user.name || 'Anonymous User'}
                             {user.role === 'admin' && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Admin</span>}
                           </p>
                           <p className="text-xs font-medium text-slate-400 mt-0.5">{user.email}</p>
                           <p className="text-xs font-medium text-slate-400 mt-0.5">{user.phone || 'No Phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex w-fit ${subType === 'Premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {subType}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-[#001f19]">{user.address || 'No Address'}, {user.state || 'No State'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-medium text-slate-600">{user.lastLogin || user.lastActive ? new Date(user.lastLogin || user.lastActive).toLocaleString() : 'Never'}</p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                       <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button onClick={() => navigate(`/admin/users/${user.id}/performance`)} className="p-2 hover:bg-teal-50 rounded text-teal-600 transition-colors" title="View Performance">
                             <BarChart3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedUser(user); setEditFormData(user); setShowEditModal(true); }} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Edit User">
                             <User className="w-4 h-4" />
                          </button>
                          <button onClick={() => viewPurchases(user)} className="p-2 hover:bg-teal-50 rounded text-teal-600 transition-colors" title="View Purchases">
                             <CreditCard className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedUser(user); setShowPrivilegeModal(true); }} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Manage Permissions">
                             <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete User">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Existing modals remain but we integrate components */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />

      <PremiumGrantModal
        isOpen={premiumGrantModal.isOpen}
        onClose={() => setPremiumGrantModal({ ...premiumGrantModal, isOpen: false })}
        onConfirm={confirmPremiumGrant}
        userName={selectedUser?.name || 'Aspirant'}
        loading={premiumGrantModal.loading}
      />

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-[#002f26]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Student Details</h2>
                  <p className="text-sm text-slate-500">Update information for {selectedUser.name}</p>
               </div>
               <button onClick={() => setShowEditModal(false)} className="p-2 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-all">
                 <XCircle className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700">Full Name</label>
                    <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006e5d] focus:border-transparent" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700">Phone</label>
                    <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006e5d] focus:border-transparent" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-semibold mb-1 text-slate-700">Email Address</label>
                   <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006e5d] focus:border-transparent" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-semibold mb-1 text-slate-700">Address</label>
                     <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006e5d] focus:border-transparent" value={editFormData.address || ''} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold mb-1 text-slate-700">State</label>
                     <input className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006e5d] focus:border-transparent" value={editFormData.state || ''} onChange={e => setEditFormData({...editFormData, state: e.target.value})} />
                  </div>
                </div>
                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                   <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 bg-slate-100 rounded-lg text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                   <button type="submit" className="px-6 py-2.5 bg-[#006e5d] text-white rounded-lg font-semibold hover:bg-[#005a4d] transition-colors">Save Changes</button>
                </div>
            </form>
          </div>
        </div>
      )}
      {showPrivilegeModal && selectedUser && (
        <div className="fixed inset-0 bg-[#002f26]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedUser.name}</h2>
                  <p className="text-sm font-medium text-slate-500">{selectedUser.email}</p>
               </div>
               <button onClick={() => setShowPrivilegeModal(false)} className="p-2 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-all">
                 <XCircle className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-6 bg-[#002f26] rounded-xl text-white">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                       <Crown className="w-8 h-8 text-amber-400" />
                       <div>
                          <h4 className="text-lg font-bold">Premium Pass</h4>
                          <span className="text-xs text-slate-400">Unlock all tests & reporting</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleTogglePremium(selectedUser.id, !!selectedUser.isPremium)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        selectedUser.isPremium 
                          ? 'bg-rose-500 text-white hover:bg-rose-600' 
                          : 'bg-[#006e5d] text-white hover:bg-[#005a4d]'
                      }`}
                    >
                      {selectedUser.isPremium ? 'Revoke Pass' : 'Activate Pass'}
                    </button>
                 </div>
              </div>

              <div>
                 <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Exam Specific Access</h3>
                 <div className="space-y-3">
                   {exams.map(exam => {
                     const isGranted = (selectedUser.freeExams || []).includes(exam.id);
                     return (
                       <div key={exam.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-white hover:border-[#006e5d]/20 transition-colors">
                         <div>
                           <p className="text-sm font-bold text-slate-900">{exam.name}</p>
                           <p className="text-xs font-semibold text-slate-500 mt-1">{agencies.find((a: any) => a.id === exam.agencyId)?.name || 'General'}</p>
                         </div>
                         {isGranted ? (
                           <button onClick={() => revokeFreeAccess(selectedUser.id, exam.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">
                             Revoke Access
                           </button>
                         ) : (
                           <button onClick={() => grantFreeAccess(selectedUser.id, exam.id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                             Grant Access
                           </button>
                         )}
                       </div>
                     );
                   })}
                 </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
               <button onClick={() => setShowPrivilegeModal(false)} className="px-6 py-2.5 bg-[#002f26] text-white rounded-lg font-semibold hover:bg-[#001f19] transition-colors">
                  Close
               </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-[#002f26]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete User</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete <span className="font-bold text-slate-900">{selectedUser.name}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded text-white font-semibold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurchasesModal && selectedUser && (
        <div className="fixed inset-0 bg-[#002f26]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#006e5d]" /> 
                    Purchases & Subscriptions
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">{selectedUser.name} ({selectedUser.email})</p>
               </div>
               <button onClick={() => setShowPurchasesModal(false)} className="p-2 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-all">
                 <XCircle className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               {loadingPurchases ? (
                  <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#006e5d] rounded-full animate-spin" /></div>
               ) : userPurchases.length > 0 ? (
                  <div className="space-y-4">
                     {userPurchases.map((purchase, index) => (
                        <div key={purchase.id || index} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-white hover:border-[#006e5d]/20 transition-colors">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                    purchase.collection === 'premium_subscriptions' ? 'bg-amber-100 text-amber-700' : 'bg-[#006e5d]/10 text-[#006e5d]'
                                 }`}>
                                    {purchase.collection === 'premium_subscriptions' ? 'Premium Pass' : 'Exam/Test'}
                                 </span>
                                 <span className="text-xs font-semibold text-slate-400">
                                    {new Date(purchase.purchaseDate || purchase.date || Date.now()).toLocaleDateString()}
                                 </span>
                              </div>
                              <p className="text-base font-bold text-slate-900">{getItemTitle(purchase.examId || (purchase.collection === "premium_subscriptions" ? "PREMIUM_PASS" : null), purchase.type) || purchase.examId || 'Purchase'}</p>
                              {purchase.paymentId && <p className="text-xs font-medium text-slate-500 mt-1">Ref: {purchase.paymentId}</p>}
                           </div>
                           
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <p className="text-lg font-black text-slate-900">₹{purchase.amount || 0}</p>
                                 {purchase.couponCode && purchase.couponCode !== 'NONE' && (
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Code: {purchase.couponCode}</p>
                                 )}
                              </div>
                              <button 
                                 onClick={() => revokePurchase(purchase)} 
                                 className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                              >
                                 <Ban className="w-4 h-4" /> Revoke
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="py-12 text-center text-slate-500 font-medium">
                     No purchases found for this user.
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
