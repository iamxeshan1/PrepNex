import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardTopHeader } from '../components/DashboardTopHeader';
import { Award, Zap, Loader2, BookOpenText } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function MySubscriptions() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchSubscriptions = async () => {
         if (!profile) return;
         try {
             const purchasedIds = profile.purchasedExams || [];
             
             // Fetch all Exams
             const allExamsSnap = await getDocs(collection(db, 'exams'));
             const allExams = allExamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

             const agenciesSnap = await getDocs(collection(db, 'agencies'));
             const allAgencies = agenciesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

             const examsWithAgencyLogos = allExams.map(exam => {
                 const agency = allAgencies.find(a => a.id === exam.agencyId);
                 return {
                     ...exam,
                     type: 'exam',
                     logoUrl: agency?.logoUrl || exam.logoUrl
                 };
             });

             // Fetch Live Tests
             const liveTestsSnap = await getDocs(collection(db, 'liveTests'));
             const allLiveTests = liveTestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
             
             const enrolledLiveTests = allLiveTests.filter(t => t.enrolledUsers?.includes(profile.userId) || purchasedIds.includes(t.id));

             const activeExamsAndTests = [
               ...examsWithAgencyLogos.filter(ex => purchasedIds.includes(ex.id)),
               ...enrolledLiveTests.map(t => ({
                  ...t,
                  type: 'live_test',
                  name: t.title,
               }))
             ];

             setActiveExams(activeExamsAndTests);
         } catch (error) {
             console.error("Error fetching subscriptions:", error);
         } finally {
             setLoading(false);
         }
     };
     fetchSubscriptions();
  }, [profile]);

  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      {/* Mobile Hamburger Overlay */}
      <div className={`fixed inset-0 z-50 bg-black/50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar - Desktop and Mobile */}
      <div className={`fixed lg:relative z-50 w-64 h-full bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <DashboardSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
          <DashboardTopHeader user={profile} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="p-4 lg:p-8 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <h1 className="text-3xl font-black text-[#0f172a] flex items-center gap-3 tracking-tight">
                    <span className="bg-teal-50 p-2.5 rounded-2xl text-teal-600">
                      <BookOpenText className="w-8 h-8" />
                    </span>
                    My Subscriptions
                  </h1>
                  <p className="text-slate-500 font-medium mt-2 leading-relaxed">
                    Manage and access all your purchased exams, courses, and live tests.
                  </p>
                </div>
              </div>

              {loading ? (
                 <div className="flex justify-center py-24">
                    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                    </div>
                 </div>
              ) : activeExams.length === 0 ? (
                 <div className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-sm">
                   <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Award className="w-10 h-10 text-slate-300" />
                   </div>
                   <h3 className="text-2xl font-bold text-[#0f172a] mb-3">No Active Subscriptions</h3>
                   <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg mb-6">
                     You don't have any active subscriptions yet. Explore our exams and start learning!
                   </p>
                   <button
                     onClick={() => navigate('/exams')}
                     className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition"
                   >
                      Browse Exams
                   </button>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeExams.map((exam, index) => (
                      <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={exam.id} 
                          className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between hover:border-teal-100 hover:shadow-sm transition group"
                      >
                          <div className="flex items-start gap-4 mb-6">
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden">
                                  {exam.logoUrl ? (
                                      <img src={exam.logoUrl} alt={exam.name || exam.title} loading="lazy" decoding="async" width="48" height="48" className="w-full h-full object-contain bg-white border border-slate-100 rounded-xl" />
                                  ) : (
                                      <Award className="w-6 h-6 text-indigo-500" />
                                  )}
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                  <h4 className="text-base font-bold text-slate-800 leading-tight mb-1 line-clamp-2 group-hover:text-teal-700 transition">{exam.name || exam.title}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium">{exam.type === 'live_test' ? 'Live Test Access' : 'Subscription Active'}</p>
                              </div>
                          </div>
                          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">One Time</span>
                              <button 
                                  onClick={() => navigate(exam.type === 'live_test' ? `/live-test/${exam.id}` : `/exam/${exam.id}`)} 
                                  className="text-[10px] font-black text-teal-700 tracking-wider hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg"
                              >
                                  MANAGE
                              </button>
                          </div>
                      </motion.div>
                  ))}
                </div>
              )}
            </div>
          </main>
      </div>
    </div>
  );
}
