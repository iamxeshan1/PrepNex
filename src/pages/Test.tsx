import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsByTestId, saveResult } from '../services/db';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Clock, ChevronRight, ChevronLeft, Send, AlertTriangle } from 'lucide-react';

export default function Test() {
  const { testId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const stateRef = useRef({ answers, questions, test });
  useEffect(() => {
    stateRef.current = { answers, questions, test };
  }, [answers, questions, test]);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) return;
      let tSnap = await getDoc(doc(db, 'tests', testId));
      let isLive = false;
      if (!tSnap.exists()) {
        tSnap = await getDoc(doc(db, 'liveTests', testId));
        if (tSnap.exists()) isLive = true;
      }

      if (tSnap.exists()) {
        const tData: any = { id: tSnap.id, ...tSnap.data(), isLive };
        
        // Access Check
        if (isLive) {
          const isEnrolled = tData.enrolledUsers?.includes(profile?.userId || profile?.id);
          const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnexedtech@gmail.com';
          if (!isEnrolled && !isAdmin) {
             navigate('/dashboard');
             return;
          }
        } else if (!tData.isFree) {
          const hasExamAccess = tData.examId && (profile?.purchasedExams?.includes(tData.examId) || profile?.freeExams?.includes(tData.examId));
          const hasSubjectAccess = tData.subjectId && (profile?.purchasedSubjects?.includes(tData.subjectId) || profile?.freeSubjects?.includes(tData.subjectId));
          const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnexedtech@gmail.com';
          const isPremium = profile?.isPremium;
          
          if (!hasExamAccess && !hasSubjectAccess && !isAdmin && !isPremium) {
             navigate(`/premium?examId=${tData.examId}`);
             return;
          }
        }
        
        setTest(tData);
        setTimeLeft(tData.duration * 60);
      }
      const qData = await getQuestionsByTestId(testId);
      setQuestions(qData || []);
      setLoading(false);
    };
    fetchTestData();
  }, [testId]);

  useEffect(() => {
    if (loading || !timeLeft) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, !!testId]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentAnswers = stateRef.current.answers;
    const currentQuestions = stateRef.current.questions;
    const currentTest = stateRef.current.test;

    let totalMarksObtained = 0;
    let maxPossibleMarks = currentTest.totalMarks || 0;
    let correctCount = 0;
    let subjectStats: Record<string, { total: number, correct: number, score: number, maxScore: number }> = {};
    
    const breakdown = currentQuestions.map(q => {
      const isCorrect = currentAnswers[q.id] === q.correctAnswer;
      const qSubjectId = q.subjectId || 'general';
      
      if (!subjectStats[qSubjectId]) {
        subjectStats[qSubjectId] = { total: 0, correct: 0, score: 0, maxScore: 0 };
      }
      subjectStats[qSubjectId].total++;

      let marksEarned = 0;
      let maxMarksForQ = 0;

      if (currentTest.sections && currentTest.sections.length > 0) {
        const section = currentTest.sections.find((s: any) => s.subjectId === q.subjectId);
        if (section) {
          maxMarksForQ = (section.marksPerQuestion || 1);
        } else {
          maxMarksForQ = 1;
        }
      } else {
        maxMarksForQ = (currentTest.totalMarks || 100) / currentQuestions.length;
      }

      subjectStats[qSubjectId].maxScore += maxMarksForQ;

      if (isCorrect) {
        correctCount++;
        marksEarned = maxMarksForQ;
        totalMarksObtained += marksEarned;
        subjectStats[qSubjectId].correct++;
        subjectStats[qSubjectId].score += marksEarned;
      }

      return {
        questionId: q.id,
        subjectId: qSubjectId,
        selected: currentAnswers[q.id],
        isCorrect
      };
    });

    const score = Math.min(currentTest.totalMarks || 100, Math.round(totalMarksObtained));
    
    const resultId = await saveResult({
      userId: profile.userId || profile.id,
      examId: currentTest.examId || null,
      testId: currentTest.id,
      score,
      totalQuestions: currentQuestions.length,
      correctCount,
      answers: breakdown,
      subjectStats,
      obtainedMarks: totalMarksObtained,
      maxMarks: currentTest.totalMarks || 100
    });

    // Update user stats
    const userRef = doc(db, 'users', profile.userId);
    const newAttempted = (profile.testsAttempted || 0) + 1;
    const currentScorePercent = (totalMarksObtained / (currentTest.totalMarks || 1)) * 100;
    const newAvg = ((profile.averageScore || 0) * (profile.testsAttempted || 0) + currentScorePercent) / newAttempted;
    
    await updateDoc(userRef, {
      testsAttempted: newAttempted,
      averageScore: newAvg
    });

    navigate(`/result/${resultId}`);
  };

  const currentQ = questions[currentIdx];

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-primary animate-pulse">Initializing Exam Environment...</div>;
  if (!questions.length) return <div className="flex h-screen items-center justify-center">No questions found for this test.</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">{test.title}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 transition-colors ${timeLeft < 300 ? 'border-red-100 bg-red-50 text-red-600 animate-pulse' : 'border-primary/10 bg-primary/5 text-primary'}`}>
          <Clock className="w-5 h-5" />
          <span className="font-mono text-xl font-extrabold">{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={() => { if(window.confirm('Finish and submit now?')) handleSubmit(); }}
          className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Finish Test
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="hidden md:block w-72 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-y-auto max-h-[calc(100vh-180px)]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border-2 ${
                  currentIdx === i ? 'border-primary bg-primary text-white scale-110 shadow-lg' : 
                  answers[questions[i].id] ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm relative flex flex-col">
          {submitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold text-primary">Submitting Responses...</p>
            </div>
          )}

          <div className="flex-1">
            <div className="text-sm font-bold text-secondary mb-4 uppercase tracking-widest">Question {currentIdx + 1}</div>
            <h2 className="text-xl md:text-2xl font-bold text-primary leading-tight mb-10">{currentQ.question}</h2>

            <div className="space-y-4">
              {currentQ.options.map((option: string, idx: number) => {
                const isSelected = answers[currentQ.id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
                    className={`w-full p-5 text-left rounded-2xl border-2 font-medium transition-all flex items-center justify-between group ${
                      isSelected ? 'border-primary bg-primary/5 text-primary shadow-inner' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex-1">{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-slate-200 group-hover:border-slate-400'}`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            
            <div className="hidden sm:block text-xs font-bold text-slate-300">
              Auto-saving enabled
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-2 px-8 py-3 bg-slate-100 text-primary rounded-xl font-bold border border-slate-200 hover:border-primary transition-all active:scale-95"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => { if(window.confirm('Finish and submit now?')) handleSubmit(); }}
                className="flex items-center gap-2 px-8 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all active:scale-95"
              >
                Submit Test <Send className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Warning Bar */}
      {timeLeft < 120 && (
        <div className="bg-orange-500 text-white text-center py-2 text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-bottom">
          <AlertTriangle className="w-4 h-4" /> Hurry up! Less than 2 minutes remaining.
        </div>
      )}
    </div>
  );
}
