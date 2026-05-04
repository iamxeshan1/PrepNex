import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsByTestId, saveResult, getResultsByTestId } from '../services/db';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Logo } from '../components/Logo';
import { Clock, ChevronRight, ChevronLeft, Send, AlertTriangle, Menu, Bookmark, HelpCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

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

  const handleSubmit = async () => {
    if (submitting) return;
    
    // Final check to prevent duplicate clicks if button wasn't disabled fast enough
    if (window.confirm && !window.confirm('Are you sure you want to submit your answers?')) {
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

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col font-sans">
      {/* Header - Refined to match image */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (window.confirm('Do you want to exit the test? Your progress will not be saved.')) {
                navigate(-1);
              }
            }}
            className="p-2 -ml-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Exit Test"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <Logo className="text-xl" />
            <span className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1 max-w-[150px]">{test.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attempt</span>
            <span className="text-sm font-black text-[#002D62]">#{attemptNumber}</span>
          </div>
          <div className="bg-[#F0F4FF] border border-[#002D62]/10 rounded-full px-5 py-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#002D62]" />
            <span className="font-mono text-xl font-black text-[#002D62]">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <button 
          onClick={() => { if(window.confirm('Finish and submit now?')) handleSubmit(); }}
          className="bg-[#002D62] text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 hover:bg-[#003B7F] transition-all"
        >
          Submit
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Progress</p>
                <h2 className="text-2xl font-black text-[#002D62] tracking-tight">Question {currentIdx + 1} of {questions.length}</h2>
              </div>
              <div className="text-xl font-black text-[#002D62]">{percentage}%</div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className="h-full bg-[#0052CC] rounded-full"
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative min-h-[400px]">
            {submitting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-3xl">
                <div className="w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-bold text-[#0052CC]">Evaluating responses...</p>
              </div>
            )}

            <div className="flex gap-4 mb-8">
              <div className="w-10 h-10 bg-[#002D62] text-white rounded-lg flex items-center justify-center font-black shrink-0">
                {currentIdx + 1}
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug">
                  {currentQ.question}
                </h3>
                {currentQ.previouslyAskedIn && (
                  <span className="self-start px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-200">
                    Asked in: {currentQ.previouslyAskedIn}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {currentQ.options.map((option: string, idx: number) => {
                const alphabet = ['A', 'B', 'C', 'D'][idx];
                const isSelected = answers[currentQ.id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: option }))}
                    className={`w-full p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                      isSelected 
                        ? 'border-[#002D62] bg-white shadow-md' 
                        : 'border-slate-100 bg-[#FBFBFF] hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#002D62]' : 'border-slate-300'}`}>
                      {isSelected && <div className="w-3.5 h-3.5 bg-[#002D62] rounded-full" />}
                    </div>
                    <span className={`text-base font-bold ${isSelected ? 'text-[#002D62]' : 'text-slate-500'}`}>
                      <span className="mr-2">{alphabet}.</span> {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            
            <button
              onClick={toggleMarkForReview}
              className={`w-full sm:flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${
                markedForReview.has(currentQ.id) 
                ? 'bg-[#E7E2FF] border-[#6C5CE7] text-[#6C5CE7]' 
                : 'bg-white border-slate-100 text-slate-600'
              }`}
            >
              Mark for Review
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === questions.length - 1}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-4 bg-[#1B61AD] text-white rounded-2xl font-bold shadow-lg shadow-[#1B61AD]/20 hover:bg-[#154D8C] transition-all disabled:opacity-30"
            >
              Save & Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer inside main column for better Flow on mobile, but simple enough for desktop */}
          <footer className="pt-12 pb-12 text-center border-t border-slate-100 flex flex-col items-center">
            <Logo className="text-xl mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">©2026 PrepNext Edtech. All rights reserved.</p>
            <div className="flex justify-center gap-6">
              <Link to="/privacy" className="text-xs font-bold text-slate-400 hover:text-[#002D62] transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-xs font-bold text-slate-400 hover:text-[#002D62] transition-colors">Terms of Service</Link>
              <Link to="/contact" className="text-xs font-bold text-slate-400 hover:text-[#002D62] transition-colors">Contact</Link>
            </div>
          </footer>
        </div>

        {/* Sidebar Column */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Question Palette */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-black text-slate-700 uppercase tracking-tight">Question Palette</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, i) => {
                const isCurrent = currentIdx === i;
                const hasAnswered = !!answers[q.id];
                const isMarked = markedForReview.has(q.id);
                const isVisited = visited.has(q.id);

                let bgColor = 'bg-[#F0F4FF] text-slate-400';
                let borderColor = 'border-transparent';

                if (hasAnswered && isMarked) {
                  bgColor = 'bg-[#A29BFE] text-white'; // Purple for marked
                  borderColor = 'border-transparent';
                } else if (hasAnswered) {
                  bgColor = 'bg-[#2ECC71] text-white';
                  borderColor = 'border-[#2ECC71]';
                } else if (isMarked) {
                  bgColor = 'bg-[#A29BFE] text-white';
                  borderColor = 'border-[#A29BFE]';
                } else if (isVisited && !isCurrent) {
                  bgColor = 'bg-white text-slate-600';
                  borderColor = 'border-slate-100';
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIdx(i);
                      setVisited(prev => new Set(prev).add(questions[i].id));
                    }}
                    className={`aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center border-2 relative ${
                      isCurrent ? 'border-[#002D62] bg-white text-[#002D62] ring-2 ring-[#002D62]/10 scale-105' : borderColor
                    } ${bgColor}`}
                  >
                    {i + 1}
                    {hasAnswered && isMarked && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#2ECC71] rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 mt-8 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Answered</span>
                </div>
                <span className="text-xs font-black text-slate-600">{Object.keys(answers).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F0F4FF]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Not Visited</span>
                </div>
                <span className="text-xs font-black text-slate-600">{questions.length - visited.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#A29BFE]" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Marked</span>
                </div>
                <span className="text-xs font-black text-slate-600">{markedForReview.size}</span>
              </div>
            </div>
          </div>

          {/* Need Help Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#001D42] to-[#003B7F] rounded-3xl p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1 tracking-tight">Need help?</h3>
              <p className="text-[11px] text-blue-100/70 mb-4 font-medium leading-relaxed">Check out our specialized study material for this section.</p>
              <button className="w-full bg-white text-[#002D62] py-2 rounded-xl font-bold text-xs hover:bg-white/90 transition-all">
                View Notes
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Warning Bar */}
      {timeLeft < 120 && (
        <div className="bg-[#E74C3C] text-white text-center py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 sticky bottom-0 z-40">
          <AlertTriangle className="w-4 h-4" /> Hurry up! {formatTime(timeLeft)} remaining
        </div>
      )}
    </div>
  );
}
