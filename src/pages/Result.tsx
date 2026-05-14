import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, CheckCircle, XCircle, AlertCircle, Award, ChevronRight, Share2, Info } from 'lucide-react';

export default function Result() {
  const { resultId } = useParams();
  const [result, setResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId || resultId === 'undefined') {
        setError('Invalid Result ID');
        setLoading(false);
        return;
      }

      try {
        const resSnap = await getDoc(doc(db, 'results', resultId));
        if (resSnap.exists()) {
          const resData = resSnap.data();
          setResult(resData);
          
          const { getQuestionsByTestId } = await import('../services/db');
          const { getDocs, collection } = await import('firebase/firestore');
          
          // Use a safer way to fetch related data
          try {
            const [testSnap, qData, subjectSnap] = await Promise.all([
              getDoc(doc(db, 'tests', resData.testId)).then(s => s.exists() ? s : getDoc(doc(db, 'liveTests', resData.testId))),
              getQuestionsByTestId(resData.testId).catch(() => []),
              getDocs(collection(db, 'subjects')).catch(() => ({ forEach: () => {} }))
            ]);
            
            setQuestions(qData || []);
            
            const sMap: Record<string, string> = {};
            if (subjectSnap && typeof subjectSnap.forEach === 'function') {
              subjectSnap.forEach(doc => {
                sMap[doc.id] = doc.data().name;
              });
            }
            setSubjectMap(sMap);
            
            if (testSnap && testSnap.exists()) {
              setTest({ id: testSnap.id, ...testSnap.data() });
            }
          } catch (innerErr) {
            console.error("Error fetching related data:", innerErr);
            // We can still show the result even if some related data fails
          }
        } else {
          setError('Result not found');
        }
      } catch (err) {
        console.error("Error fetching result:", err);
        setError('Failed to load performance analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resultId]);

  if (loading) return <Layout><div className="h-96 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="font-bold text-primary animate-pulse">Analyzing performance...</p>
  </div></Layout>;

  if (error || !result) return <Layout>
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-[#001f19]">{error || 'Result not found'}</h2>
      <Link to="/dashboard" className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">Return to Dashboard</Link>
    </div>
  </Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 text-primary mb-6 ring-8 ring-primary/5">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">Test Complete!</h1>
          <p className="text-slate-500 font-medium tracking-wide">
            You attempted {test?.title || 'the mock test'} 
            {result.attemptNumber && <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-xs font-black text-slate-400">ATTEMPT #{result.attemptNumber}</span>}
          </p>
        </header>

        {/* Score Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-slate-100 overflow-hidden mb-12">
          <div className="bg-primary p-12 text-center text-white relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="text-6xl md:text-8xl font-black mb-2 animate-in zoom-in duration-700">
                {result.obtainedMarks !== undefined ? Math.round(result.obtainedMarks) : result.score}
                <span className="text-2xl font-bold opacity-40 ml-1">/{result.maxMarks || 100}</span>
              </div>
              <p className="text-blue-200 font-bold uppercase tracking-widest text-sm">Marks Scored</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-slate-100 py-8 bg-white">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">{result.score}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-500">{result.correctCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-red-500">{result.totalQuestions - result.correctCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-600">{result.totalQuestions}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Items</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-16">
          <Link to="/dashboard" className="flex-1 px-8 py-4 bg-white border-2 border-slate-100 text-primary font-bold rounded-2xl text-center hover:border-primary transition-all">
            Return to Dashboard
          </Link>
          <Link to="/exams" className="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-2xl text-center hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
            Try Another Test <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Subject Stats */}
        {result.subjectStats && Object.keys(result.subjectStats).length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-primary mb-8 px-2 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-secondary" />
              Subject Performance
            </h2>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              {Object.entries<any>(result.subjectStats).map(([subjId, stats]) => {
                if (subjId === 'general') return null;
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                const isWeak = accuracy < 50;
                return (
                  <div key={subjId} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#001f19]">{subjectMap[subjId] || 'Subject'}</h4>
                        {isWeak && <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mt-1">Needs Improvement</p>}
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isWeak ? 'text-red-500' : 'text-primary'}`}>
                          {stats.score}/{stats.maxScore} Marks
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-right">{Math.round(accuracy)}% Accuracy</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isWeak ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Question Breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-8 px-2 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-secondary" />
            Answer Review
          </h2>
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const resAns = result.answers?.find((a: any) => a.questionId === q.id);
              const isCorrect = resAns?.isCorrect;
              
              return (
                <div key={q.id} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Question {idx + 1}</div>
                      <h4 className="text-lg font-bold text-primary leading-tight">{q.question}</h4>
                    </div>
                    <div className={`shrink-0 p-2 rounded-xl ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Answer</div>
                      <p className={`font-bold text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{resAns?.selected || 'Not Answered'}</p>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100">
                        <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">Correct Answer</div>
                        <p className="font-bold text-sm text-green-700">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="mt-6 flex gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Explanation</div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
