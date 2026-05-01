import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Activity, User, BookOpen, CreditCard, RotateCcw } from 'lucide-react';
import { ActivityAction } from '../../services/activityLogger';

const getActivityIcon = (action: string) => {
  switch (action) {
    case ActivityAction.TEST_ATTEMPT:
      return <BookOpen className="w-5 h-5 text-blue-500" />;
    case ActivityAction.PROFILE_UPDATE:
      return <User className="w-5 h-5 text-purple-500" />;
    case ActivityAction.SUBSCRIPTION_CHANGE:
      return <CreditCard className="w-5 h-5 text-green-500" />;
    default:
      return <Activity className="w-5 h-5 text-gray-500" />;
  }
};

const getActivityBg = (action: string) => {
  switch (action) {
    case ActivityAction.TEST_ATTEMPT: return 'bg-blue-50 border-blue-100';
    case ActivityAction.PROFILE_UPDATE: return 'bg-purple-50 border-purple-100';
    case ActivityAction.SUBSCRIPTION_CHANGE: return 'bg-green-50 border-green-100';
    default: return 'bg-gray-50 border-gray-100';
  }
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AdminLayout title="System Activity">
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in">
        <div>
          <h2 className="text-xl font-black text-secondary tracking-tight">Recent Activity</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Last 100 system events</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchLogs} className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
            <RotateCcw className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500 font-bold">
          No activity logs found.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 font-bold text-slate-600 text-sm w-1/4">User</th>
                <th className="py-4 px-6 font-bold text-slate-600 text-sm">Action Details</th>
                <th className="py-4 px-6 font-bold text-slate-600 text-sm w-1/6 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-800 text-sm">{log.userName}</p>
                    <p className="text-xs text-slate-500 font-medium">{log.userEmail}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl border ${getActivityBg(log.action)}`}>
                        {getActivityIcon(log.action)}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-0.5">{log.action}</p>
                        <p className="text-sm font-bold text-slate-700">{log.details}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
