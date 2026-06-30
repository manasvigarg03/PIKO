import React, { useEffect, useState, useRef } from "react";
import { Task } from "../types";
import { Play, Pause, Square, Sparkles, CheckCircle2, Circle, Award } from "lucide-react";

interface FocusTabProps {
  tasks: Task[];
  activeTaskId: string | null;
  activeSubtaskId: string | null;
  onSetFocusTask: (taskId: string | null, subtaskId: string | null) => void;
  onCompleteSubtask: (taskId: string, subtaskId: string) => void;
  onEarnXP: (xp: number, timeSavedIncrement: number) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
  isRunning: boolean;
  onRunningChange: (running: boolean) => void;
}

export default function FocusTab({
  tasks,
  activeTaskId,
  activeSubtaskId,
  onSetFocusTask,
  onCompleteSubtask,
  onEarnXP,
  addToast,
  isRunning,
  onRunningChange
}: FocusTabProps) {
  // Focus session state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [initialTime, setInitialTime] = useState(25 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get active task data
  const currentTask = tasks.find(t => t.id === activeTaskId);
  
  // Handle timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer complete!
            clearInterval(timerRef.current!);
            onRunningChange(false);
            const xpReward = 100;
            const minutesCompleted = Math.round(initialTime / 60);
            onEarnXP(xpReward, minutesCompleted);
            addToast(`Outstanding! You completed a ${minutesCompleted}-minute Focus Session! +${xpReward} XP earned! 🌟`, "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, initialTime]);

  // Handle start
  const handleStart = () => {
    if (!currentTask) {
      addToast("Please select a task to focus on first.", "warning");
      return;
    }
    onRunningChange(true);
    addToast(`Focus session started: "${currentTask.title}"`, "info");
  };

  // Handle pause
  const handlePause = () => {
    onRunningChange(false);
    addToast("Focus session paused.", "info");
  };

  // Handle reset/end
  const handleReset = () => {
    onRunningChange(false);
    setTimeLeft(initialTime);
    addToast("Focus session ended and timer reset.", "info");
  };

  // Change preset duration
  const handlePresetChange = (mins: number) => {
    if (isRunning) {
      addToast("Cannot change duration during an active session.", "warning");
      return;
    }
    const secs = mins * 60;
    setInitialTime(secs);
    setTimeLeft(secs);
  };

  // Formatting minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // SVG dash array calculation for timer circle
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / initialTime) * circumference;

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      
      {/* Immersive Light-Theme Minimalist Focus Dashboard */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xs border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Breathing ambient indicator */}
        {isRunning && (
          <div className="absolute inset-0 bg-indigo-50/10 animate-pulse rounded-[2rem] pointer-events-none" />
        )}

        <div className="text-center space-y-1 relative z-10 w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Deep Work Sphere
          </span>
          <h3 className="text-xs font-bold text-slate-600 max-w-[85%] mx-auto truncate">
            {currentTask ? `Focusing: ${currentTask.title}` : "Select a Focus Target Below"}
          </h3>
        </div>

        {/* Circular Countdown Timer */}
        <div className="relative my-6 flex items-center justify-center z-10 select-none">
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-slate-100"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`transition-all duration-1000 ${isRunning ? "text-indigo-600" : "text-slate-400"}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          
          {/* Digits inside circle */}
          <div className="absolute text-center">
            <span className="block text-4xl font-mono font-extrabold tracking-tighter text-slate-800">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              {isRunning ? "FOCUSING" : "PAUSED"}
            </span>
          </div>
        </div>

        {/* Preset selections */}
        <div className="flex space-x-2.5 mb-6 z-10">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handlePresetChange(mins)}
              disabled={isRunning}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border transition-colors cursor-pointer ${
                initialTime === mins * 60
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center space-x-4.5 z-10">
          {isRunning ? (
            <button
              id="pause-timer-btn"
              onClick={handlePause}
              className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 border border-slate-200/60"
            >
              <Pause className="w-5 h-5 fill-slate-700 text-slate-700" />
            </button>
          ) : (
            <button
              id="start-timer-btn"
              onClick={handleStart}
              className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-indigo-600/10 active:scale-90"
            >
              <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
            </button>
          )}

          <button
            id="reset-timer-btn"
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-200/50 transition-all cursor-pointer active:scale-90"
            title="Reset Timer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* XP stats context */}
        {currentTask && (
          <div className="mt-6 pt-5 border-t border-dashed border-slate-100 w-full flex justify-between items-center text-xs text-slate-400 z-10 px-2">
            <span className="flex items-center font-semibold">
              <Award className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Potential: +100 XP
            </span>
            <span className="flex items-center font-semibold text-indigo-600">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500 animate-pulse" />
              Active Target
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Task Selection and Checklist */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Focus Session Targets
        </h3>

        {!currentTask ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Select one of today's focus tasks below to load its workspace:
            </p>
            <div className="space-y-2.5">
              {tasks
                .filter(t => !t.isQuickWin && !t.completed)
                .sort((a, b) => {
                  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
                  return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
                })
                .map((t) => (
                <button
                  key={t.id}
                  id={`load-task-focus-${t.id}`}
                  onClick={() => onSetFocusTask(t.id, null)}
                  className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl text-left flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div>
                    <span className="block text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{t.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">{t.duration} min • {t.subtasks.length} subtasks</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-3 py-1 rounded-full transition-colors group-hover:bg-indigo-100">
                    Load Workspace
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4">
            
            {/* Loaded task info and unloader */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Workspace</span>
                <h4 className="text-xs font-extrabold text-slate-800 leading-tight mt-0.5">{currentTask.title}</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1 leading-relaxed">{currentTask.description}</p>
              </div>
              <button
                id="unload-task-focus"
                onClick={() => {
                  if (isRunning) {
                    addToast("Stop Focus session before changing workspaces.", "warning");
                    return;
                  }
                  onSetFocusTask(null, null);
                }}
                className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer bg-red-50 hover:bg-red-100/50 px-2.5 py-1 rounded-full transition-colors"
              >
                Change Task
              </button>
            </div>

            {/* Checklist of subtasks */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>SUBTASK CHECKLIST</span>
                <span>{currentTask.subtasks.filter(s => s.completed).length}/{currentTask.subtasks.length} Done</span>
              </div>

              {currentTask.subtasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No subtasks broken down yet. Break this task down in the Tasks tab!
                </p>
              ) : (
                <div className="space-y-2">
                  {currentTask.subtasks.map((sub) => {
                    return (
                      <div
                        key={sub.id}
                        id={`focus-sub-${sub.id}`}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          sub.completed
                            ? "bg-slate-50/50 border-slate-100 text-slate-400"
                            : "bg-slate-50 border-slate-100/50 text-slate-800 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3 pr-2">
                          <button
                            id={`focus-complete-sub-${sub.id}`}
                            onClick={() => {
                              onCompleteSubtask(currentTask.id, sub.id);
                            }}
                            className="shrink-0 cursor-pointer text-slate-500"
                          >
                            {sub.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600 transition-colors" />
                            )}
                          </button>
                          
                          <span className={`text-xs font-bold leading-tight ${sub.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {sub.title}
                          </span>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          sub.completed ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          +{sub.xpReward} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
