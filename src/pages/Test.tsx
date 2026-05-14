import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsByTestId, saveResult, getResultsByTestId } from '../services/db';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Logo } from '../components/Logo';
import { Clock, ChevronRight, ChevronLeft, Send, AlertTriangle, Menu, Bookmark, HelpCircle, XCircle, CheckCircle2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { uiConfirm } from '../lib/customUI';

export default function Test() {
  const { testId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [scheduledStartTime, setScheduledStartTime] = useState<string | null>(null);
  const [secondsToLive, setSecondsToLive] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const stateRef = useRef({ answers, questions, test, markedForReview });
  useEffect(() => {
    stateRef.current = { answers, questions, test, markedForReview };
  }, [answers, questions, test, markedForReview]);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId || !profile) return;
      
      const uId = profile.userId || profile.id;
      
      // Fetch previous attempts
      const prevResults = await getResultsByTestId(uId, testId);
      if (prevResults && prevResults.length > 0) {
        setAttemptNumber(prevResults.length + 1);
      }

      let tSnap = await getDoc(doc(db, 'tests', testId));
      let isLive = false;
      if (!tSnap.exists()) {
        tSnap = await getDoc(doc(db, 'liveTests', testId));
        if (tSnap.exists()) isLive = true;
      }

      if (tSnap.exists()) {
        const tData: any = { id: tSnap.id, ...tSnap.data(), isLive };
        
        // Handle Scheduled Start Time
        if (tData.scheduledStartTime) {
          const now = new Date().getTime();
          const start = new Date(tData.scheduledStartTime).getTime();
          const diff = (start - now) / 1000;
          
          if (diff > 0) {
            setSecondsToLive(Math.floor(diff));
            setScheduledStartTime(tData.scheduledStartTime);
          }
        }

        const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
        
        if (tData.status === 'draft' && !isAdmin) {
           navigate('/dashboard');
           return;
        }

        // Access Check
        if (isLive) {
          const isEnrolled = tData.enrolledUsers?.includes(profile?.userId || profile?.id);
          const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
          if (!isEnrolled && !isAdmin) {
             navigate('/dashboard');
             return;
          }
        } else if (!tData.isFree) {
          let isParentPaid = false;
          if (tData.examId) {
            const eSnap = await getDoc(doc(db, 'exams', tData.examId));
            if (eSnap.exists() && eSnap.data().isPaid) {
              isParentPaid = true;
            }
          } else if (tData.subjectId) {
            // Subjects are typically free, but if there's paid logic, handle it.
            // Assuming subjects act like free exams generally.
            isParentPaid = false;
          }

          const hasExamAccess = tData.examId && isParentPaid && (profile?.purchasedExams?.includes(tData.examId) || profile?.freeExams?.includes(tData.examId));
          const hasSubjectAccess = tData.subjectId && isParentPaid && (profile?.purchasedSubjects?.includes(tData.subjectId) || profile?.freeSubjects?.includes(tData.subjectId));
           
          const isAdmin = profile?.role === 'admin' || profile?.email === 'iamxeshan1@gmail.com' || profile?.email === 'prepnextedtech@gmail.com';
          const isPremium = profile?.isPremium;
          
          if (!hasExamAccess && !hasSubjectAccess && !isAdmin && !isPremium) {
             navigate(isParentPaid && tData.examId ? `/premium?examId=${tData.examId}` : '/premium');
             return;
          }
        }
        
        setTest(tData);
        setTimeLeft(tData.duration * 60);
      }
      const qData = await getQuestionsByTestId(testId);
      if (qData?.length) {
        setQuestions(qData);
        setVisited(new Set([qData[0].id]));
      }
      setLoading(false);
    };
    fetchTestData();
  }, [testId, profile]);

  // Scheduled Test Countdown
  useEffect(() => {
    if (secondsToLive === null || secondsToLive <= 0) return;

    const interval = setInterval(() => {
      setSecondsToLive(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsToLive]);

  useEffect(() => {
    if (loading || !timeLeft || (secondsToLive !== null && secondsToLive > 0)) return;
    
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

  const handleSubmit = async (skipConfirm = false) => {
    if (submitting) return;
    
    // Final check to prevent duplicate clicks if button wasn't disabled fast enough
    if (!skipConfirm) {
      uiConfirm('Are you sure you want to submit your answers?', () => handleSubmit(true));
      return;
    }

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const { answers: currentAnswers, questions: currentQuestions, test: currentTest } = stateRef.current;
    
    console.log("Submitting test with answers:", currentAnswers);

    let totalMarksObtained = 0;
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
        maxMarksForQ = Number(section?.marksPerQuestion || 1);
      } else {
        maxMarksForQ = currentTest.positiveMarks !== undefined ? Number(currentTest.positiveMarks) : ((Number(currentTest.totalMarks) || 100) / currentQuestions.length);
      }
      
      const negativeMarks = currentTest.negativeMarks !== undefined ? Number(currentTest.negativeMarks) : 0;

      subjectStats[qSubjectId].maxScore += maxMarksForQ;

      if (isCorrect) {
        correctCount++;
        marksEarned = maxMarksForQ;
        totalMarksObtained += marksEarned;
        subjectStats[qSubjectId].correct++;
        subjectStats[qSubjectId].score += marksEarned;
      } else if (currentAnswers[q.id]) {
        marksEarned = -negativeMarks;
        totalMarksObtained += marksEarned;
        subjectStats[qSubjectId].score += marksEarned;
      }

      return {
        questionId: q.id,
        subjectId: qSubjectId,
        selected: currentAnswers[q.id] || null,
        isCorrect: currentAnswers[q.id] ? isCorrect : false,
        notAttempted: !currentAnswers[q.id]
      };
    });

    const finalMarks = Math.round(totalMarksObtained * 100) / 100;
    const maxMarks = currentTest.totalMarks || 100;

    try {
      const uId = profile.userId || profile.id;
      const resultId = await saveResult({
        userId: uId,
        examId: currentTest.examId || null,
        testId: currentTest.id,
        testTitle: currentTest.title,
        attemptNumber: attemptNumber,
        score: Math.max(0, finalMarks),
        totalQuestions: currentQuestions.length,
        correctCount,
        answers: breakdown,
        subjectStats,
        obtainedMarks: finalMarks,
        maxMarks: maxMarks
      });

      if (!resultId) throw new Error('Failed to save result - no result ID returned');

      // Update user stats
      const userRef = doc(db, 'users', uId);
      const currentScorePercent = (Math.max(0, finalMarks) / (maxMarks || 1)) * 100;
      
      await updateDoc(userRef, {
        testsAttempted: increment(1),
        // Average score logic simplified for now to keep increment atomic
        // To do full avg accurately we'd need a transaction, but incrementing count is most important
      }).catch(e => console.error("Error updating user stats:", e));

      console.log("Submission successful, navigating to result:", resultId);
      navigate(`/result/${resultId}`);
    } catch (err) {
      console.error("Submission failed with error:", err);
      alert('Failed to submit test. Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setVisited(prev => new Set(prev).add(questions[nextIdx].id));
    }
  };

  const toggleMarkForReview = () => {
    const qId = questions[currentIdx].id;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
    handleNext();
  };

  const currentQ = questions[currentIdx];

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-primary animate-pulse">Initializing Exam Environment...</div>;

  if (secondsToLive !== null && secondsToLive > 0) {
    const days = Math.floor(secondsToLive / (24 * 3600));
    const hours = Math.floor((secondsToLive % (24 * 3600)) / 3600);
    const mins = Math.floor((secondsToLive % 3600) / 60);
    const secs = Math.floor(secondsToLive % 60);

    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-[#002D62]/10 border border-slate-100 max-w-xl w-full">
           <div className="w-44 h-44 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Clock className="w-20 h-20 text-[#002D62] animate-spin duration-[10000ms]" />
           </div>
           <h2 className="text-4xl font-black text-[#002D62] tracking-tight mb-2 uppercase">Scheduled Test</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-12">{test?.title}</p>
           
           <div className="grid grid-cols-4 gap-4 mb-12">
             {[
               { val: days, label: 'Days' },
               { val: hours, label: 'Hrs' },
               { val: mins, label: 'Min' },
               { val: secs, label: 'Sec' }
             ].map((time, i) => (
               <div key={i} className="flex flex-col">
                 <div className="bg-[#002D62]/5 border border-[#002D62]/10 rounded-[1.5rem] p-5 text-3xl font-black text-[#002D62]">{time.val.toString().padStart(2, '0')}</div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{time.label}</span>
               </div>
             ))}
           </div>
           
           <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 inline-flex items-center gap-3 mb-10">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
             <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Starts @ {new Date(scheduledStartTime!).toLocaleString()}</p>
           </div>
           
           <Link to="/dashboard" className="block w-full py-6 bg-[#002D62] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
             Wait in Lobby
           </Link>
        </div>
      </div>
    );
  }

  if (!questions.length) return <div className="flex h-screen items-center justify-center">No questions found for this test.</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percentage = Math.round(((currentIdx + 1) / questions.length) * 100);

  // Dynamic Marks Calculation
  const getMarksForQuestion = () => {
    if (!currentQ || !test) return { pos: 0, neg: 0 };
    
    let pos = 0;
    if (test.sections && test.sections.length > 0) {
      const section = test.sections.find((s: any) => s.subjectId === currentQ.subjectId);
      pos = Number(section?.marksPerQuestion || 1);
    } else {
      pos = test.positiveMarks !== undefined ? Number(test.positiveMarks) : ((Number(test.totalMarks) || 100) / questions.length);
    }
    const neg = test.negativeMarks !== undefined ? Number(test.negativeMarks) : 0;
    return { pos, neg };
  };

  const { pos: positiveMarks, neg: negativeMarks } = getMarksForQuestion();

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f8f9fa] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Logo className="text-xl" />
          <div className="hidden md:block h-6 w-px bg-slate-200" />
          <span className="hidden md:block font-medium text-slate-600">{test.title}</span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="border border-slate-200 rounded-md px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
            <span className="font-mono text-sm md:text-base font-bold text-slate-700">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => handleSubmit()}
            className="bg-[#002f26] text-white px-4 py-2 md:px-6 md:py-2.5 rounded-md font-medium text-xs md:text-sm hover:bg-[#001f19] transition-all"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative pb-[140px] sm:pb-[80px] lg:pb-0 w-full">
          
          {/* Left Sidebar */}
          <aside className="w-full lg:w-[320px] bg-[#f8f9fa] lg:border-r border-slate-200 flex flex-col order-2 lg:order-1 lg:h-full lg:overflow-y-auto border-t lg:border-t-0 shrink-0">
            {/* Profile */}
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                 {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" loading="lazy" decoding="async" width="48" height="48" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                       <User className="w-6 h-6 text-slate-400" />
                    </div>
                 )}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Candidate</p>
                <h3 className="font-bold text-[#001f19] leading-tight">{profile?.name || 'User'}</h3>
              </div>
            </div>

            {/* Palette */}
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#001f19] tracking-tight">Question Palette</h3>
                <span className="text-xs text-slate-500 font-medium">{questions.length} Questions</span>
              </div>
              
              <div className="grid grid-cols-5 gap-2 md:gap-3 mb-8">
                {questions.map((q, i) => {
                  const isCurrent = currentIdx === i;
                  const hasAnswered = !!answers[q.id];
                  const isMarked = markedForReview.has(q.id);
                  const isVisited = visited.has(q.id);
                  
                  let classes = "bg-white border-slate-200 text-slate-600"; 
                  if (hasAnswered) {
                      classes = "bg-[#065f46] border-[#065f46] text-white"; 
                  } else if (isMarked) {
                      classes = "bg-orange-500 border-orange-500 text-white";
                  } else if (isVisited) {
                      classes = "bg-slate-100 border-slate-200 text-slate-600";
                  }
                  
                  if (isCurrent) {
                      classes = "bg-white border-[#065f46] text-[#065f46] font-bold";
                  }
                  
                  return (
                    <button 
                      key={i} 
                      onClick={() => { setCurrentIdx(i); setVisited(prev => new Set(prev).add(questions[i].id)); }} 
                      className={`aspect-square rounded text-xs md:text-sm font-medium flex items-center justify-center border transition-all ${classes}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-auto grid grid-cols-2 gap-y-4 gap-x-2 text-[10px] md:text-xs font-bold text-slate-700 bg-white p-4 rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#065f46] rounded-sm" /> ATTEMPTED</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-slate-200 rounded-sm" /> NOT VISITED</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded-sm" /> MARKED</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded-sm" /> NOT ATTEMPTED</div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col order-1 lg:order-2 bg-white lg:bg-[#f8f9fa] relative lg:h-full lg:overflow-hidden w-full">
             {/* Question Area */}
             <div className="flex-1 lg:overflow-y-auto px-4 md:px-8 pb-8 pt-6">
                 {/* Breadcrumbs */}
                 <div className="max-w-5xl mx-auto flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 font-medium">
                       <span>{currentQ.subjectName || test?.title || 'General Studies'}</span>
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                       <span className="font-semibold text-[#065f46]">Question {currentIdx + 1}</span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm font-bold">
                       <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> +{positiveMarks}
                       </span>
                       <span className="text-red-500 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> -{negativeMarks}
                       </span>
                    </div>
                 </div>

                 {/* White Card */}
                 <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-200 p-6 md:p-8">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-8 leading-snug">{currentQ.question}</h3>
                    {/* Options */}
                    <div className="space-y-4">
                       {currentQ.options.map((option: string, idx: number) => {
                         const isSelected = answers[currentQ.id] === option;
                         return (
                           <button
                             key={idx}
                             onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
                             className={`w-full p-4 md:p-5 text-left rounded-lg border transition-all flex items-center gap-4 ${
                               isSelected 
                                 ? 'border-[#065f46] bg-[#f0fdf4]' 
                                 : 'border-slate-200 hover:border-slate-300 bg-white'
                             }`}
                           >
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#065f46]' : 'border-slate-300'}`}>
                               {isSelected && <div className="w-2.5 h-2.5 bg-[#065f46] rounded-full" />}
                             </div>
                             <span className={`text-sm md:text-base font-medium ${isSelected ? 'text-[#065f46]' : 'text-slate-700'}`}>{option}</span>
                           </button>
                         );
                       })}
                     </div>
                 </div>
             </div>
          </main>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 right-0 left-0 lg:left-[320px] bg-white border-t border-slate-200 px-4 md:px-8 py-3 lg:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] lg:shadow-none">
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setAnswers(prev => { const next = { ...prev }; delete next[currentQ.id]; return next; })}
                className="flex-1 sm:flex-none text-xs md:text-sm font-bold text-[#065f46] border border-[#065f46] px-3 md:px-6 py-2.5 min-h-[44px] rounded hover:bg-emerald-50 transition-colors text-center whitespace-nowrap"
              >
                 Clear Response
              </button>
              <button 
                onClick={toggleMarkForReview}
                className="flex-1 sm:flex-none text-xs md:text-sm font-bold text-orange-500 border border-orange-500 px-3 md:px-6 py-2.5 min-h-[44px] rounded hover:bg-orange-50 transition-colors flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
              >
                 <Bookmark className="w-3 h-3 md:w-4 md:h-4 fill-transparent" /> Mark for Review <span className="hidden sm:inline">& Next</span>
              </button>
           </div>
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                 onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                 disabled={currentIdx === 0}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs md:text-sm font-bold text-slate-700 border border-slate-300 px-3 md:px-6 py-2.5 min-h-[44px] rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                 <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button 
                 onClick={handleNext}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs md:text-sm font-bold text-white bg-[#065f46] px-4 md:px-8 py-2.5 min-h-[44px] rounded hover:bg-[#044e3a] transition-colors"
              >
                 Save & Next <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      {/* Warning Bar */}
      {timeLeft < 120 && (
        <div className="bg-[#E74C3C] text-white text-center py-1.5 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 absolute top-0 left-0 w-full z-[60]">
          <AlertTriangle className="w-4 h-4" /> Hurry up! {formatTime(timeLeft)} remaining
        </div>
      )}
    </div>
  );
}
