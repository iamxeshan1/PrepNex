import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, ChevronRight, FileText, Clock, Award, Upload, Download, Info, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminTests() {
  const { examId, subjectId } = useParams();
  const [parent, setParent] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [marks, setMarks] = useState('100');
  const [positiveMarks, setPositiveMarks] = useState('1');
  const [negativeMarks, setNegativeMarks] = useState('0.25');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('0');
  
  // Weightage State
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const parentCol = examId ? 'exams' : 'subjects';
      const parentId = examId || subjectId;
      if (!parentId) return;

      const [pSnap, tSnap, sSnap] = await Promise.all([
        getDoc(doc(db, parentCol, parentId)),
        getDocs(query(
          collection(db, 'tests'), 
          where(examId ? 'examId' : 'subjectId', '==', parentId)
        )),
        getDocs(collection(db, 'subjects'))
      ]);
      if (pSnap.exists()) setParent(pSnap.data());
      setTests(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSubjects(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [examId, subjectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = examId || subjectId;
    await addDoc(collection(db, 'tests'), {
      ...(examId ? { examId } : { subjectId }),
      title,
      duration: Number(duration),
      totalMarks: Number(marks),
      positiveMarks: Number(positiveMarks),
      negativeMarks: Number(negativeMarks),
      isFree,
      price: isFree ? 0 : Number(price),
      sections: examId ? sections : [], // Sections only relevant for Exams
      createdAt: new Date().toISOString()
    });
    resetForm();
    refreshTests();
  };

  const resetForm = () => {
    setTitle('');
    setDuration('60');
    setMarks('100');
    setPositiveMarks('1');
    setNegativeMarks('0.25');
    setIsFree(false);
    setPrice('0');
    setSections([]);
    setShowAddForm(false);
  };

  const refreshTests = async () => {
    const parentId = examId || subjectId;
    const tSnap = await getDocs(query(
      collection(db, 'tests'), 
      where(examId ? 'examId' : 'subjectId', '==', parentId)
    ));
    setTests(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this test and all its questions?')) {
      await deleteDoc(doc(db, 'tests', id));
      setTests(tests.filter(t => t.id !== id));
    }
  };

  const addSection = () => {
    setSections([...sections, { subjectId: '', subjectName: '', numQuestions: 0, marksPerQuestion: 1 }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...sections];
    if (field === 'subjectId') {
      const sub = subjects.find(s => s.id === value);
      newSections[index].subjectId = value;
      newSections[index].subjectName = sub?.name || '';
    } else {
      newSections[index][field] = value;
    }
    setSections(newSections);
  };

  const downloadSample = () => {
    const wb = XLSX.utils.book_new();
    
    // Instructions Sheet
    const instData = [
      ["PrepNex - Mock Test Batch Import Template"],
      ["This tool allows you to import multiple tests at once."],
      [],
      ["FIELD DEFINITIONS:"],
      ["title", "The name of the test as it will appear to students"],
      ["duration", "Duration in minutes (e.g. 120)"],
      ["totalMarks", "Maximum marks attainable in this test"],
      ["isFree", "Set to 'Yes' for free access, or 'No' for paid/premium"],
      ["price", "Price in INR (Required if isFree is 'No')"],
      [],
      ["PRO TIP:", "Ensure there are no blank rows between data entries."]
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instData);
    wsInst['!cols'] = [{wch: 20}, {wch: 60}];
    XLSX.utils.book_append_sheet(wb, wsInst, "Instructions");

    // Sample Data Sheet
    const sampleData = [
      ["title", "duration", "totalMarks", "isFree", "price"],
      ["General Awareness Full Mock 01", 120, 100, "No", 49],
      ["Weekly Free Practice Quiz", 30, 25, "Yes", 0],
      ["Advanced Performance Assessment", 90, 75, "No", 29]
    ];
    const wsSample = XLSX.utils.aoa_to_sheet(sampleData);
    wsSample['!cols'] = [{wch: 35}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsSample, "Data Input Template");

    XLSX.writeFile(wb, "PrepNex_Tests_Import_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      // Look for a sheet named "Data Input Template" or the first sheet
      const wsname = wb.SheetNames.find(n => n.includes("Template")) || wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const batch = writeBatch(db);
      const parentId = examId || subjectId;
      
      for (const row of (data as any[])) {
        const testRef = doc(collection(db, 'tests'));
        const _isFree = String(row.isFree).toLowerCase() === 'yes';
        batch.set(testRef, {
          ...(examId ? { examId } : { subjectId }),
          title: row.title,
          duration: Number(row.duration) || 60,
          totalMarks: Number(row.totalMarks) || 100,
          isFree: _isFree,
          price: _isFree ? 0 : (Number(row.price) || 0),
          createdAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      setShowImport(false);
      refreshTests();
      alert('Import successful!');
    };
    reader.readAsBinaryString(file);
  };

  return (
    <AdminLayout title={`Tests: ${parent?.name || 'Loading...'}`} backTo={examId ? "/admin/exams" : "/admin/subjects"}>
      <div className="mb-8 flex flex-wrap gap-4 justify-end">
        <button 
          onClick={downloadSample}
          className="bg-white text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all"
        >
          <Download className="w-5 h-5" /> Download Sample
        </button>
        <button 
          onClick={() => setShowImport(!showImport)}
          className="bg-secondary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Upload className="w-5 h-5" /> Import Excel
        </button>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> {showAddForm ? 'Cancel' : 'Add New Mock Test'}
        </button>
      </div>

      {showImport && (
        <div className="bg-secondary/5 border-2 border-dashed border-secondary/30 p-8 rounded-3xl mb-10 text-center">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} id="file-upload" className="hidden" />
          <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-secondary uppercase tracking-tight">Upload Excel File</h3>
            <p className="text-xs font-bold text-slate-500 mt-2">Maximum file size 5MB. Must follow the sample format.</p>
          </label>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Test Title</label>
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={title} onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Full Length Mock Test 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Duration (Minutes)</label>
              <input 
                type="number" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={duration} onChange={(e) => setDuration(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Total Marks</label>
              <input 
                type="number" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={marks} onChange={(e) => setMarks(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Positive Marks per Question</label>
              <input 
                type="number" step="0.01" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={positiveMarks} onChange={(e) => setPositiveMarks(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Negative Marks per Question (e.g. 0.25)</label>
              <input 
                type="number" step="0.01" required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                value={negativeMarks} onChange={(e) => setNegativeMarks(e.target.value)} 
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-100">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                checked={isFree} onChange={(e) => setIsFree(e.target.checked)} 
              />
              <span className="text-sm font-bold text-slate-700">Mark as Free Test (Accessible without subscription)</span>
            </div>
            {!isFree && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Price (₹)</label>
                <input 
                  type="number" required 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  value={price} onChange={(e) => setPrice(e.target.value)} 
                />
              </div>
            )}

            {examId && (
              <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-primary uppercase tracking-tight flex items-center gap-2">
                    Marks Distribution / Weightage
                    <Info className="w-4 h-4 text-slate-300" />
                  </h3>
                  <button type="button" onClick={addSection} className="text-xs font-bold text-secondary flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Subject
                  </button>
                </div>
                
                <div className="space-y-3">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1 min-w-[200px] space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Subject</label>
                        <select 
                          required
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none"
                          value={sec.subjectId} onChange={(e) => updateSection(idx, 'subjectId', e.target.value)}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Questions</label>
                        <input 
                          type="number" required
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none"
                          value={sec.numQuestions} onChange={(e) => updateSection(idx, 'numQuestions', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Marks/Q</label>
                        <input 
                          type="number" step="0.01" required
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none"
                          value={sec.marksPerQuestion} onChange={(e) => updateSection(idx, 'marksPerQuestion', Number(e.target.value))}
                        />
                      </div>
                      <button type="button" onClick={() => removeSection(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {sections.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-widest italic">No sections added. Marks based on total marks only.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
            Save Mock Test
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm transition-all hover:border-primary">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-primary tracking-tight truncate">{test.title}</h4>
                <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Clock className="w-3 h-3" /> {test.duration}m</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Award className="w-3 h-3" /> {test.totalMarks}M</span>
                  {test.isFree ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded tracking-tighter">FREE</span>
                  ) : (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded tracking-tighter">₹{test.price || 0}</span>
                  )}
                  {test.sections?.length > 0 && (
                    <span className="text-[10px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded tracking-tighter">
                      {test.sections.length} SECTIONS
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Link to={`/admin/questions/${test.id}`} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                Questions <ChevronRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => handleDelete(test.id)} 
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

