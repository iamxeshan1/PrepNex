import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, HelpCircle, CheckCircle2, Upload, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminQuestions() {
  const { testId } = useParams();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

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
    
    // Create new subject if specified
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
        // Refresh subjects local state to avoid redundant creations
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
    setOptions(q.options);
    setCorrect(q.correctAnswer);
    setExplanation(q.explanation || '');
    setPreviouslyAskedIn(q.previouslyAskedIn || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this question?')) {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    
    // Instructions
    const instData = [
      ["PrepNext - Question Bank Batch Import"],
      ["Guidelines for importing questions:"],
      [],
      ["FIELD", "DESCRIPTION"],
      ["question", "The actual text of the question. You can use Markdown."],
      ["subjectName", "Optional. If not provided, it uses the test's main subject."],
      ["option1", "Text for the first option"],
      ["option2", "Text for the second option"],
      ["option3", "Text for the third option"],
      ["option4", "Text for the fourth option"],
      ["correctAnswer", "MUST match exactly one of the options text."],
      ["explanation", "Optional. Displayed after the student submits."]
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instData);
    wsInst['!cols'] = [{wch: 20}, {wch: 60}];
    XLSX.utils.book_append_sheet(wb, wsInst, "Import Guidelines");

    // Sample
    const sampleData = [
      ["question", "subjectName", "level", "option1", "option2", "option3", "option4", "correctAnswer", "explanation", "previouslyAskedIn"],
      ["What is 10 + 5?", "Mathematics", "Easy", "12", "15", "18", "20", "15", "Simple addition logic.", "SSC CGL 2022"],
      ["Who wrote the Indian Constitution?", "Polity", "Medium", "B.R. Ambedkar", "Nehru", "Gandhi", "Prasad", "B.R. Ambedkar", "Dr. B.R. Ambedkar was the chairman of the drafting committee.", "UPSC Prelims 2023"]
    ];
    const wsSample = XLSX.utils.aoa_to_sheet(sampleData);
    wsSample['!cols'] = [
      {wch: 40}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 40}, {wch: 30}
    ];
    XLSX.utils.book_append_sheet(wb, wsSample, "Question Entry Template");

    XLSX.writeFile(wb, "PrepNext_Questions_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames.find(n => n.includes("Template")) || wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const batch = writeBatch(db);
      
      for (const row of (data as any[])) {
        let qSubId = test?.subjectId || '';
        const rowSubName = String(row.subjectName || '').trim();
        
        if (!qSubId && rowSubName) {
          const sub = subjects.find(s => s.name.toLowerCase() === rowSubName.toLowerCase());
          if (sub) {
            qSubId = sub.id;
          } else {
             // Create Subject On the fly
             const newSubRef = await addDoc(collection(db, 'subjects'), {
               name: rowSubName,
               createdAt: new Date().toISOString()
             });
             qSubId = newSubRef.id;
             // Sync local subjects for next iterations
             const freshSubs = await getDocs(collection(db, 'subjects'));
             const updatedSubs = freshSubs.docs.map(d => ({ id: d.id, ...d.data() }));
             setSubjects(updatedSubs);
          }
        }

        const qRef = doc(collection(db, 'questions'));
        batch.set(qRef, {
          testId,
          subjectId: qSubId,
          level: row.level || 'Medium',
          question: row.question,
          options: [row.option1, row.option2, row.option3, row.option4],
          correctAnswer: row.correctAnswer,
          explanation: row.explanation || '',
          previouslyAskedIn: row.previouslyAskedIn || '',
          createdAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      setShowImport(false);
      refreshQuestions();
      alert('Questions imported successfully!');
    };
    reader.readAsBinaryString(file);
  };

  const getBackLink = () => {
    if (test?.examId) return `/admin/tests/${test.examId}`;
    if (test?.subjectId) return `/admin/subject-tests/${test.subjectId}`;
    return `/admin/mock-tests`; // Default for bank tests
  };

  return (
    <AdminLayout title={`Questions: ${test?.title || 'Loading...'}`} backTo={getBackLink()}>
      <div className="mb-8 flex flex-wrap gap-4 justify-end">
        <button 
          onClick={downloadSample}
          className="bg-white text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all font-logo"
        >
          <Download className="w-5 h-5" /> Sample
        </button>
        <button 
          onClick={() => setShowImport(!showImport)}
          className="bg-secondary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all"
        >
          <Upload className="w-5 h-5" /> Import Excel
        </button>
        <button 
          onClick={() => { setShowAddForm(!showAddForm); if(!showAddForm) setEditingQuestionId(null); }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : (editingQuestionId ? 'Cancel Edit' : 'Add Question')}
        </button>
      </div>

      {showImport && (
        <div className="bg-secondary/5 border-2 border-dashed border-secondary/30 p-8 rounded-3xl mb-10 text-center">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} id="file-upload" className="hidden" />
          <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-secondary uppercase tracking-tight">Upload Questions Excel</h3>
            <p className="text-xs font-bold text-slate-500 mt-2">Columns: question, subjectName (optional for exams), option1, option2, option3, option4, correctAnswer, explanation, previouslyAskedIn</p>
          </label>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSaveQuestion} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">Question Text</label>
                <textarea 
                  required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  value={question} onChange={(e) => setQuestion(e.target.value)} 
                />
              </div>
              
              {!test?.subjectId && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject Category</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold"
                    value={subjectId} onChange={(e) => { setSubjectId(e.target.value); if(e.target.value) setNewSubjectName(''); }}
                  >
                    <option value="">Select a Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Or Create New Subject</label>
                  <input 
                    placeholder="Type subject name..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    value={newSubjectName} onChange={(e) => { setNewSubjectName(e.target.value); if(e.target.value) setSubjectId(''); }}
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Question Level</label>
              <div className="grid grid-cols-4 gap-2">
                 {['Easy', 'Medium', 'Hard', 'UGC NET'].map((lvl) => (
                   <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-3 rounded-xl font-bold border-2 transition-all text-xs ${level === lvl ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                   >
                     {lvl}
                   </button>
                 ))}
              </div>
            </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Option {i + 1}</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary ${correct === opt && opt !== '' ? 'border-green-500' : 'border-slate-200'}`}
                      value={opt} onChange={(e) => {
                        const newOpt = [...options];
                        newOpt[i] = e.target.value;
                        setOptions(newOpt);
                      }} 
                    />
                    <button 
                      type="button"
                      onClick={() => setCorrect(opt)}
                      className={`px-4 rounded-xl font-bold text-xs transition-all ${correct === opt && opt !== '' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      Correct
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Explanation (Optional)</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary h-24"
                value={explanation} onChange={(e) => setExplanation(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Previously Asked In (Optional)</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={previouslyAskedIn} onChange={(e) => setPreviouslyAskedIn(e.target.value)} 
                placeholder="e.g. UPSC Prelims 2023, SSC CGL 2022"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo">
            {editingQuestionId ? 'Update Question' : 'Save Question'}
          </button>
        </form>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const sub = subjects.find(s => s.id === q.subjectId);
          return (
            <div key={q.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-8 shadow-sm group">
              <div className="flex justify-between items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Question {idx + 1}</span>
                    {sub && <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded uppercase tracking-tighter shrink-0">{sub.name}</span>}
                    {q.previouslyAskedIn && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-tighter shrink-0">Asked In: {q.previouslyAskedIn}</span>}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-primary mt-1 leading-tight">{q.question}</p>
                </div>
                 <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(q)}
                    className="p-2 text-primary hover:text-primary hover:bg-primary/5 rounded-xl transition-all shrink-0"
                    title="Edit Question"
                  >
                     <HelpCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt: string, i: number) => (
                  <div key={i} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${opt === q.correctAnswer ? 'border-green-500 bg-green-50 shadow-sm shadow-green-100' : 'border-slate-50 opacity-60'}`}>
                    <span className={`text-sm font-medium pr-2 ${opt === q.correctAnswer ? 'text-green-700 font-bold' : 'text-slate-600'}`}>{opt}</span>
                    {opt === q.correctAnswer && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}


