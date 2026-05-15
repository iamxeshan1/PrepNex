import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';
import { Plus, Trash2, Edit2, FileText, ExternalLink, Calendar, Search } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';

interface PYQ {
  id: string;
  examName: string;
  year: string;
  subject: string;
  paperUrl: string;
  solutionUrl?: string;
  createdAt: number;
}

export default function AdminPYQs() {
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<PYQ, 'id' | 'createdAt'>>({
    examName: '',
    year: new Date().getFullYear().toString(),
    subject: '',
    paperUrl: '',
    solutionUrl: ''
  });

  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const fetchPYQs = async () => {
    try {
      const q = query(collection(db, 'pyqs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PYQ));
      setPyqs(data);
    } catch (error) {
      console.error("Error fetching PYQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPYQs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'pyqs', editingId), { ...formData });
      } else {
        const newId = doc(collection(db, 'pyqs')).id;
        await setDoc(doc(db, 'pyqs', newId), { ...formData, createdAt: Date.now() });
      }
      setShowModal(false);
      resetForm();
      fetchPYQs();
    } catch (error) {
      console.error("Error saving PYQ:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      examName: '',
      year: new Date().getFullYear().toString(),
      subject: '',
      paperUrl: '',
      solutionUrl: ''
    });
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      await deleteDoc(doc(db, 'pyqs', deleteData.id));
      setDeleteData(null);
      fetchPYQs();
    } catch (error) {
      console.error("Error deleting PYQ:", error);
    }
  };

  return (
    <AdminLayout title="Previous Year Papers (PYQs)">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage previous year question papers and solutions.</p>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#006e5d] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#005a4d] transition-all"
        >
          <Plus className="w-4 h-4" /> Add PYQ
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Exam & Subject</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Links</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Loading PYQs...</td></tr>
            ) : pyqs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">No PYQs found.</td></tr>
            ) : (
              pyqs.map((pyq) => (
                <tr key={pyq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006e5d] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{pyq.examName}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{pyq.subject}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">{pyq.year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {pyq.paperUrl && (
                        <a href={pyq.paperUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-3.5 h-3.5" /> Paper PDF
                        </a>
                      )}
                      {pyq.solutionUrl && (
                        <a href={pyq.solutionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800">
                          <ExternalLink className="w-3.5 h-3.5" /> Solution PDF
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => {
                          setEditingId(pyq.id);
                          setFormData({ examName: pyq.examName, year: pyq.year, subject: pyq.subject, paperUrl: pyq.paperUrl, solutionUrl: pyq.solutionUrl });
                          setShowModal(true);
                       }} className="p-2 text-slate-400 hover:text-[#006e5d] hover:bg-[#006e5d]/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setDeleteData({ id: pyq.id, name: `${pyq.examName} (${pyq.year})` })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit PYQ' : 'Add PYQ'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="pyqForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name *</label>
                    <input type="text" required value={formData.examName} onChange={e => setFormData(p => ({ ...p, examName: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]" placeholder="e.g. UPSC CSE Prelims" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
                    <input type="text" required value={formData.year} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]" placeholder="e.g. 2023" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Paper Name *</label>
                    <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]" placeholder="e.g. General Studies Paper 1" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Paper PDF URL *</label>
                    <input type="url" required value={formData.paperUrl} onChange={e => setFormData(p => ({ ...p, paperUrl: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]" placeholder="https://..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Solution PDF URL (Optional)</label>
                    <input type="url" value={formData.solutionUrl} onChange={e => setFormData(p => ({ ...p, solutionUrl: e.target.value }))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]" placeholder="https://..." />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg font-bold">Cancel</button>
              <button type="submit" form="pyqForm" className="px-6 py-2 bg-[#006e5d] text-white rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
      
      {deleteData && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteData(null)}
          onConfirm={handleDelete}
          title="Delete PYQ"
          message={`Are you sure you want to delete ${deleteData.name}?`}
          confirmText="Delete"
        />
      )}
    </AdminLayout>
  );
}
