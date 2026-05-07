import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Calendar, Clock, Users, Zap, CheckCircle, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Countdown } from './Countdown';
import CheckoutModal from './CheckoutModal';

export default function LiveTestsSection() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({});
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveTests = async () => {
      try {
        const now = new Date().getTime();
        
        // Fetch from legacy liveTests
        const qLive = query(collection(db, 'liveTests'), orderBy('startTime', 'asc'));
        const snLive = await getDocs(qLive);
        const testsLive = snLive.docs.map(d => ({ id: d.id, ...d.data(), isLegacyLive: true }));
        
        // Fetch from new scheduled tests
        const qScheduled = query(collection(db, 'tests'), where('status', '==', 'scheduled'), orderBy('scheduledStartTime', 'asc'));
        const snSched = await getDocs(qScheduled);
        const testsSched = snSched.docs.map(d => ({ id: d.id, ...d.data(), isScheduled: true }));

        const allTests = [...testsLive, ...testsSched];
        
        // Filter out completely ended tests
        const activeOrUpcoming = allTests.filter((t: any) => {
          const endTime = t.endTime || (t.scheduledStartTime ? new Date(new Date(t.scheduledStartTime).getTime() + (t.duration || 60) * 60000).toISOString() : null);
          if (!endTime) return true;
          return new Date(endTime).getTime() > now;
        });
        
        setLiveTests(activeOrUpcoming);
      } catch (err) {
        console.error("Failed to fetch live tests", err);
      }
      setLoading(false);
    };
    fetchLiveTests();
  }, []);

  const handleEnroll = async (testId: string, isFree: boolean, price: number, collectionName: string = 'liveTests') => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isFree) {
      setSelectedTest({
        id: testId,
        name: liveTests.find(t => t.id === testId)?.title || "Live Test",
        price: price
      });
      setIsCheckoutOpen(true);
      return;
    }

    setEnrollingMap(prev => ({ ...prev, [testId]: true }));
    try {
      await updateDoc(doc(db, collectionName, testId), {
        enrolledUsers: arrayUnion(user.uid)
      });
      alert('Successfully enrolled in the Live Test!');
      navigate('/dashboard');
    } catch (error) {
      alert('Enrollment failed.');
      setEnrollingMap(prev => ({ ...prev, [testId]: false }));
    }
  };

  if (loading) return (
    <section className="py-24 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="h-64 bg-slate-50 rounded-[3rem] animate-pulse" />
      </div>
    </section>
  );

  return (
    <section className="py-24 bg-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-red-100">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live & Upcoming
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">
            Live Competitive <span className="text-secondary">Mocks</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Join the battle in real-time. Scheduled tests for serious contenders.
          </p>
        </div>

        {liveTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveTests.map(test => {
              const now = new Date().getTime();
              const startTimeValue = test.startTime || test.scheduledStartTime;
              const endTimeValue = test.endTime || (test.scheduledStartTime ? new Date(new Date(test.scheduledStartTime).getTime() + (test.duration || 60) * 60000).toISOString() : null);
              
              const enrollStart = test.enrollmentStartTime ? new Date(test.enrollmentStartTime).getTime() : (new Date(startTimeValue).getTime() - 7 * 24 * 3600000); // 7 days before if not set
              const enrollEnd = test.enrollmentEndTime ? new Date(test.enrollmentEndTime).getTime() : new Date(startTimeValue).getTime();
              
              const testStart = new Date(startTimeValue).getTime();
              const testEnd = endTimeValue ? new Date(endTimeValue).getTime() : (testStart + (test.duration || 60) * 60000);

              const isEnrolling = now >= enrollStart && now <= enrollEnd;
              const isTestActive = now >= testStart && now <= testEnd;
              const upcomingEnrollment = now < enrollStart;
              const waitingForStart = now > enrollEnd && now < testStart;
              
              const isEnrolled = test.enrolledUsers?.includes(user?.uid);
              const collectionName = test.isScheduled ? 'tests' : 'liveTests';

              return (
                <div key={test.id} className="relative group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-secondary/20 transition-all duration-300 overflow-hidden flex flex-col">
                  {isTestActive && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                      </div>
                    </div>
                  )}
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 ${isTestActive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Zap className="w-6 h-6" />
                      </div>
                      {test.isFree ? (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">Free</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">₹{test.price}</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-primary mb-2 leading-tight group-hover:text-secondary transition-colors">{test.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{test.isScheduled ? 'General Live Test' : 'Special Exam Mock'}</p>
                    
                    {!isTestActive && now < testStart && (
                      <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                         <div className="flex items-center gap-2 mb-3">
                           <Timer className="w-3.5 h-3.5 text-primary" />
                           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Starting In</span>
                         </div>
                         <Countdown targetDate={startTimeValue} />
                      </div>
                    )}
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(startTimeValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{new Date(startTimeValue).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {test.duration}m</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{test.enrolledUsers?.length || 0} Aspirants Enrolled</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 border-t border-slate-100">
                    {isEnrolled ? (
                      isTestActive ? (
                        <button 
                          onClick={() => navigate(`/test/${test.id}`)}
                          className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                         Enter Live Hall
                        </button>
                      ) : now < testStart ? (
                        <div className="flex flex-col gap-2">
                           <button disabled className="w-full py-4 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                             <CheckCircle className="w-4 h-4" /> Participation Confirmed
                           </button>
                           {waitingForStart && (
                              <p className="text-[8px] font-black text-blue-600 text-center uppercase tracking-widest animate-pulse">Wait in Lobby for Start Time</p>
                           )}
                        </div>
                      ) : (
                        <button disabled className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">
                          Test Ended
                        </button>
                      )
                    ) : (
                      isEnrolling ? (
                        <button 
                          onClick={() => handleEnroll(test.id, test.isFree, test.price, collectionName)}
                          disabled={enrollingMap[test.id]}
                          className="w-full py-4 bg-secondary text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                        >
                          {enrollingMap[test.id] ? 'Registering...' : 'Enroll Now'}
                        </button>
                      ) : upcomingEnrollment ? (
                        <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                          Enrollment Opens: {new Date(enrollStart).toLocaleDateString()}
                        </button>
                      ) : (
                        <button disabled className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">
                          Registration Closed
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center group hover:border-primary/30 transition-colors">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm mx-auto mb-8 text-primary/20 group-hover:text-primary/40 transition-colors">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-primary mb-3">No Active Live Tests</h3>
              <p className="text-slate-500 font-medium max-w-md mx-auto">
                We're setting up the next big challenge for you. Stay tuned for J&K's most competitive live mock tests.
              </p>
              <div className="mt-10 inline-flex items-center gap-3 text-xs font-black text-primary uppercase tracking-widest bg-white px-6 py-3 rounded-full shadow-sm">
                <Users className="w-4 h-4" /> Join 10k+ Waiting Aspirants
              </div>
            </div>
          </div>
        )}
      </div>
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        item={selectedTest || { id: '', name: '', price: 0 }}
        onSuccess={() => {
          alert('Successfully enrolled in the Live Test!');
          navigate('/dashboard');
        }}
      />
    </section>
  );
}
