import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch } from 'firebase/firestore';
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
  const [showImport, setShowImport] = useState(false);

  // Form State
  const [question, setQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState('');
  const [explanation, setExplanation] = useState('');

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correct) return alert('Select correct answer');
    await addDoc(collection(db, 'questions'), {
      testId,
      subjectId: test?.subjectId || subjectId,
      question,
      options,
      correctAnswer: correct,
      explanation,
      createdAt: new Date().toISOString()
    });
    setQuestion(''); setOptions(['', '', '', '']); setCorrect(''); setExplanation(''); setSubjectId('');
    setShowAddForm(false);
    refreshQuestions();
  };

  const refreshQuestions = async () => {
    const qSnap = await getDocs(query(collection(db, 'questions'), where('testId', '==', testId)));
    setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this question?')) {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const downloadSample = () => {
    const data = [
      { 
        question: 'What is the capital of France?', 
        subjectName: 'General Knowledge',
        option1: 'London', 
        option2: 'Paris', 
        option3: 'Berlin', 
        option4: 'Madrid', 
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital and most populous city of France.'
      },
      { 
        question: 'Which component is the brain of a computer?', 
        subjectName: 'Computer Science',
        option1: 'RAM', 
        option2: 'Hard Disk', 
        option3: 'CPU', 
        option4: 'Monitor', 
        correctAnswer: 'CPU',
        explanation: 'The CPU performs most of the processing inside a computer.'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "questions_sample.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const batch = writeBatch(db);
      
      for (const row of (data as any[])) {
        let qSubId = test?.subjectId || '';
        if (!qSubId && row.subjectName) {
          const sub = subjects.find(s => s.name.toLowerCase() === String(row.subjectName).toLowerCase());
          qSubId = sub?.id || '';
        }

        const qRef = doc(collection(db, 'questions'));
        batch.set(qRef, {
          testId,
          subjectId: qSubId,
          question: row.question,
          options: [row.option1, row.option2, row.option3, row.option4],
          correctAnswer: row.correctAnswer,
          explanation: row.explanation || '',
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

  return (
    <AdminLayout title={`Questions: ${test?.title || 'Loading...'}`} backTo={test?.examId ? `/admin/tests/${test.examId}` : `/admin/subject-tests/${test?.subjectId}`}>
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
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : 'Add Question'}
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
            <p className="text-xs font-bold text-slate-500 mt-2">Columns: question, subjectName (optional for exams), option1, option2, option3, option4, correctAnswer, explanation</p>
          </label>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6">
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
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject Category</label>
                  <select 
                    required={!test?.subjectId}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                  >
                    <option value="">Select a Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
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
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo">
            Save Question
          </button>
        </form>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const sub = subjects.find(s => s.id === q.subjectId);
          return (
            <div key={q.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-8 shadow-sm group">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Question {idx + 1}</span>
                    {sub && <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded uppercase tracking-tighter shrink-0">{sub.name}</span>}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-primary mt-1 leading-tight">{q.question}</p>
                </div>
                <button 
                  onClick={() => handleDelete(q.id)} 
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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


