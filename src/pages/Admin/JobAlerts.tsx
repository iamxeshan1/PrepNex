import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';
import { Plus, Trash2, Edit2, Briefcase, ExternalLink, Calendar, Users, GraduationCap } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';

interface JobAlert {
  id: string;
  postName: string;
  boardInfo: string;
  vacancies: string;
  qualification: string;
  lastDate: string;
  applyLink: string;
  type: 'Notification' | 'Admit Card' | 'Result';
  status: 'Active' | 'Closed';
  createdAt: number;
}

export default function JobAlerts() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<JobAlert, 'id' | 'createdAt'>>({
    postName: '',
    boardInfo: '',
    vacancies: '',
    qualification: '',
    lastDate: new Date().toISOString().split('T')[0],
    applyLink: '',
    type: 'Notification',
    status: 'Active'
  });

  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);

  const fetchAlerts = async () => {
    try {
      const q = query(collection(db, 'jobAlerts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobAlert));
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching job alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'jobAlerts', editingId), {
          ...formData, // Spread is OK here
          lastDate: formData.lastDate,
        });
      } else {
        const newId = doc(collection(db, 'jobAlerts')).id;
        await setDoc(doc(db, 'jobAlerts', newId), {
          ...formData,
          createdAt: Date.now(),
        });
      }
      setShowModal(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error("Error saving job alert:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      postName: '',
      boardInfo: '',
      vacancies: '',
      qualification: '',
      lastDate: new Date().toISOString().split('T')[0],
      applyLink: '',
      type: 'Notification',
      status: 'Active'
    });
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    try {
      await deleteDoc(doc(db, 'jobAlerts', deleteData.id));
      setDeleteData(null);
      fetchAlerts();
    } catch (error) {
      console.error("Error deleting job alert:", error);
    }
  };

  return (
    <AdminLayout title="Latest Govt Jobs & Alerts">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage job notifications, admit cards, and results.</p>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#006e5d] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#005a4d] transition-all"
        >
          <Plus className="w-4 h-4" /> Add Alert
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Post / Board Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">Loading alerts...</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">No alerts found. Add one to get started.</td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006e5d] shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{alert.postName}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{alert.boardInfo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        alert.type === 'Notification' ? 'bg-blue-100 text-blue-700' :
                        alert.type === 'Admit Card' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {alert.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.status === 'Active' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        • {alert.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5 text-xs text-slate-600">
                         <Users className="w-3.5 h-3.5 text-slate-400" /> 
                         <span className="font-bold">{alert.vacancies || 'N/A'}</span> Posts
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-slate-600">
                         <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                         <span className="truncate max-w-[120px]" title={alert.qualification}>{alert.qualification || 'Any'}</span>
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(alert.lastDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {alert.applyLink && (
                        <a href={alert.applyLink} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors title='Open Link'">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(alert.id);
                          setFormData({
                            postName: alert.postName,
                            boardInfo: alert.boardInfo,
                            vacancies: alert.vacancies,
                            qualification: alert.qualification,
                            lastDate: alert.lastDate,
                            applyLink: alert.applyLink,
                            type: alert.type,
                            status: alert.status
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-[#006e5d] hover:bg-[#006e5d]/10 rounded-lg transition-colors title='Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteData({ id: alert.id, name: alert.postName })}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors title='Delete"
                      >
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
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Job Alert' : 'New Job Alert'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="jobForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Post Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.postName}
                    onChange={(e) => setFormData(prev => ({ ...prev, postName: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                    placeholder="e.g. SSC CGL 2024 Notification Out"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Board / Agency Info *</label>
                  <input
                    type="text"
                    required
                    value={formData.boardInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, boardInfo: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                    placeholder="e.g. Staff Selection Commission (SSC)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vacancies</label>
                  <input
                    type="text"
                    value={formData.vacancies}
                    onChange={(e) => setFormData(prev => ({ ...prev, vacancies: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                    placeholder="e.g. 17727 Posts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                    placeholder="e.g. Current Graduation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Date to Apply *</label>
                  <input
                    type="date"
                    required
                    value={formData.lastDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apply Link (URL)</label>
                  <input
                    type="url"
                    value={formData.applyLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, applyLink: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                  >
                    <option value="Notification">New Notification</option>
                    <option value="Admit Card">Admit Card</option>
                    <option value="Result">Result</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e5d]/20 focus:border-[#006e5d]"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="jobForm"
                className="px-6 py-2 bg-[#006e5d] text-white rounded-lg font-bold hover:bg-[#005a4d]"
              >
                {editingId ? 'Save Changes' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteData && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteData(null)}
          onConfirm={handleDelete}
          title="Delete Job Alert"
          message={`Are you sure you want to delete "${deleteData.name}"?`}
          confirmText="Delete"
        />
      )}
    </AdminLayout>
  );
}
