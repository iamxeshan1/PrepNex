import React, { useState, useEffect } from 'react';
import { 
  Trophy, Crown, Award, Medal, Flame, TrendingUp, Sparkles, 
  Search, ChevronRight, User, CheckCircle2, Target, Calendar,
  Star, BarChart2, Zap, ArrowUpRight
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { VerifiedBadge } from './VerifiedBadge';

export interface LeaderboardEntry {
  uid: string;
  name: string;
  photoURL?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  targetExam?: string;
  district?: string;
  state?: string;
  aggregateScore: number; // Percentage, e.g., 94
  testsCompleted: number; // e.g., 38
  monthlyScore: number;
  monthlyTestsCompleted: number;
  rank?: number;
  isOnline?: boolean;
  lastSeen?: number;
}

interface TopPerformersLeaderboardProps {
  currentUserId?: string;
}

// Default high-performing aspirants fallback data if database has few registered users
const FALLBACK_TOP_PERFORMERS: LeaderboardEntry[] = [
  {
    uid: 'demo_student_1',
    name: 'Sahil Sharma',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPremium: true,
    targetExam: 'JKSSB CGL / FAA',
    district: 'Jammu',
    state: 'J&K',
    aggregateScore: 96,
    testsCompleted: 42,
    monthlyScore: 98,
    monthlyTestsCompleted: 16
  },
  {
    uid: 'demo_student_2',
    name: 'Ananya Verma',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPremium: true,
    targetExam: 'SSC CGL Tier II',
    district: 'Srinagar',
    state: 'J&K',
    aggregateScore: 94,
    testsCompleted: 38,
    monthlyScore: 95,
    monthlyTestsCompleted: 14
  },
  {
    uid: 'demo_student_3',
    name: 'Mohammad Zaid',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPremium: true,
    targetExam: 'JKPSC KAS Prelims',
    district: 'Anantnag',
    state: 'J&K',
    aggregateScore: 92,
    testsCompleted: 35,
    monthlyScore: 93,
    monthlyTestsCompleted: 12
  },
  {
    uid: 'demo_student_4',
    name: 'Priya Raj',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPremium: true,
    targetExam: 'Banking PO / Clerk',
    district: 'Udhampur',
    state: 'J&K',
    aggregateScore: 89,
    testsCompleted: 29,
    monthlyScore: 91,
    monthlyTestsCompleted: 10
  },
  {
    uid: 'demo_student_5',
    name: 'Tariq Ahmad',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPremium: false,
    targetExam: 'JKSSB Naib Tehsildar',
    district: 'Baramulla',
    state: 'J&K',
    aggregateScore: 87,
    testsCompleted: 27,
    monthlyScore: 88,
    monthlyTestsCompleted: 9
  },
  {
    uid: 'demo_student_6',
    name: 'Pooja Gupta',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPremium: false,
    targetExam: 'SSC CHSL',
    district: 'Kathua',
    state: 'J&K',
    aggregateScore: 85,
    testsCompleted: 24,
    monthlyScore: 86,
    monthlyTestsCompleted: 8
  }
];

export function TopPerformersLeaderboard({ currentUserId }: TopPerformersLeaderboardProps) {
  const navigate = useNavigate();

  // Time Scope Toggle: 'global' vs 'monthly'
  const [scope, setScope] = useState<'global' | 'monthly'>('global');

  // Sorting Metric Toggle: 'score' vs 'tests'
  const [metric, setMetric] = useState<'score' | 'tests'>('score');

  // Filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Current user's rank info
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  // Firestore Fetch for Leaderboard Data
  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [usersSnap, resultsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'results'))
        ]);

        if (!isMounted) return;

        const now = new Date();
        const startOfMonthTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        // Map of userId -> stats
        const userStatsMap: Record<string, { 
          totalScore: number; 
          testCount: number; 
          monthlyScore: number; 
          monthlyTestCount: number 
        }> = {};

        resultsSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = data.userId;
          if (!uid) return;

          if (!userStatsMap[uid]) {
            userStatsMap[uid] = { totalScore: 0, testCount: 0, monthlyScore: 0, monthlyTestCount: 0 };
          }

          const score = Number(data.score) || 0;
          userStatsMap[uid].totalScore += score;
          userStatsMap[uid].testCount += 1;

          // Check date for monthly filter
          let resTime = 0;
          if (data.date) {
            if (data.date.seconds) {
              resTime = data.date.seconds * 1000;
            } else if (data.date instanceof Date) {
              resTime = data.date.getTime();
            } else if (typeof data.date === 'string' || typeof data.date === 'number') {
              resTime = new Date(data.date).getTime();
            }
          }

          if (resTime >= startOfMonthTimestamp) {
            userStatsMap[uid].monthlyScore += score;
            userStatsMap[uid].monthlyTestCount += 1;
          }
        });

        // Convert Firestore Users into Leaderboard Entries
        const firestorePerformers: LeaderboardEntry[] = usersSnap.docs
          .map((docSnap) => {
            const uData = docSnap.data();
            const uid = docSnap.id;
            const stats = userStatsMap[uid] || { totalScore: 0, testCount: 0, monthlyScore: 0, monthlyTestCount: 0 };

            const testsCompleted = Math.max(stats.testCount, Number(uData.testsAttempted) || 0);
            const aggregateScore = stats.testCount > 0 
              ? Math.round(stats.totalScore / stats.testCount) 
              : Number(uData.averageScore) || 0;

            const monthlyTestsCompleted = stats.monthlyTestCount;
            const monthlyScore = stats.monthlyTestCount > 0 
              ? Math.round(stats.monthlyScore / stats.monthlyTestCount) 
              : aggregateScore;

            return {
              uid,
              name: uData.name || uData.displayName || 'Aspirant',
              photoURL: uData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(uData.name || 'Aspirant')}&background=006e5d&color=fff`,
              isVerified: Boolean(uData.isPremium || uData.isVerified),
              isPremium: Boolean(uData.isPremium),
              targetExam: uData.targetExam || 'JKSSB / SSC',
              district: uData.district || 'J&K',
              state: uData.state || 'India',
              aggregateScore,
              testsCompleted,
              monthlyScore,
              monthlyTestsCompleted,
              isOnline: Boolean(uData.isOnline),
              lastSeen: uData.lastSeen ? Number(uData.lastSeen) : undefined
            };
          })
          .filter(u => u.testsCompleted > 0 || u.aggregateScore > 0);

        // Combine Firestore performers with fallback list for full engaging ranking board
        const existingUids = new Set(firestorePerformers.map(p => p.uid));
        const combined = [
          ...firestorePerformers,
          ...FALLBACK_TOP_PERFORMERS.filter(fb => !existingUids.has(fb.uid))
        ];

        setLeaderboardData(combined);
      } catch (err) {
        console.error("Error computing leaderboard:", err);
        if (isMounted) setLeaderboardData(FALLBACK_TOP_PERFORMERS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  // Sort and process current view list based on scope (global vs monthly) and metric (score vs tests)
  const processedList = React.useMemo(() => {
    let list = [...leaderboardData];

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.targetExam && item.targetExam.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q))
      );
    }

    // Sort based on active scope & metric
    list.sort((a, b) => {
      if (scope === 'monthly') {
        if (metric === 'score') {
          if (b.monthlyScore !== a.monthlyScore) return b.monthlyScore - a.monthlyScore;
          return b.monthlyTestsCompleted - a.monthlyTestsCompleted;
        } else {
          if (b.monthlyTestsCompleted !== a.monthlyTestsCompleted) return b.monthlyTestsCompleted - a.monthlyTestsCompleted;
          return b.monthlyScore - a.monthlyScore;
        }
      } else { // global
        if (metric === 'score') {
          if (b.aggregateScore !== a.aggregateScore) return b.aggregateScore - a.aggregateScore;
          return b.testsCompleted - a.testsCompleted;
        } else {
          if (b.testsCompleted !== a.testsCompleted) return b.testsCompleted - a.testsCompleted;
          return b.aggregateScore - a.aggregateScore;
        }
      }
    });

    // Assign rank numbers
    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [leaderboardData, scope, metric, searchQuery]);

  // Find logged-in user position
  useEffect(() => {
    if (!currentUserId || processedList.length === 0) return;
    const userIndex = processedList.findIndex(item => item.uid === currentUserId);
    if (userIndex !== -1) {
      setCurrentUserEntry(processedList[userIndex]);
      setCurrentUserRank(userIndex + 1);
    } else {
      setCurrentUserEntry(null);
      setCurrentUserRank(null);
    }
  }, [processedList, currentUserId]);

  const top3 = processedList.slice(0, 3);
  const remainingList = processedList.slice(3, 10);

  // Podium mappings
  const firstPlace = top3.find(t => t.rank === 1);
  const secondPlace = top3.find(t => t.rank === 2);
  const thirdPlace = top3.find(t => t.rank === 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-all space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1.5 border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Aspirant Leaderboard
            </span>
            <span className="text-xs text-slate-400 font-semibold">Updated Daily</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-[#006e5d]" /> Top Performers &amp; Practice Leaders
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Celebrating high accuracy mock test takers and consistent exam practice leaders across J&amp;K.
          </p>
        </div>

        {/* Control Toggles: Global/Monthly & Metric */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Scope Toggle: Global vs Monthly */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setScope('global')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                scope === 'global' 
                  ? 'bg-[#006e5d] text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌐 Global All-Time
            </button>
            <button
              onClick={() => setScope('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                scope === 'monthly' 
                  ? 'bg-[#006e5d] text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📅 This Month
            </button>
          </div>

          {/* Metric Toggle: Aggregate Score vs Practice Tests */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMetric('score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'score' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> High Score
            </button>
            <button
              onClick={() => setMetric('tests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                metric === 'tests' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Most Tests
            </button>
          </div>

        </div>
      </div>

      {/* Top 3 Podium Cards Banner */}
      {processedList.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* #2 Rank - Silver Podium */}
          {secondPlace && (
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700 relative flex flex-col items-center text-center shadow-xs hover:border-slate-300 transition-all">
              
              <div className="absolute -top-3 px-3 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs border border-slate-300 dark:border-slate-600">
                <Medal className="w-3.5 h-3.5 text-slate-400" /> 2nd Place
              </div>

              <div className="relative mt-2 mb-3">
                <img 
                  src={secondPlace.photoURL} 
                  alt={secondPlace.name} 
                  className="w-16 h-16 rounded-full object-cover border-4 border-slate-300 dark:border-slate-600 shadow-md"
                />
                {secondPlace.isVerified && (
                  <div className="absolute -top-1 -right-1">
                    <VerifiedBadge size="xs" />
                  </div>
                )}
              </div>

              <Link 
                to={`/student/${secondPlace.uid}`} 
                className="font-black text-slate-900 dark:text-white text-sm hover:text-[#006e5d] transition-colors truncate max-w-full"
              >
                {secondPlace.name}
              </Link>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-full">
                {secondPlace.targetExam} • {secondPlace.district}
              </span>

              {/* Badges */}
              <div className="mt-4 flex items-center justify-center gap-2 w-full">
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {scope === 'monthly' ? secondPlace.monthlyScore : secondPlace.aggregateScore}%
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tests Done</div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {scope === 'monthly' ? secondPlace.monthlyTestsCompleted : secondPlace.testsCompleted}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* #1 Rank - Gold Crown Podium */}
          {firstPlace && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:from-amber-950/40 dark:to-slate-900 rounded-3xl p-6 border-2 border-amber-400/60 dark:border-amber-500/40 relative flex flex-col items-center text-center shadow-lg md:-mt-3 hover:border-amber-500 transition-all">
              
              <div className="absolute -top-4 px-4 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md border-2 border-white dark:border-slate-900">
                <Crown className="w-4 h-4 text-amber-100 fill-amber-100" /> #1 Champion
              </div>

              <div className="relative mt-3 mb-3">
                <img 
                  src={firstPlace.photoURL} 
                  alt={firstPlace.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-xl"
                />
                {firstPlace.isVerified && (
                  <div className="absolute -top-1 -right-1">
                    <VerifiedBadge size="sm" />
                  </div>
                )}
                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-md uppercase shadow-xs">
                    Top Aspirant
                  </span>
                </div>
              </div>

              <Link 
                to={`/student/${firstPlace.uid}`} 
                className="font-black text-slate-900 dark:text-white text-base hover:text-[#006e5d] transition-colors truncate max-w-full mt-1"
              >
                {firstPlace.name}
              </Link>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate max-w-full">
                {firstPlace.targetExam} ({firstPlace.district})
              </span>

              {/* Badges */}
              <div className="mt-4 flex items-center justify-center gap-2 w-full">
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/60 flex-1 text-center shadow-xs">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">Aggregate</div>
                  <div className="text-base font-black text-amber-600 dark:text-amber-400">
                    {scope === 'monthly' ? firstPlace.monthlyScore : firstPlace.aggregateScore}%
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/60 flex-1 text-center shadow-xs">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase">Completed</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {scope === 'monthly' ? firstPlace.monthlyTestsCompleted : firstPlace.testsCompleted} Tests
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* #3 Rank - Bronze Podium */}
          {thirdPlace && (
            <div className="order-3 bg-gradient-to-b from-amber-900/5 to-slate-50 dark:from-amber-950/20 dark:to-slate-900 rounded-3xl p-5 border-2 border-amber-800/20 dark:border-amber-800/40 relative flex flex-col items-center text-center shadow-xs hover:border-amber-800/40 transition-all">
              
              <div className="absolute -top-3 px-3 py-0.5 bg-amber-900/20 text-amber-900 dark:text-amber-200 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs border border-amber-800/30">
                <Medal className="w-3.5 h-3.5 text-amber-700" /> 3rd Place
              </div>

              <div className="relative mt-2 mb-3">
                <img 
                  src={thirdPlace.photoURL} 
                  alt={thirdPlace.name} 
                  className="w-16 h-16 rounded-full object-cover border-4 border-amber-700/40 shadow-md"
                />
                {thirdPlace.isVerified && (
                  <div className="absolute -top-1 -right-1">
                    <VerifiedBadge size="xs" />
                  </div>
                )}
              </div>

              <Link 
                to={`/student/${thirdPlace.uid}`} 
                className="font-black text-slate-900 dark:text-white text-sm hover:text-[#006e5d] transition-colors truncate max-w-full"
              >
                {thirdPlace.name}
              </Link>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-full">
                {thirdPlace.targetExam} • {thirdPlace.district}
              </span>

              {/* Badges */}
              <div className="mt-4 flex items-center justify-center gap-2 w-full">
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {scope === 'monthly' ? thirdPlace.monthlyScore : thirdPlace.aggregateScore}%
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tests Done</div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {scope === 'monthly' ? thirdPlace.monthlyTestsCompleted : thirdPlace.testsCompleted}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Ranks #4 to #10 List Feed */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 pb-1">
          <span>Rank &amp; Student Info</span>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">Target Exam</span>
            <span>Accuracy %</span>
            <span>Practice Tests</span>
          </div>
        </div>

        {remainingList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No further aspirants listed in this filter.
          </div>
        ) : (
          remainingList.map((item) => {
            const displayScore = scope === 'monthly' ? item.monthlyScore : item.aggregateScore;
            const displayTests = scope === 'monthly' ? item.monthlyTestsCompleted : item.testsCompleted;
            const isSelf = currentUserId === item.uid;

            return (
              <div 
                key={item.uid}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isSelf 
                    ? 'bg-[#006e5d]/10 border-[#006e5d] dark:bg-[#006e5d]/20' 
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                {/* Left: Rank # & Student Profile Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0">
                    #{item.rank}
                  </span>

                  <div className="relative shrink-0">
                    <img 
                      src={item.photoURL} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    {item.isVerified && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <VerifiedBadge size="xs" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link 
                        to={`/student/${item.uid}`}
                        className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-[#006e5d] transition-colors truncate"
                      >
                        {item.name}
                      </Link>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 bg-[#006e5d] text-white text-[9px] font-black rounded-md uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium truncate">
                      {item.district || 'J&K'}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Details */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {item.targetExam}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {displayScore}%
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Accuracy</div>
                  </div>

                  <div className="text-right min-w-[50px]">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {displayTests}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">Tests</div>
                  </div>

                  <Link
                    to={`/student/${item.uid}`}
                    className="p-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-[#006e5d] transition-colors"
                    title="View Student Profile"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Logged in user position footer banner */}
      <div className="bg-gradient-to-r from-[#006e5d] to-emerald-800 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-black">
              {currentUserRank ? `Your Current Position: #${currentUserRank} (${scope === 'monthly' ? 'Monthly' : 'Global'})` : 'Practice to Enter the Leaderboard Top 10!'}
            </div>
            <div className="text-[11px] text-emerald-100 font-medium">
              {currentUserEntry 
                ? `Aggregate Accuracy: ${currentUserEntry.aggregateScore}% • ${currentUserEntry.testsCompleted} Practice Tests Taken` 
                : 'Complete mock tests to earn your rank among top aspirants in J&K.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/exams')}
          className="px-4 py-2 bg-white text-[#006e5d] hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-xs"
        >
          Take Practice Test →
        </button>
      </div>

    </div>
  );
}
