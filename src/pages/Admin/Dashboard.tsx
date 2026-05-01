import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, query, limit, orderBy, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, BookOpen, CreditCard, Award, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    exams: 0,
    subscriptions: 0,
    tests: 0
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    const [uSnap, eSnap, sSnap, tSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'exams')),
      getDocs(collection(db, 'subscriptions')),
      getDocs(collection(db, 'tests'))
    ]);
    setStats({
      users: uSnap.size,
      exams: eSnap.size,
      subscriptions: sSnap.size,
      tests: tSnap.size
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeed = async () => {
    if (!confirm('This will add sample Exam (JKSSB JKP SI) and Subject (Computer Science) with free tests. Continue?')) return;
    setSeeding(true);
    try {
      // 1. Add Exam
      const examRef = await addDoc(collection(db, 'exams'), {
        name: 'JKSSB JKP SI',
        description: 'Jammu & Kashmir Services Selection Board - Sub Inspector (Police)',
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'exams', examRef.id), { id: examRef.id }, { merge: true });

      // 2. Add Test for Exam
      await addDoc(collection(db, 'tests'), {
        examId: examRef.id,
        title: 'JKP SI Full Mock Test 01',
        duration: 120,
        totalMarks: 150,
        isFree: true,
        createdAt: new Date().toISOString()
      });

      // 3. Add Subject
      const subjectRef = await addDoc(collection(db, 'subjects'), {
        name: 'Computer Science',
        icon: 'Cpu',
        description: 'Fundamental concepts, hardware, software, and networking basics for competitive exams.',
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'subjects', subjectRef.id), { id: subjectRef.id }, { merge: true });

      // 4. Add Test for Subject
      await addDoc(collection(db, 'tests'), {
        subjectId: subjectRef.id,
        title: 'Basic Computing & Hardware Mock',
        duration: 30,
        totalMarks: 50,
        isFree: true,
        createdAt: new Date().toISOString()
      });

      alert('Demo data seeded successfully!');
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Failed to seed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeeding(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${color}-50 text-${color}-600`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-4xl font-black text-primary mb-1 tracking-tighter">{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</div>
    </div>
  );

  return (
    <AdminLayout title="Admin Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="blue" />
        <StatCard title="Active Exams" value={stats.exams} icon={BookOpen} color="indigo" />
        <StatCard title="Subscriptions" value={stats.subscriptions} icon={CreditCard} color="green" />
        <StatCard title="Mock Tests" value={stats.tests} icon={Award} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Demo Seeding Card */}
          <div className="bg-gradient-to-br from-secondary/10 to-orange-50 border border-secondary/20 rounded-[2.5rem] p-8 flex items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="text-xl font-extrabold text-primary tracking-tight">Need a quick demo?</h3>
              </div>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Automatically populate your platform with a sample Exam (JKSSB JKP SI) and a Subject (Computer Science) including free practice tests.
              </p>
            </div>
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="shrink-0 px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Seed Demo Data'}
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-8">
            <h3 className="text-xl font-bold text-primary mb-8 tracking-tight">System Health</h3>
            <div className="space-y-6">
              {['Firebase Auth', 'Firestore Database', 'Asset Storage', 'Payment Webhook'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-600">{item}</span>
                  </div>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Operational</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-primary rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div>
            <h3 className="text-2xl font-bold mb-4 leading-tight">Generate <br />Monthly Report</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-8 opacity-80 font-medium">Get a deep dive into user engagement and revenue metrics for the current period.</p>
          </div>
          <button className="w-full py-4 bg-white text-primary rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95">
            Download PDF <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
