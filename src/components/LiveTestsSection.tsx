import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Calendar, Clock, Users, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LiveTestsSection() {
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({});
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveTests = async () => {
      try {
        const q = query(collection(db, 'liveTests'), orderBy('startTime', 'asc'));
        const sn = await getDocs(q);
        const tests = sn.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter out completely ended tests (maybe keep them if we want to show past, but usually upcoming/active)
        const now = new Date().getTime();
        const activeOrUpcoming = tests.filter((t: any) => new Date(t.endTime).getTime() > now);
        
        setLiveTests(activeOrUpcoming);
      } catch (err) {
        console.error("Failed to fetch live tests", err);
      }
      setLoading(false);
    };
    fetchLiveTests();
  }, []);

  const handleEnroll = async (testId: string, isFree: boolean, price: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isFree) {
      alert(`To enroll in this paid test (₹${price}), payment gateway integration is needed.`);
      // Mocking enrollment for now
    }

    setEnrollingMap(prev => ({ ...prev, [testId]: true }));
    try {
      await updateDoc(doc(db, 'liveTests', testId), {
        enrolledUsers: arrayUnion(user.uid)
      });
      alert('Successfully enrolled in the Live Test!');
      setLiveTests(prev => prev.map(t => {
        if (t.id === testId) {
          return { ...t, enrolledUsers: [...(t.enrolledUsers || []), user.uid] };
        }
        return t;
      }));
    } catch (error) {
      alert('Enrollment failed.');
    }
    setEnrollingMap(prev => ({ ...prev, [testId]: false }));
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Now
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-secondary tracking-tight mb-4">
            Upcoming Live Tests
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Test your preparation among thousands of aspirants in real-time. Secure your rank.
          </p>
        </div>

        {liveTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveTests.map(test => {
              const now = new Date().getTime();
              const enrollStart = new Date(test.enrollmentStartTime).getTime();
              const enrollEnd = test.enrollmentEndTime ? new Date(test.enrollmentEndTime).getTime() : new Date(test.startTime).getTime();
              const testStart = new Date(test.startTime).getTime();
              const testEnd = new Date(test.endTime).getTime();

              const isEnrolling = now >= enrollStart && now <= enrollEnd;
              const isTestActive = now >= testStart && now <= testEnd;
              const upcomingEnrollment = now < enrollStart;
              
              const isEnrolled = test.enrolledUsers?.includes(user?.uid);

              return (
                <div key={test.id} className="relative group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-6 h-6" />
                      </div>
                      {test.isFree ? (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-widest">Free</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-black uppercase tracking-widest">₹{test.price}</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-secondary mb-2 leading-tight">{test.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6">{test.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(test.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{test.duration} mins • {test.totalMarks} Marks</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{test.enrolledUsers?.length || 0} Enrolled</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    {isEnrolled ? (
                      isTestActive ? (
                        <button 
                          onClick={() => navigate(`/test/${test.id}`)}
                          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                         Start Live Test
                        </button>
                      ) : (
                        <button disabled className="w-full py-4 bg-white border-2 border-green-500 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                          <CheckCircle className="w-5 h-5" /> Enrolled successfully
                        </button>
                      )
                    ) : (
                      isEnrolling ? (
                        test.isFree ? (
                          <button 
                            onClick={() => handleEnroll(test.id, test.isFree, test.price)}
                            disabled={enrollingMap[test.id]}
                            className="w-full py-4 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all font-logo flex items-center justify-center gap-2"
                          >
                            {enrollingMap[test.id] ? 'Processing...' : 'Enroll Now'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate(`/live-test/${test.id}`)}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all font-logo flex items-center justify-center gap-2"
                          >
                            Enroll Now
                          </button>
                        )
                      ) : upcomingEnrollment ? (
                        <button disabled className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed text-sm">
                          Enrollment starts {new Date(test.enrollmentStartTime).toLocaleDateString()}
                        </button>
                      ) : (
                        <button disabled className="w-full py-4 bg-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed">
                          Enrollment Closed
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
    </section>
  );
}
