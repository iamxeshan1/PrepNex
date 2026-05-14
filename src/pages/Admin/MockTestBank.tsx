import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, updateDoc, doc, addDoc, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  FileText, 
  Upload, 
  ChevronRight, 
  X, 
  Shield, 
  Edit3, 
  Trash2, 
  Loader2, 
  Download, 
  Database,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Trash
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MockTestBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('all');
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Question Form State
  const [newQ, setNewQ] = useState({
    subjectId: '',
    newSubjectName: '',
    level: 'Medium' as 'Easy' | 'Medium' | 'Hard' | 'UGC NET',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    previouslyAskedIn: ''
  });

  const levels = ['Easy', 'Medium', 'Hard', 'UGC NET'];
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sSnap, qSnap] = await Promise.all([
        getDocs(collection(db, 'subjects')),
        getDocs(query(collection(db, 'questions'), where('testId', '==', 'MASTER_BANK')))
      ]);
      setSubjects(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let subjectId = newQ.subjectId;
      if (newQ.subjectId === 'new' && newQ.newSubjectName) {
        const existingSubject = subjects.find(s => s.name?.toLowerCase() === newQ.newSubjectName.trim().toLowerCase());
        if (existingSubject) {
          subjectId = existingSubject.id;
        } else {
          const subRef = await addDoc(collection(db, 'subjects'), {
            name: newQ.newSubjectName.trim(),
            createdAt: new Date().toISOString(),
            description: '',
            icon: 'BookOpen'
          });
          subjectId = subRef.id;
        }
      }

      const questionData = {
        subjectId,
        level: newQ.level,
        question: newQ.question,
        options: newQ.options,
        correctAnswer: newQ.correctAnswer,
        explanation: newQ.explanation,
        previouslyAskedIn: newQ.previouslyAskedIn,
        testId: 'MASTER_BANK',
        updatedAt: new Date().toISOString()
      };

      if (editingQuestionId) {
        await updateDoc(doc(db, 'questions', editingQuestionId), questionData);
      } else {
        await addDoc(collection(db, 'questions'), { ...questionData, createdAt: new Date().toISOString() });
      }

      setNewQ({ subjectId: '', newSubjectName: '', level: 'Medium', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', previouslyAskedIn: '' });
      setEditingQuestionId(null);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
       console.error(error);
    }
  };

  const handleEdit = (q: any) => {
    setEditingQuestionId(q.id);
    setNewQ({ subjectId: q.subjectId, newSubjectName: '', level: q.level, question: q.question, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation || '', previouslyAskedIn: q.previouslyAskedIn || '' });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    const headers = [["question", "subjectName", "level", "option1", "option2", "option3", "option4", "correctAnswer", "explanation", "previouslyAskedIn"]];
    const sample = [["What is the capital of India?", "General Knowledge", "Easy", "Mumbai", "Kolkata", "New Delhi", "Chennai", "New Delhi", "New Delhi is the official capital.", "UPSC 2021"]];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    XLSX.utils.book_append_sheet(wb, ws, "MasterTemplate");
    XLSX.writeFile(wb, "PrepNext_MasterBank_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const batch = writeBatch(db);
        const currentSubjectsSnap = await getDocs(collection(db, 'subjects'));
        let tempSubjects = currentSubjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        for (const row of (data as any[])) {
          let subject = tempSubjects.find(s => s.name?.toLowerCase() === row.subjectName?.toLowerCase());
          if (!subject) {
            const subRef = doc(collection(db, 'subjects'));
            const newSub = { id: subRef.id, name: row.subjectName, createdAt: new Date().toISOString(), description: '', icon: 'Book' };
            batch.set(subRef, newSub);
            tempSubjects.push(newSub as any);
            subject = newSub as any;
          }
          const qRef = doc(collection(db, 'questions'));
          batch.set(qRef, { testId: 'MASTER_BANK', subjectId: subject.id, subjectName: subject.name, level: row.level || 'Medium', question: row.question, options: [row.option1, row.option2, row.option3, row.option4].map(String), correctAnswer: String(row.correctAnswer), explanation: row.explanation || '', previouslyAskedIn: row.previouslyAskedIn || '', createdAt: new Date().toISOString() });
        }
        await batch.commit();
        fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setImporting(false);
        setShowImport(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const deleteQuestion = async (id: string) => {
    await deleteDoc(doc(db, 'questions', id));
    setConfirmingDeleteId(null);
    fetchData();
  };

  const subjectCounts = subjects.reduce((acc, sub) => {
    acc[sub.id] = questions.filter(q => q.subjectId === sub.id).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredQuestions = (activeSubjectId === 'all' ? questions : questions.filter(q => q.subjectId === activeSubjectId))
    .filter(q => q.question?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout title="Mock Test Bank" backTo="/admin">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
           <p className="text-slate-500 font-medium">Master repository for all questions used in mock tests.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={downloadSample} className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Template
           </button>
           <button onClick={() => setShowImport(!showImport)} className="px-5 py-2.5 bg-teal-50 border border-teal-200 rounded-lg font-semibold text-sm text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" /> Bulk Upload CSV
           </button>
           <button onClick={() => setShowAddForm(true)} className="px-5 py-2.5 bg-teal-700 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-teal-800 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Question
           </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white border text-center border-slate-200 p-12 rounded-xl mb-8">
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} id="master-q-upload" className="hidden" />
          <label htmlFor="master-q-upload" className="cursor-pointer inline-flex flex-col items-center">
            <div className={`w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-4 ${importing ? 'animate-bounce' : ''}`}>
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#002f26]">{importing ? 'Importing Data...' : 'Click to Upload Dataset'}</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">XLSX or CSV files following the template format</p>
          </label>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSaveQuestion} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
           <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <h3 className="text-xl font-bold text-[#002f26] mb-6">{editingQuestionId ? 'Edit Question' : 'New Question'}</h3>

           <div className="space-y-6">
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                 <textarea 
                    required 
                    placeholder="Enter question text..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium bg-slate-50 min-h-[100px]"
                    value={newQ.question} onChange={e => setNewQ({...newQ, question: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject / Domain</label>
                    <div className="space-y-3">
                       <select 
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white"
                          value={newQ.subjectId}
                          onChange={e => setNewQ({...newQ, subjectId: e.target.value, newSubjectName: ''})}
                       >
                          <option value="">Select Domain</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          <option value="new">+ Create New Domain</option>
                       </select>
                       {newQ.subjectId === 'new' && (
                          <input 
                             required
                             className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                             placeholder="New Domain Name"
                             value={newQ.newSubjectName}
                             onChange={e => setNewQ({...newQ, newSubjectName: e.target.value})}
                          />
                       )}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                    <select 
                       className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white"
                       value={newQ.level}
                       onChange={e => setNewQ({...newQ, level: e.target.value as any})}
                    >
                       <option value="Easy">Easy</option>
                       <option value="Medium">Medium</option>
                       <option value="Hard">Hard</option>
                       <option value="UGC NET">UGC NET</option>
                    </select>
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-4">Options (Select Correct Answer)</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newQ.options.map((opt, i) => (
                       <div key={i} className="flex relative">
                          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2">
                             <button type="button" onClick={() => setNewQ({...newQ, correctAnswer: opt})} className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-colors ${newQ.correctAnswer === opt && opt !== '' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                                {String.fromCharCode(65+i)}
                             </button>
                          </div>
                          <input 
                           required
                           placeholder={`Option ${String.fromCharCode(65+i)}`}
                           className={`w-full py-3 pl-12 pr-4 border rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium ${newQ.correctAnswer === opt && opt !== '' ? 'border-teal-400 bg-teal-50/30' : 'border-slate-300'}`}
                           value={opt}
                           onChange={e => {
                              const opts = [...newQ.options];
                              opts[i] = e.target.value;
                              setNewQ({...newQ, options: opts});
                           }}
                          />
                       </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reference/Exam (Optional)</label>
                    <input 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                        placeholder="e.g. UPSC CSE 2022"
                        value={newQ.previouslyAskedIn}
                        onChange={e => setNewQ({...newQ, previouslyAskedIn: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Explanation (Optional)</label>
                    <textarea 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 min-h-[80px]"
                        placeholder="Explain the solution..."
                        value={newQ.explanation}
                        onChange={e => setNewQ({...newQ, explanation: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           <div className="mt-8">
              <button type="submit" className="bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-800 transition-colors">
                 {editingQuestionId ? 'Save Changes' : 'Add to Bank'}
               </button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white rounded-xl border border-slate-200 p-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Filter by Subject</h3>
             <div className="space-y-1">
                <button 
                  onClick={() => setActiveSubjectId('all')}
                  className={`w-full p-3 rounded-lg flex justify-between items-center transition-colors text-sm font-semibold ${activeSubjectId === 'all' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>All Questions</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${activeSubjectId === 'all' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>{questions.length}</span>
                </button>
                {subjects.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveSubjectId(s.id)}
                    className={`w-full p-3 rounded-lg flex justify-between items-center transition-colors text-sm font-medium ${activeSubjectId === s.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="truncate pr-2">{s.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${activeSubjectId === s.id ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>{subjectCounts[s.id] || 0}</span>
                  </button>
                ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
           <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input 
                 type="text" 
                 placeholder="Search question bank..."
                 className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#002f26] placeholder:text-slate-400"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
           ) : filteredQuestions.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                 <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <p className="font-bold text-slate-500">No questions found</p>
              </div>
           ) : (
              <div className="space-y-4 pb-20">
                 {filteredQuestions.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start gap-6">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{idx + 1}</span>
                               <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs font-bold">{subjects.find(s => s.id === q.subjectId)?.name || 'Subject'}</span>
                               <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{q.level || 'Standard'}</span>
                               {q.previouslyAskedIn && <span className="text-xs font-semibold text-slate-400">({q.previouslyAskedIn})</span>}
                            </div>
                            <p className="text-base font-bold text-[#002f26] mb-4 whitespace-pre-wrap">{q.question}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                               {q.options.map((opt: string, i: number) => {
                                  const isCorrect = String(opt) === String(q.correctAnswer);
                                  return (
                                    <div key={i} className={`px-4 py-2 rounded-lg border-2 flex items-center gap-3 ${isCorrect ? 'border-teal-500 bg-teal-50/50' : 'border-slate-100 bg-slate-50'}`}>
                                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{String.fromCharCode(65 + i)}</span>
                                      <span className={`text-sm font-semibold ${isCorrect ? 'text-teal-900' : 'text-slate-700'}`}>{opt}</span>
                                    </div>
                                  )
                               })}
                            </div>

                            {q.explanation && (
                              <div className="bg-amber-50/50 px-4 py-3 rounded-lg border border-amber-100 mt-2">
                                <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Explanation</p>
                                <p className="text-sm text-amber-900 font-medium">{q.explanation}</p>
                              </div>
                            )}
                         </div>
                         
                         <div className="flex flex-col gap-2">
                            <button onClick={() => handleEdit(q)} className="p-2 bg-slate-50 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                               <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteQuestion(q.id)} className="p-2 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
}
