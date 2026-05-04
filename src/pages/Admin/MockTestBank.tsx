import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, getDocs, updateDoc, doc, addDoc, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, FileText, Upload, ChevronRight, X, Shield, Edit3, Trash2, Loader2, Download } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

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
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newQ.subjectId && !newQ.newSubjectName) || !newQ.question || !newQ.correctAnswer) {
      alert("Please fill required fields");
      return;
    }

    try {
      let subjectId = newQ.subjectId;
      
      // Create new subject if needed
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
        alert("Question updated in Master Bank");
      } else {
        await addDoc(collection(db, 'questions'), { ...questionData, createdAt: new Date().toISOString() });
        alert("Question added to Master Bank");
      }

      setNewQ({
        subjectId: '',
        newSubjectName: '',
        level: 'Medium',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        previouslyAskedIn: ''
      });
      setEditingQuestionId(null);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error saving question");
    }
  };

  const handleEdit = (q: any) => {
    setEditingQuestionId(q.id);
    setNewQ({
      subjectId: q.subjectId,
      newSubjectName: '',
      level: q.level,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      previouslyAskedIn: q.previouslyAskedIn || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    const headers = [["question", "subjectName", "level", "option1", "option2", "option3", "option4", "correctAnswer", "explanation", "previouslyAskedIn"]];
    const sample = [[
      "What is the capital of France?", 
      subjects[0]?.name || "General Knowledge",
      "Easy",
      "London", "Berlin", "Paris", "Madrid", 
      "Paris", 
      "Paris is the capital and largest city of France.",
      "SSC CGL 2023"
    ]];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);
    XLSX.utils.book_append_sheet(wb, ws, "QuestionBank_Template");
    XLSX.writeFile(wb, "PrepNext_MasterQuestionBank_Template.xlsx");
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
        let count = 0;
        
        // Refresh subjects list internal to avoid stale closure
        const currentSubjectsSnap = await getDocs(collection(db, 'subjects'));
        let tempSubjects = currentSubjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        for (const row of (data as any[])) {
          let subject = tempSubjects.find(s => 
            s.name?.toLowerCase() === row.subjectName?.toLowerCase()
          );

          // Auto-create subject if not found
          if (!subject) {
            const subRef = doc(collection(db, 'subjects'));
            const newSub = { 
              id: subRef.id, 
              name: row.subjectName, 
              createdAt: new Date().toISOString(),
              description: '',
              icon: 'Book'
            };
            batch.set(subRef, newSub);
            tempSubjects.push(newSub as any);
            subject = newSub as any;
          }

          const qRef = doc(collection(db, 'questions'));
          batch.set(qRef, {
            testId: 'MASTER_BANK',
            subjectId: subject.id,
            subjectName: subject.name,
            level: row.level || 'Medium',
            question: row.question,
            options: [row.option1, row.option2, row.option3, row.option4],
            correctAnswer: row.correctAnswer,
            explanation: row.explanation || '',
            previouslyAskedIn: row.previouslyAskedIn || '',
            createdAt: new Date().toISOString()
          });
          count++;
        }
        
        await batch.commit();
        fetchData();
        alert(`Successfully imported ${count} questions to the bank!`);
      } catch (err) {
        console.error("Import error:", err);
        alert("Import failed. Check console for details.");
      } finally {
        setImporting(false);
        setShowImport(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const deleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      setConfirmingDeleteId(null);
      fetchData();
      alert("Question removed from bank.");
    } catch (err: any) {
      alert("Failed to delete question.");
    }
  };

  const deleteAllSubjectQuestions = async () => {
    if (activeSubjectId === 'all') return;
    if (!window.confirm("Are you sure you want to delete ALL questions for this subject?")) return;

    setLoading(true);
    try {
      const qToDelete = questions.filter(q => q.subjectId === activeSubjectId);
      await Promise.all(qToDelete.map(q => deleteDoc(doc(db, 'questions', q.id))));
      fetchData();
      alert(`Successfully deleted ${qToDelete.length} questions from this subject.`);
    } catch (err: any) {
      alert("Failed to delete questions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllInventory = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to delete ALL questions in the entire inventory? This action cannot be undone.")) return;

    setLoading(true);
    try {
      await Promise.all(questions.map(q => deleteDoc(doc(db, 'questions', q.id))));
      fetchData();
      alert(`Successfully cleared ${questions.length} questions from inventory.`);
    } catch (err: any) {
      alert("Failed to clear inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const subjectCounts = subjects.reduce((acc, sub) => {
    acc[sub.id] = questions.filter(q => q.subjectId === sub.id).length;
    return acc;
  }, {} as Record<string, number>);

  const filteredQuestions = activeSubjectId === 'all' 
    ? questions 
    : questions.filter(q => q.subjectId === activeSubjectId);

  return (
    <AdminLayout title="Master Question Bank" backTo="/admin">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-center bg-white p-6 rounded-3xl border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Question Registry</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{questions.length} Questions Available Across {subjects.length} Subjects</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadSample}
            className="px-6 py-3 bg-white text-slate-600 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Template
          </button>
          <button 
            onClick={() => setShowImport(!showImport)}
            className="px-6 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Upload className="w-5 h-5" /> Bulk Import
          </button>
          <button 
            onClick={() => { setShowAddForm(!showAddForm); if(!showAddForm) setEditingQuestionId(null); }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : (editingQuestionId ? 'Cancel Edit' : 'New Question')}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-secondary/5 border-2 border-dashed border-secondary/30 p-12 rounded-[2.5rem] mb-10 text-center animate-in zoom-in-95 duration-300">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} id="master-q-upload" className="hidden" />
          <label htmlFor="master-q-upload" className="cursor-pointer inline-flex flex-col items-center">
            <div className={`w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-secondary shadow-xl shadow-secondary/5 mb-6 ${importing ? 'animate-bounce' : ''}`}>
              <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-secondary tracking-tight uppercase">{importing ? 'Processing Bank...' : 'Upload Bank Excel'}</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 max-w-md mx-auto">Categorize your questions by "subjectName" in the Excel sheet. They will be stored in the master pool.</p>
          </label>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-primary uppercase">Manual Bank Entry</h3>
            <button onClick={() => setShowAddForm(false)}><X className="text-slate-300" /></button>
          </div>
          <form onSubmit={handleSaveQuestion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Subject & Level</label>
                <div className="flex flex-col gap-2">
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={newQ.subjectId}
                    onChange={e => setNewQ({...newQ, subjectId: e.target.value, newSubjectName: ''})}
                  >
                    <option value="">Select Existing Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="new">+ Create New Subject</option>
                  </select>
                  {newQ.subjectId === 'new' && (
                    <input 
                      required
                      className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl outline-none"
                      placeholder="Subject Name"
                      value={newQ.newSubjectName}
                      onChange={e => setNewQ({...newQ, newSubjectName: e.target.value})}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {levels.map(lvl => (
                     <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewQ({...newQ, level: lvl as any})}
                      className={`py-2 rounded-xl font-bold text-xs border transition-all ${newQ.level === lvl ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                     >
                       {lvl}
                     </button>
                   ))}
                </div>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  placeholder="Question text..."
                  value={newQ.question}
                  onChange={e => setNewQ({...newQ, question: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Options & Answer</label>
                {newQ.options.map((opt, i) => (
                  <input 
                    key={i}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    placeholder={`Option ${i+1}`}
                    value={opt}
                    onChange={e => {
                      const opts = [...newQ.options];
                      opts[i] = e.target.value;
                      setNewQ({...newQ, options: opts});
                    }}
                  />
                ))}
                <select 
                  required
                  className="w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl outline-none font-bold text-primary"
                  value={newQ.correctAnswer}
                  onChange={e => setNewQ({...newQ, correctAnswer: e.target.value})}
                >
                  <option value="">Select Correct Option</option>
                  {newQ.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <textarea 
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                placeholder="Explanation (optional)"
                value={newQ.explanation}
                onChange={e => setNewQ({...newQ, explanation: e.target.value})}
              />
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                placeholder="Previously Asked In Exam (optional) e.g., SSC CGL 2023"
                value={newQ.previouslyAskedIn}
                onChange={e => setNewQ({...newQ, previouslyAskedIn: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">
              {editingQuestionId ? 'Update Question' : 'Commit to Master Bank'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Filter By Subject</h3>
          <button 
            onClick={() => setActiveSubjectId('all')}
            className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${activeSubjectId === 'all' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30'}`}
          >
            <span className="font-bold">All Inventory</span>
            <span className={`text-xs px-2 py-1 rounded-lg ${activeSubjectId === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>{questions.length}</span>
          </button>
          {subjects.map(s => (
            <button 
              key={s.id}
              onClick={() => setActiveSubjectId(s.id)}
              className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${activeSubjectId === s.id ? 'bg-secondary border-secondary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-secondary/30'}`}
            >
              <span className="font-bold truncate mr-2">{s.name}</span>
              <span className={`text-xs px-2 py-1 rounded-lg ${activeSubjectId === s.id ? 'bg-white/20' : 'bg-slate-100'}`}>{subjectCounts[s.id] || 0}</span>
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3 space-y-4">
          {activeSubjectId !== 'all' && filteredQuestions.length > 0 && (
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-black text-slate-700">{subjects.find(s => s.id === activeSubjectId)?.name} Questions</h3>
               <button 
                 onClick={deleteAllSubjectQuestions}
                 className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2"
               >
                 <Trash2 className="w-4 h-4" /> Delete All
               </button>
            </div>
          )}
          {activeSubjectId === 'all' && filteredQuestions.length > 0 && (
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-black text-slate-700">All Inventory Questions</h3>
               <button 
                 onClick={clearAllInventory}
                 className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all flex items-center gap-2"
               >
                 <Trash2 className="w-4 h-4" /> Clear All Inventory
               </button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Auditing Bank Inventory...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
              <Shield className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Empty Vault</h3>
              <p className="text-sm font-bold text-slate-400 mt-2">No master questions found in this category.</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                    <span className="px-3 py-1 bg-secondary/5 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest border border-secondary/10">
                      {subjects.find(s => s.id === q.subjectId)?.name || 'Misc'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      q.level === 'Hard' ? 'bg-red-50 text-red-500' : 
                      q.level === 'UGC NET' ? 'bg-purple-50 text-purple-600' : 
                      q.level === 'Easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {q.level || 'Medium'}
                    </span>
                  </div>
                  {confirmingDeleteId === q.id ? (
                    <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter px-1">Remove?</span>
                      <button 
                        onClick={() => deleteQuestion(q.id)}
                        className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-2 py-1 bg-white text-slate-400 text-[10px] font-black rounded-lg border border-slate-200"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(q)} className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all" title="Edit Question">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => setConfirmingDeleteId(q.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Remove from Bank">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-6 leading-relaxed">{q.question}</h4>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {q.options.map((opt: string, i: number) => (
                    <div key={i} className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${opt === q.correctAnswer ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs font-medium text-amber-700 leading-relaxed italic">
                    <span className="font-black uppercase tracking-widest mr-2">Explanation:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
