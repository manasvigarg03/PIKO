import React, { useState } from "react";
import { Task, Goal, Habit } from "../types";
import { 
  Clock, 
  Zap, 
  Flame, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight, 
  Play, 
  Check, 
  Target, 
  Calendar, 
  Plus, 
  Trash, 
  Bell, 
  BellOff, 
  Sparkles, 
  CheckSquare, 
  RefreshCw 
} from "lucide-react";

interface PlannerTabProps {
  tasks: Task[];
  xpToday: number;
  streak: number;
  timeSaved: number;
  productivityScore: number;
  goals: Goal[];
  habits: Habit[];
  onAddGoal: (title: string, targetDate: string) => Promise<void>;
  onDeleteGoal: (id: string) => void;
  onAddHabit: (title: string, frequency: "daily" | "weekly" | "weekdays" | "custom", goalId?: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onChangeHabitFrequency: (id: string, frequency: "daily" | "weekly" | "weekdays" | "custom") => void;
  onToggleHabitReminder: (id: string, reminderTime?: string) => void;
  onCompleteQuickWin: (id: string) => void;
  onLaunchFocusSession: (taskId: string) => void;
  onSwitchTab: (tab: "planner" | "calendar" | "focus" | "tasks" | "growth" | "notifications") => void;
}

export default function PlannerTab({
  tasks,
  xpToday,
  streak,
  timeSaved,
  productivityScore,
  goals,
  habits,
  onAddGoal,
  onDeleteGoal,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
  onChangeHabitFrequency,
  onToggleHabitReminder,
  onCompleteQuickWin,
  onLaunchFocusSession,
  onSwitchTab
}: PlannerTabProps) {
  // Local state for forms
  const [subTab, setSubTab] = useState<"goals_habits" | "todays_tasks">("todays_tasks");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<"daily" | "weekly" | "weekdays" | "custom">("daily");
  const [habitReminderTime, setHabitReminderTime] = useState("08:00 AM");
  const [selectedGoalIdForHabit, setSelectedGoalIdForHabit] = useState<string>("");
  const [isRecommending, setIsRecommending] = useState(false);

  // Quick wins: isQuickWin === true AND NOT completed (sorted by priority: high > medium > low)
  const quickWins = tasks
    .filter(t => t.isQuickWin && !t.completed)
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    });
  
  // Focus tasks: isQuickWin === false AND NOT completed (sorted by priority: high > medium > low)
  const focusTasks = tasks
    .filter(t => !t.isQuickWin && !t.completed)
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    });

  // Compute overall task completion
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const overallTaskProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find a suggested task for the main action suggestion (using priority-sorted focus tasks)
  const suggestedTask = focusTasks[0] || tasks.filter(t => !t.completed).sort((a, b) => {
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  })[0] || tasks[0];

  // SVG parameters for progress ring (exact sizes from Clean Minimalism design: r=80, stroke=12)
  const size = 180;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallTaskProgress / 100) * circumference;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalDate) return;
    setIsRecommending(true);
    await onAddGoal(goalTitle, goalDate);
    setGoalTitle("");
    setGoalDate("");
    setIsAddingGoal(false);
    setIsRecommending(false);
  };

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    onAddHabit(
      habitTitle,
      habitFreq,
      selectedGoalIdForHabit ? selectedGoalIdForHabit : undefined
    );
    setHabitTitle("");
    setHabitFreq("daily");
    setSelectedGoalIdForHabit("");
    setIsAddingHabit(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      
      {/* 1. Daily Progress Sphere & Stats Grid */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xs border border-slate-100 flex flex-col items-center">
        
        {/* Dynamic Circular SVG Progress */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" width={size} height={size}>
            {/* Grey Background track */}
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke="#E2E8F0" 
              strokeWidth={strokeWidth} 
            />
            {/* Indigo Progress block */}
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke="#6366F1" 
              strokeWidth={strokeWidth} 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-800">{overallTaskProgress}%</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed</span>
          </div>
        </div>

        {/* 4-Column Clean Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Earned</p>
            <p className="text-lg font-extrabold text-indigo-600">+{xpToday}</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Streak</p>
            <p className="text-lg font-extrabold text-orange-500">{streak} Days</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Saved</p>
            <p className="text-lg font-extrabold text-emerald-500">{timeSaved}m</p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P. Score</p>
            <p className="text-lg font-extrabold text-slate-800">{productivityScore}</p>
          </div>
        </div>
      </div>

      {/* Category Segmented Control Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40">
        <button
          id="planner-subtab-goals-btn"
          onClick={() => setSubTab("goals_habits")}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            subTab === "goals_habits"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          🎯 Goals & Habits
        </button>
        <button
          id="planner-subtab-tasks-btn"
          onClick={() => setSubTab("todays_tasks")}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            subTab === "todays_tasks"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          ⚡ Today's Tasks
        </button>
      </div>

      {/* 2. Goals & Habits Category */}
      {subTab === "goals_habits" && (
        <div className="space-y-6 animate-fadeIn">
          {/* 2. Goals Section */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-500" />
            Milestone Goals
          </h2>
          <button
            onClick={() => setIsAddingGoal(!isAddingGoal)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Goal</span>
          </button>
        </div>

        {isAddingGoal && (
          <form onSubmit={handleGoalSubmit} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Goal Milestone</label>
              <input
                type="text"
                placeholder="e.g., Master advanced JavaScript / Run a marathon"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Target Date (Synced to Calendar)</label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={isRecommending}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isRecommending ? "Generating Habits..." : "Create Goal & Smart Habits"}</span>
            </button>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No goals set. Create one to receive automated, smart habit suggestions! 🎯
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div 
                key={goal.id} 
                className="p-4 border border-slate-100 bg-slate-50/40 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center">
                      <Target className="w-3.5 h-3.5 mr-1 text-indigo-500 shrink-0" />
                      {goal.title}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center w-max">
                      <Calendar className="w-3 h-3 mr-1" />
                      Target: {goal.targetDate} (Synced)
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                {goal.recommendedHabits && goal.recommendedHabits.length > 0 && (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 space-y-1.5">
                    <div className="flex items-center space-x-1 text-[9px] text-indigo-800 font-extrabold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                      <span>Gemini Daily Recommendations:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                      {goal.recommendedHabits.map((rec, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <span className="w-1 h-1 rounded-full bg-indigo-400" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Habits Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-emerald-500" />
            Habits Tracker
          </h2>
          <button
            onClick={() => setIsAddingHabit(!isAddingHabit)}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Habit</span>
          </button>
        </div>

        {isAddingHabit && (
          <form onSubmit={handleHabitSubmit} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Habit Name</label>
              <input
                type="text"
                placeholder="e.g., Read documentation, exercise"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Frequency</label>
                <select
                  value={habitFreq}
                  onChange={(e) => setHabitFreq(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Link to Goal</label>
                <select
                  value={selectedGoalIdForHabit}
                  onChange={(e) => setSelectedGoalIdForHabit(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none font-semibold text-slate-700"
                >
                  <option value="">No goal linkage</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-sans block">Daily Reminder</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="08:00 AM"
                  value={habitReminderTime}
                  onChange={(e) => setHabitReminderTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Create Habit</span>
            </button>
          </form>
        )}

        {habits.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No habits loaded. Create your own habit or set a goal to get started! 🔁
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(todayStr);
              const totalCompletions = habit.completedDates.length;
              const associatedGoal = goals.find(g => g.id === habit.goalId);

              return (
                <div
                  key={habit.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0 mr-2">
                    {/* Circle check button */}
                    <button
                      onClick={() => onToggleHabit(habit.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isCompletedToday
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                          : "border-slate-300 hover:border-emerald-500 bg-white text-transparent hover:text-emerald-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-extrabold text-slate-800 truncate ${isCompletedToday ? "line-through text-slate-400" : ""}`}>
                        {habit.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        {/* Frequency Selector dropdown direct control */}
                        <select
                          value={habit.frequency}
                          onChange={(e) => onChangeHabitFrequency(habit.id, e.target.value as any)}
                          className="text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 focus:outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekdays">Weekdays</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>

                        {associatedGoal && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            🎯 {associatedGoal.title}
                          </span>
                        )}

                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                          🔥 Streak: {totalCompletions}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Toggle notification reminder button */}
                    <button
                      onClick={() => onToggleHabitReminder(habit.id)}
                      title={habit.reminderEnabled ? "Silence Reminder" : "Enable Reminder"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        habit.reminderEnabled 
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {habit.reminderEnabled ? (
                        <div className="flex items-center space-x-0.5">
                          <Bell className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-bold font-mono">{habit.reminderTime}</span>
                        </div>
                      ) : (
                        <BellOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete habit */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

      {/* 3. Today's Tasks Category */}
      {subTab === "todays_tasks" && (
        <div className="space-y-6 animate-fadeIn">
          {/* 4. Quick Wins Section */}
          <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center">
            Quick Wins <span className="text-slate-300 text-xs font-semibold ml-2">Under 2 min</span>
          </h2>
          <span className="text-xs font-bold text-indigo-500">{quickWins.length} left</span>
        </div>

        {quickWins.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No quick wins left. You've cleared them all! 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {quickWins.map((win) => (
              <div
                key={win.id}
                id={`quick-win-${win.id}`}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors group"
              >
                <div className="flex gap-3 items-center">
                  <button
                    id={`complete-quick-${win.id}`}
                    onClick={() => onCompleteQuickWin(win.id)}
                    className="w-5 h-5 border-2 border-slate-300 rounded-md hover:border-indigo-500 hover:bg-indigo-50 flex items-center justify-center transition-all cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{win.title}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                      +{win.xpReward} XP • {win.duration}m
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onCompleteQuickWin(win.id)}
                  className="text-slate-300 group-hover:text-slate-500 transition-colors font-bold text-xs"
                >
                  →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Today's Focus Tasks Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-extrabold text-slate-800">Today's Focus Tasks</h2>
          <button 
            id="view-all-tasks-link"
            onClick={() => onSwitchTab("tasks")}
            className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full text-[9px] font-bold tracking-wider uppercase transition-colors"
          >
            Manage Tasks
          </button>
        </div>

        {focusTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No focus tasks active. Add some in the Tasks tab! 🎯
          </div>
        ) : (
          <div className="space-y-4">
            {focusTasks.map((task) => {
              const remainingSubtasks = task.subtasks.filter(s => !s.completed).length;
              return (
                <div
                  key={task.id}
                  id={`focus-task-${task.id}`}
                  onClick={() => onLaunchFocusSession(task.id)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 cursor-pointer transition-colors space-y-2.5 group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs leading-tight group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        Remaining Steps: {remainingSubtasks} • Estimated: {task.duration}m
                      </p>
                    </div>
                    <span className="text-indigo-600 font-extrabold text-xs">+{task.xpReward} XP</span>
                  </div>

                  {/* Clean progress bar from Design instructions */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-500" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                    <span>{task.progress}% Complete</span>
                    <span className="text-indigo-500 group-hover:underline">Start Focus block</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

    </div>
  );
}
