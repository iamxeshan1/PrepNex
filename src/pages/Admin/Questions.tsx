import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Plus, 
  Trash2, 
  HelpCircle, 
  CheckCircle2, 
  Upload, 
  Download, 
  X, 
  FileText, 
  Database, 
  Info, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Edit3,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminQuestions() {
  const { testId } = useParams();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [question, setQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [level, setLevel] = useState('Medium');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState('');
  const [explanation, setExplanation] = useState('');
  const [previouslyAskedIn, setPreviouslyAskedIn] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!testId) return;
      
      let tSnap = await getDoc(doc(db, 'tests', testId));
      if (!tSnap.exists()) {
        tSnap = await getDoc(doc(db, 'liveTests', testId));
      }

      const [qSnap, sSnap] = await Promise.all([
        getDocs(query(collection(db, 'questions'), where('testId', '==', testId))),
        getDocs(collection(db, 'subjects'))
      ]);
      if (tSnap.exists()) setTest(tSnap.data());
      setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSubjects(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [testId]);

  const resetForm = () => {
    setQuestion(''); setOptions(['', '', '', '']); setCorrect(''); setExplanation(''); setSubjectId(''); setPreviouslyAskedIn('');
    setNewSubjectName(''); setLevel('Medium');
    setEditingQuestionId(null);
    setShowAddForm(false);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correct) return alert('Select correct answer');
    
    let finalSubjectId = test?.subjectId || subjectId;
    
    if (newSubjectName.trim()) {
      const existing = subjects.find(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase());
      if (existing) {
        finalSubjectId = existing.id;
      } else {
        const subRef = await addDoc(collection(db, 'subjects'), {
          name: newSubjectName.trim(),
          createdAt: new Date().toISOString()
        });
        finalSubjectId = subRef.id;
        const sSnap = await getDocs(collection(db, 'subjects'));
        setSubjects(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }

    const questionData = {
      testId,
      subjectId: finalSubjectId,
      level,
      question,
      options,
      correctAnswer: correct,
      explanation,
      previouslyAskedIn,
      updatedAt: new Date().toISOString()
    };

    if (editingQuestionId) {
        await updateDoc(doc(db, 'questions', editingQuestionId), questionData);
    } else {
        await addDoc(collection(db, 'questions'), { ...questionData, createdAt: new Date().toISOString() });
    }

    resetForm();
    refreshQuestions();
  };

  const refreshQuestions = async () => {
    const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', testId)));
    setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleEdit = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestion(q.question);
    setSubjectId(q.subjectId);
    setLevel(q.level);
    setOptions(q.options || ['', '', '', '']);
    setCorrect(q.correctAnswer);
    setExplanation(q.explanation || '');
    setPreviouslyAskedIn(q.previouslyAskedIn || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this question permanently?')) {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    const sampleData = [
      ["question", "subjectName", "level", "option1", "option2", "option3", "option4", "correctAnswer", "explanation", "previouslyAskedIn"],
      ["What is 10 + 5?", "Mathematics", "Easy", "12", "15", "18", "20", "15", "Simple logic.", "SSC CGL 2022"],
    ];
    const wsSample = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, wsSample, "Template");
    XLSX.writeFile(wb, "PrepNext_Question_Template.xlsx");
  };

  const getBackLink = () => {
    if (test?.examId) return `/admin/tests/${test.examId}`;
    if (test?.subjectId) return `/admin/subject-tests/${test.subjectId}`;
    return `/admin`;
  };

  const StatCard = ({ title, value, span, trend, colorClass = "text-slate-900" }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
      <h3 className={`text-4xl font-bold tracking-tight mb-2 ${colorClass}`}>{value}</h3>
      {trend && <p className="text-xs font-semibold text-emerald-600">{trend}</p>}
      {span && <p className="text-xs font-semibold text-slate-400 mt-2">{span}</p>}
    </div>
  );

  const filtered = questions.filter(q => q.question?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout title={`Content: ${test?.title || 'Registry'}`} backTo={getBackLink()}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 font-medium">Manage queries, options, and explanations.</p>
        <div className="flex gap-3">
          <button onClick={downloadSample} className="bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => { if(showAddForm) { resetForm(); setShowAddForm(false); } else { setShowAddForm(true); } }}
            className="bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-indigo-800 transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel Entry' : 'Add Question'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Questions" value={questions.length} span="In this section" colorClass="text-indigo-600" />
        <StatCard title="Avg. Difficulty" value="Medium" span="Based on distribution" colorClass="text-teal-600" />
        <StatCard title="Completion" value="100%" span="All required fields set" colorClass="text-emerald-600" />
        <div className="bg-[#111827] text-white p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
           <div>
             <p className="text-sm font-medium text-slate-400 mb-2">Registry Type</p>
             <h3 className="text-2xl font-bold tracking-tight mb-2">Internal</h3>
           </div>
           <p className="text-xs text-slate-300 relative z-10 w-3/4">
             Questions securely stored and indexed within your designated cloud segment.
           </p>
           <Database className="absolute bottom-4 right-4 w-20 h-20 text-slate-800" />
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveQuestion} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editingQuestionId ? 'Revise Content' : 'New Question Content'}</h3>
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Question Body</label>
                  <textarea 
                    required 
                    placeholder="Enter question text..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 font-medium min-h-[100px]"
                    value={question} onChange={(e) => setQuestion(e.target.value)} 
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white" value={level} onChange={(e) => setLevel(e.target.value)}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="UGC NET">UGC NET Level</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Legacy Reference (Optional)</label>
                    <input 
                      placeholder="e.g. UPSC Prelims 2021"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={previouslyAskedIn} onChange={(e) => setPreviouslyAskedIn(e.target.value)}
                    />
                 </div>
               </div>

               {!test?.subjectId && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Domain / Subject</label>
                      <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); if(e.target.value) setNewSubjectName(''); }}>
                        <option value="">Select Domain</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Create New Domain</label>
                      <input placeholder="Type domain name..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={newSubjectName} onChange={(e) => { setNewSubjectName(e.target.value); if(e.target.value) setSubjectId(''); }} />
                    </div>
                 </div>
               )}

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">Multiple Choice Options (Select Correct Answer via Button)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {options.map((opt, i) => (
                       <div key={i} className="flex relative">
                         <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2">
                           <button 
                             type="button" 
                             onClick={() => setCorrect(opt)}
                             className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm ${correct === opt && opt !== '' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                             title="Mark as correct"
                           >
                             {String.fromCharCode(65 + i)}
                           </button>
                         </div>
                         <input 
                           required 
                           placeholder={`Option ${i+1}`}
                           className={`w-full py-3 pl-12 pr-4 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium ${correct === opt && opt !== '' ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300'}`}
                           value={opt} onChange={(e) => {
                              const newOpt = [...options];
                              newOpt[i] = e.target.value;
                              setOptions(newOpt);
                           }} 
                         />
                       </div>
                     ))}
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Rationalization / Explanation</label>
                 <textarea 
                   placeholder="A logic-based solution..."
                   className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-medium min-h-[80px]"
                   value={explanation} onChange={(e) => setExplanation(e.target.value)} 
                 />
               </div>
            </div>
            <div className="mt-8 flex gap-3">
               <button type="submit" className="bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors">
                 {editingQuestionId ? 'Save Revisions' : 'Compile Entry'}
               </button>
            </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <div className="flex gap-4">
             <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                />
             </div>
           </div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showing {filtered.length} QUESTIONS</p>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="p-4 pl-6 font-semibold w-16">#</th>
                <th className="p-4 font-semibold">Question Details</th>
                <th className="p-4 font-semibold">Meta Data</th>
                <th className="p-4 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, idx) => {
                const sub = subjects.find(s => s.id === q.subjectId);
                return (
                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6 text-slate-500 font-medium align-top">
                      {idx + 1}
                    </td>
                    <td className="p-4 align-top">
                       <p className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-relaxed">{q.question}</p>
                       <div className="flex flex-col gap-1 mt-1">
                          {q.options && q.options.map((opt: string, optI: number) => {
                             const isCorrect = String(opt) === String(q.correctAnswer);
                             return (
                               <div key={optI} className={`text-xs flex items-start gap-2 ${isCorrect ? 'text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded -ml-2' : 'text-slate-500'}`}>
                                  <span>{String.fromCharCode(65 + optI)}.</span>
                                  <span>{opt}</span>
                               </div>
                             );
                          })}
                       </div>
                    </td>
                    <td className="p-4 align-top">
                       <div className="flex flex-col gap-2">
                          {sub && <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{sub.name}</span>}
                          <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">{q.level || 'Standard'}</span>
                          {q.previouslyAskedIn && <span className="text-[10px] text-slate-400 font-semibold">{q.previouslyAskedIn}</span>}
                       </div>
                    </td>
                    <td className="p-4 pr-6 text-right align-top">
                       <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button onClick={() => handleEdit(q)} className="p-2 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Edit Question">
                             <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(q.id)} className="p-2 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete Question">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                )}
              )}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No questions found in this registry.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
