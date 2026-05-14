import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Plus, ChevronRight, BarChart3, Users, Settings2, FileText, Trash2, Edit3, MoreVertical } from 'lucide-react';

export default function AdminExamManagement() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) return;

      const [examSnap, testsSnap] = await Promise.all([
        getDoc(doc(db, 'exams', examId)),
        getDocs(query(collection(db, 'tests'), where('examId', '==', examId)))
      ]);

      if (examSnap.exists()) setExam(examSnap.data());
      setTests(testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [examId]);

  if (loading) return <AdminLayout title="Loading..."><div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600 w-8 h-8" /></div></AdminLayout>;

  return (
    <AdminLayout title={exam?.name || 'Exam Management'} backTo="/admin/exams">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-[#002f26]">{exam?.name}</h1>
                <p className="text-slate-500 font-medium">{exam?.description || "Manage mock tests and evaluations."}</p>
            </div>
            <Link to={`/admin/tests/${examId}`} className="bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-800 transition-colors">
                <Plus className="w-5 h-5" /> Add New Test
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Total Active Tests</p>
                <h3 className="text-4xl font-bold text-[#002f26] mt-2">{tests.length}</h3>
            </div>
            <div className="bg-white p-6 border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Total Attempts</p>
                <h3 className="text-4xl font-bold text-[#002f26] mt-2">0</h3>
            </div>
            <div className="bg-white p-6 border border-slate-200">
                <p className="text-sm font-medium text-slate-500">Avg. Score</p>
                <h3 className="text-4xl font-bold text-[#002f26] mt-2">0%</h3>
            </div>
        </div>

        <div className="bg-white border border-slate-200 overflow-hidden mb-8">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold">Active Test Catalog</h3>
            </div>
            <table className="w-full">
                <thead>
                    <tr className="border-b text-xs font-bold text-slate-400 uppercase">
                        <th className="pl-4 py-4 text-left w-3/5">Test Name</th>
                        <th className="pl-4 py-4 text-left w-1/5">Duration</th>
                        <th className="pr-4 py-4 text-right w-1/5">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tests.map(test => (
                        <tr key={test.id} className="border-b hover:bg-slate-50">
                            <td className="pl-4 py-4 text-left font-semibold">{test.title}</td>
                            <td className="pl-4 py-4 text-left">{test.duration || 0} mins</td>
                            <td className="pr-4 py-4 text-right">
                                <Link to={`/admin/test/management/${test.id}`} className="text-teal-600 hover:text-teal-800 font-bold">Manage</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-teal-600" />
                    <h3 className="text-lg font-bold">Student Assignments</h3>
                </div>
            </div>
            <div className="bg-white p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                    <h3 className="text-lg font-bold">Performance Insights</h3>
                </div>
            </div>
        </div>
    </AdminLayout>
  );
}
