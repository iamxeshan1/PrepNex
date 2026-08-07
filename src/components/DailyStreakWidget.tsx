import React from 'react';
import { Flame, Zap, CheckCircle2, ArrowRight, Award, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyStreakWidgetProps {
  streakCount?: number;
  lastActiveDate?: string;
  onTakeQuiz?: () => void;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({
  streakCount = 14,
  onTakeQuiz
}) => {
  const navigate = useNavigate();
  const count = Math.max(1, streakCount);

  // Generate day abbreviations for current week (M, T, W, T, F, S, S)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0-indexed Mon-Sun

  // Simulate active streak days for current week (last N days active)
  const activeDaysMap = days.map((_, index) => {
    if (index < todayIndex) return true; // Past days in current week completed
    if (index === todayIndex) return true; // Today active
    return false; // Future days
  });

  const handleAction = () => {
    if (onTakeQuiz) {
      onTakeQuiz();
    } else {
      navigate('/exams');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#002f26] text-white p-6 md:p-7 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
      {/* Background Flame Glow Effect */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-5">
        {/* Streak Number & Label */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30 border border-amber-300/30">
            <Flame className="w-8 h-8 text-amber-100 fill-amber-100 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">{count} Days</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-orange-400 text-orange-400" /> On Fire!
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Daily Quiz & Practice Streak
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAction}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <span>Take Today's Quiz</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekly Tracker Row */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {days.map((dayLabel, idx) => {
            const isActive = activeDaysMap[idx];
            const isToday = idx === todayIndex;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full max-w-[36px] h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/30'
                      : isToday
                      ? 'bg-slate-800 text-amber-400 border-2 border-dashed border-amber-500/60 animate-pulse'
                      : 'bg-slate-800/60 text-slate-500 border border-slate-700/50'
                  }`}
                  title={`${dayLabel} - ${isActive ? 'Completed' : isToday ? 'Quiz Due Today' : 'Upcoming'}`}
                >
                  {isActive ? (
                    <Flame className="w-4 h-4 fill-amber-200 text-amber-100" />
                  ) : (
                    <span className="text-xs font-bold">{dayLabel}</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isToday ? 'text-amber-400 font-black' : 'text-slate-400'}`}>
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs font-bold text-amber-300/90 shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Next Milestone: 30 Days</span>
        </div>
      </div>
    </div>
  );
};
