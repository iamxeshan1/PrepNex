import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, CheckCircle2, GripVertical, Bell, 
  Sparkles, BookOpen, FileText, Check, Filter, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, Layers, Zap
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface PlannerTask {
  id: string;
  userId: string;
  title: string;
  type: 'practice_test' | 'topic_review' | 'mock_exam' | 'quick_revision';
  subject?: string;
  durationMinutes: number;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot?: string; // e.g. "09:00", "14:30"
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  completed: boolean;
  createdAt: number;
}

interface StudyPlannerProps {
  userId: string;
}

const DEFAULT_SAMPLE_TASKS = [
  {
    title: 'JKSSB Quantitative Aptitude Mock',
    type: 'practice_test',
    subject: 'Mathematics',
    durationMinutes: 45,
    timeSlot: '09:30',
    reminderEnabled: true,
    reminderMinutesBefore: 15,
    completed: false
  },
  {
    title: 'General English & Grammar Review',
    type: 'topic_review',
    subject: 'English',
    durationMinutes: 30,
    timeSlot: '11:00',
    reminderEnabled: true,
    reminderMinutesBefore: 10,
    completed: true
  },
  {
    title: 'Current Affairs & GK Quiz',
    type: 'quick_revision',
    subject: 'General Knowledge',
    durationMinutes: 20,
    timeSlot: '15:00',
    reminderEnabled: false,
    reminderMinutesBefore: 15,
    completed: false
  },
  {
    title: 'Reasoning Ability Practice Test',
    type: 'practice_test',
    subject: 'Reasoning',
    durationMinutes: 60,
    timeSlot: '17:00',
    reminderEnabled: true,
    reminderMinutesBefore: 30,
    completed: false
  }
];

export function StudyPlanner({ userId }: StudyPlannerProps) {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date offset (0 = Today, 1 = Tomorrow, etc.)
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);

  // Dragging state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  
  // New task form fields
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<PlannerTask['type']>('practice_test');
  const [newTaskSubject, setNewTaskSubject] = useState('Quantitative Aptitude');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [newTaskTimeSlot, setNewTaskTimeSlot] = useState('10:00');
  const [newTaskReminder, setNewTaskReminder] = useState(true);
  const [newTaskReminderMins, setNewTaskReminderMins] = useState(15);
  const [savingTask, setSavingTask] = useState(false);

  // Get date strings
  const getDateForOffset = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const selectedDateStr = getDateForOffset(selectedDateOffset);

  // Dates for the week header selector
  const daysOfWeek = [-1, 0, 1, 2, 3, 4, 5].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: offset === 0
    };
  });

  // Fetch / Sync tasks from Firestore
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(
      collection(db, 'users', userId, 'study_planner_items')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const fetched: PlannerTask[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as PlannerTask));

      // If user has no tasks, auto-populate with initial sample schedule
      if (fetched.length === 0 && snap.metadata.hasPendingWrites === false) {
        const todayStr = getDateForOffset(0);
        const tomorrowStr = getDateForOffset(1);

        try {
          for (let i = 0; i < DEFAULT_SAMPLE_TASKS.length; i++) {
            const sample = DEFAULT_SAMPLE_TASKS[i];
            const targetDate = i % 2 === 0 ? todayStr : tomorrowStr;
            await addDoc(collection(db, 'users', userId, 'study_planner_items'), {
              ...sample,
              userId,
              scheduledDate: targetDate,
              createdAt: Date.now() - (i * 1000)
            });
          }
        } catch (e) {
          console.error("Error seeding initial study planner:", e);
        }
      } else {
        setTasks(fetched);
      }
      setLoading(false);
    }, (err) => {
      console.error("Study planner realtime fetch error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // Request Notification permission if reminders enabled
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check active reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentMins = now.getHours() * 60 + now.getMinutes();

      tasks.forEach(task => {
        if (!task.completed && task.reminderEnabled && task.scheduledDate === todayStr && task.timeSlot) {
          const [h, m] = task.timeSlot.split(':').map(Number);
          const taskMins = h * 60 + m;
          const diff = taskMins - currentMins;

          // Trigger reminder notification if within reminder window (e.g. exact minute)
          if (diff === task.reminderMinutesBefore) {
            new Notification(`🔔 Study Reminder: ${task.title}`, {
              body: `Starting in ${task.reminderMinutesBefore} mins (${task.timeSlot})! Get ready for your ${task.type.replace('_', ' ')}.`,
              icon: '/icon.png'
            });
            toast(`🔔 Reminder: ${task.title} starts in ${task.reminderMinutesBefore} mins!`, {
              icon: '⏰',
              duration: 6000
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetDateStr) {
      setDragOverTarget(targetDateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    if (!taskId) return;

    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove || taskToMove.scheduledDate === targetDateStr) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, scheduledDate: targetDateStr } : t));

    try {
      await updateDoc(doc(db, 'users', userId, 'study_planner_items', taskId), {
        scheduledDate: targetDateStr
      });
      const targetLabel = targetDateStr === getDateForOffset(0) ? 'Today' : targetDateStr === getDateForOffset(1) ? 'Tomorrow' : targetDateStr;
      toast.success(`Moved "${taskToMove.title}" to ${targetLabel}`);
    } catch (err) {
      console.error("Error moving task date:", err);
      toast.error("Failed to reschedule task.");
    } finally {
      setDraggedTaskId(null);
    }
  };

  // Toggle completion
  const handleToggleComplete = async (task: PlannerTask) => {
    const updated = !task.completed;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t));

    try {
      await updateDoc(doc(db, 'users', userId, 'study_planner_items', task.id), {
        completed: updated
      });
      if (updated) {
        toast.success(`Great job! Completed "${task.title}" 🎉`);
      }
    } catch (err) {
      console.error("Error updating completion status:", err);
    }
  };

  // Toggle reminder
  const handleToggleReminder = async (task: PlannerTask) => {
    const updated = !task.reminderEnabled;

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reminderEnabled: updated } : t));

    try {
      await updateDoc(doc(db, 'users', userId, 'study_planner_items', task.id), {
        reminderEnabled: updated
      });
      toast.success(updated ? `Reminder set for ${task.timeSlot || 'scheduled time'}` : 'Reminder turned off');
    } catch (err) {
      console.error("Error updating reminder:", err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string, title: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteDoc(doc(db, 'users', userId, 'study_planner_items', taskId));
      toast.success(`Removed "${title}"`);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Create new Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setSavingTask(true);
    try {
      await addDoc(collection(db, 'users', userId, 'study_planner_items'), {
        userId,
        title: newTaskTitle.trim(),
        type: newTaskType,
        subject: newTaskSubject,
        durationMinutes: Number(newTaskDuration),
        scheduledDate: selectedDateStr,
        timeSlot: newTaskTimeSlot,
        reminderEnabled: newTaskReminder,
        reminderMinutesBefore: Number(newTaskReminderMins),
        completed: false,
        createdAt: Date.now()
      });

      toast.success("Scheduled new study task!");
      setShowAddModal(false);
      setNewTaskTitle('');
    } catch (err) {
      console.error("Error adding task:", err);
      toast.error("Failed to schedule task.");
    } finally {
      setSavingTask(false);
    }
  };

  // Filter tasks for current selected day
  const dayTasks = tasks.filter(t => {
    if (t.scheduledDate !== selectedDateStr) return false;
    if (filterType === 'practice_test') return t.type === 'practice_test' || t.type === 'mock_exam';
    if (filterType === 'topic_review') return t.type === 'topic_review' || t.type === 'quick_revision';
    if (filterType === 'pending') return !t.completed;
    if (filterType === 'completed') return t.completed;
    return true;
  }).sort((a, b) => (a.timeSlot || '00:00').localeCompare(b.timeSlot || '00:00'));

  // Calculate day completion stats
  const totalDayTasks = tasks.filter(t => t.scheduledDate === selectedDateStr).length;
  const completedDayTasks = tasks.filter(t => t.scheduledDate === selectedDateStr && t.completed).length;
  const dayProgressPct = totalDayTasks > 0 ? Math.round((completedDayTasks / totalDayTasks) * 100) : 0;

  // Type styling badge map
  const getTypeBadge = (type: PlannerTask['type']) => {
    switch (type) {
      case 'practice_test':
        return { label: 'Practice Test', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' };
      case 'mock_exam':
        return { label: 'Full Mock Exam', bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' };
      case 'topic_review':
        return { label: 'Topic Review', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' };
      case 'quick_revision':
        return { label: 'Quick Revision', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' };
      default:
        return { label: 'Study Task', bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 md:p-8 shadow-sm transition-all space-y-6">
      
      {/* Planner Header & Daily Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-[#006e5d]/10 text-[#006e5d] dark:text-emerald-400 text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Schedule
            </span>
            <span className="text-xs text-slate-400 font-semibold">Drag &amp; Drop to Reschedule</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#006e5d]" /> Daily Study &amp; Practice Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Organize daily mock tests, subject revisions, and set automated notifications to keep your preparation on track.
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Schedule Task
          </button>
        </div>
      </div>

      {/* Days Selector Header (Interactive Drag Targets) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 px-1">
          <span>Select Date or Drag Tasks to Drop Zones</span>
          <span>{totalDayTasks} task{totalDayTasks === 1 ? '' : 's'} scheduled</span>
        </div>

        <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDateOffset === day.offset;
            const isDragTarget = dragOverTarget === day.dateStr;
            const dayTaskCount = tasks.filter(t => t.scheduledDate === day.dateStr).length;

            return (
              <div
                key={day.offset}
                onClick={() => setSelectedDateOffset(day.offset)}
                onDragOver={(e) => handleDragOver(e, day.dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day.dateStr)}
                className={`p-3 rounded-2xl text-center cursor-pointer transition-all border-2 select-none relative flex flex-col items-center justify-between min-w-[70px] ${
                  isDragTarget 
                    ? 'bg-emerald-100 border-dashed border-[#006e5d] dark:bg-emerald-950/60 scale-105 shadow-md' 
                    : isSelected 
                      ? 'bg-[#006e5d] text-white border-[#006e5d] shadow-lg shadow-emerald-900/20' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {day.isToday && (
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md mb-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-[#006e5d]/10 text-[#006e5d]'}`}>
                    Today
                  </span>
                )}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {day.dayName}
                </span>
                <span className={`text-base font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {day.dayNumber}
                </span>

                {/* Dot / Counter */}
                <div className="mt-1 flex items-center gap-1">
                  {dayTaskCount > 0 ? (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected 
                        ? 'bg-white text-[#006e5d]' 
                        : 'bg-[#006e5d] text-white'
                    }`}>
                      {dayTaskCount}
                    </span>
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Progress Indicator Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-[#006e5d]/10 text-[#006e5d] rounded-xl font-black text-sm">
            {dayProgressPct}%
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              {selectedDateOffset === 0 ? "Today's Schedule Progress" : selectedDateOffset === 1 ? "Tomorrow's Overview" : `Schedule for ${selectedDateStr}`}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {completedDayTasks} of {totalDayTasks} practice targets completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-64 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#006e5d] transition-all duration-500 rounded-full"
            style={{ width: `${dayProgressPct}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-[#006e5d] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('practice_test')}
            className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'practice_test' ? 'bg-[#006e5d] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tests
          </button>
          <button
            onClick={() => setFilterType('topic_review')}
            className={`px-2.5 py-1 rounded-lg transition-all ${filterType === 'topic_review' ? 'bg-[#006e5d] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Main Drag-and-Drop Task Feed Container */}
      <div 
        onDragOver={(e) => handleDragOver(e, selectedDateStr)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, selectedDateStr)}
        className={`min-h-[220px] rounded-2xl p-4 transition-all border-2 ${
          dragOverTarget === selectedDateStr 
            ? 'border-dashed border-[#006e5d] bg-emerald-50/40 dark:bg-emerald-950/20' 
            : 'border-transparent'
        }`}
      >
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#006e5d]" /> Loading study planner...
          </div>
        ) : dayTasks.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">No study tasks scheduled for this day</h4>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1 mb-4">
              Click &quot;Schedule Task&quot; above to add practice tests or topic reviews, or drag tasks from other dates.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#006e5d]/10 hover:bg-[#006e5d]/20 text-[#006e5d] dark:text-emerald-400 font-black text-xs rounded-xl transition-all"
            >
              + Schedule Practice Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map((task) => {
              const badge = getTypeBadge(task.type);
              const isBeingDragged = draggedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs group ${
                    isBeingDragged ? 'opacity-40 border-dashed border-[#006e5d]' : 'border-slate-200 dark:border-slate-700 hover:border-[#006e5d]/40'
                  } ${task.completed ? 'bg-slate-50/80 dark:bg-slate-800/40' : ''}`}
                >
                  {/* Left Controls & Task Information */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    
                    {/* Drag Grip handle */}
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 pt-1 shrink-0" title="Drag to reschedule date">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 cursor-pointer ${
                        task.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 dark:border-slate-600 hover:border-[#006e5d]'
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {task.subject && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                            {task.subject}
                          </span>
                        )}
                        {task.timeSlot && (
                          <span className="text-[11px] font-black text-[#006e5d] dark:text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.timeSlot}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-extrabold text-slate-900 dark:text-white transition-all ${
                        task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mt-1">
                        <span>Duration: {task.durationMinutes} mins</span>
                        <span>•</span>
                        <span>Scheduled for {task.scheduledDate === getDateForOffset(0) ? 'Today' : task.scheduledDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Bar (Reminder Toggle + Delete) */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700 w-full sm:w-auto justify-end">
                    
                    {/* Automated Reminder Toggle Button */}
                    <button
                      onClick={() => handleToggleReminder(task)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        task.reminderEnabled 
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                      }`}
                      title={task.reminderEnabled ? `Reminder active (${task.reminderMinutesBefore}m before)` : 'Enable automated reminder'}
                    >
                      <Bell className={`w-3.5 h-3.5 ${task.reminderEnabled ? 'text-amber-500 fill-amber-500' : ''}`} />
                      <span>{task.reminderEnabled ? 'Reminder On' : 'Remind Me'}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                      title="Delete study task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006e5d]" /> Schedule Study Task
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Quantitative Aptitude Mock Test 3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]"
                />
              </div>

              {/* Type and Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Task Category
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]"
                  >
                    <option value="practice_test">Practice Test</option>
                    <option value="topic_review">Topic Review</option>
                    <option value="mock_exam">Full Mock Exam</option>
                    <option value="quick_revision">Quick Revision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]"
                  />
                </div>
              </div>

              {/* Time Slot & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="time"
                    value={newTaskTimeSlot}
                    onChange={(e) => setNewTaskTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006e5d]"
                  >
                    <option value={15}>15 Mins</option>
                    <option value={30}>30 Mins</option>
                    <option value={45}>45 Mins</option>
                    <option value={60}>60 Mins (1 hr)</option>
                    <option value={90}>90 Mins</option>
                    <option value={120}>120 Mins (2 hrs)</option>
                  </select>
                </div>
              </div>

              {/* Reminder Config */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="text-xs font-black text-amber-900 dark:text-amber-200">
                      Automated Reminder
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Alerts before test time
                    </div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={newTaskReminder}
                  onChange={(e) => setNewTaskReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-[#006e5d] focus:ring-[#006e5d]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-5 py-2 bg-[#006e5d] hover:bg-[#005a4d] text-white rounded-xl text-xs font-black transition-all disabled:opacity-50"
                >
                  {savingTask ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
