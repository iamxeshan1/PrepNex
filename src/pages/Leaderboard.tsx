import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '../components/Layout';
import { TopPerformersLeaderboard } from '../components/TopPerformersLeaderboard';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Flame, Users, Sparkles } from 'lucide-react';

export default function Leaderboard() {
  const { profile, user } = useAuth();
  const currentUserId = profile?.userId || profile?.uid || user?.uid;

  return (
    <Layout>
      <Helmet>
        <title>Aspirant Leaderboard | PrepNext</title>
        <meta name="description" content="View top ranking aspirants across J&K and India. Compete, compare scorecard ranks, and track monthly exam progress on PrepNext." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-28">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#006e5d] via-[#005a4d] to-[#023830] text-white pt-10 pb-16 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          <div className="max-w-6xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wide mb-4">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Real-Time State & All-India Rankings</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
              Aspirant Leaderboard & Ranks
            </h1>
            
            <p className="text-slate-200 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              Track top performers, measure your aggregate accuracy score against thousands of serious aspirants, and climb the monthly ranks!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto mt-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <Trophy className="w-4 h-4" /> Top Scorers
                </div>
                <div className="text-lg font-black text-white">Live Updates</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-bold mb-1">
                  <Flame className="w-4 h-4" /> Monthly Ranks
                </div>
                <div className="text-lg font-black text-white">Monthly Reset</div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-cyan-300 text-xs font-bold mb-1">
                  <Award className="w-4 h-4" /> Pass Pro Badges
                </div>
                <div className="text-lg font-black text-white">Verified Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Leaderboard Widget Container */}
        <div className="max-w-6xl mx-auto px-3 sm:px-6 -mt-8 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 sm:p-6 md:p-8">
            <TopPerformersLeaderboard currentUserId={currentUserId} showAll={true} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
