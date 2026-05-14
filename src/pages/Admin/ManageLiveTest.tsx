import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Users, Download, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ManageLiveTest() {
  const { testId } = useParams();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) return;
      const snap = await getDoc(doc(db, 'liveTests', testId));
      if (snap.exists()) {
        const data = snap.data();
        setTest({ id: snap.id, ...data });
        
        // Fetch enrolled student details (for now just names/mock data if ranks not available)
        // This is a placeholder for ranking/scoring logic
        if (data.enrolledUsers) {
            // Need to fetch from users collection
            // For now, I'll simulate fetching student data with ranks
            setStudents(data.enrolledUsers.map((uid: string, i: number) => ({
                id: uid,
                name: `Student ${i+1}`,
                rank: i+1,
                score: 100 - i*5
            })));
        }
      }
      setLoading(false);
    };
    fetchTestData();
  }, [testId]);

  const exportToExcel = () => {
    if (!students.length) return;
    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EnrolledStudents");
    XLSX.writeFile(workbook, `${test?.title || 'LiveTest'}_Report.xlsx`);
  };

  if (loading) return <AdminLayout title="Loading..."><Loader2 className="animate-spin" /></AdminLayout>;

  return (
    <AdminLayout title={`Manage: ${test?.title}`} backTo="/admin/live-tests">
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Enrolled Students & Ranks</h3>
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700">
                <Download className="w-4 h-4" /> Export Report
            </button>
        </div>
        
        <table className="w-full text-left">
            <thead>
                <tr className="border-b text-xs font-bold text-slate-400 uppercase">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Score</th>
                </tr>
            </thead>
            <tbody>
                {students.map((s) => (
                    <tr key={s.id} className="border-b">
                        <td className="p-3 font-bold text-teal-600">{s.rank}</td>
                        <td className="p-3 font-semibold">{s.name}</td>
                        <td className="p-3">{s.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
