import React, { useState, useRef, useEffect } from "react";
import { Settings, Zap, Flame, ShieldAlert, Award, Bell, AlertTriangle, Calendar, Clock, CheckCircle } from "lucide-react";
import { Task, CalendarEvent } from "../types";

interface HeaderProps {
  onOpenSettings: () => void;
  streak: number;
  xp: number;
  mode: "normal" | "intense";
  tasks: Task[];
  calendarEvents: CalendarEvent[];
}

export default function Header({ 
  onOpenSettings, 
  streak, 
  xp, 
  mode, 
  tasks = [], 
  calendarEvents = [] 
}: HeaderProps) {
  // Simple level calculation based on total XP (level = xp / 500 + 1)
  const currentLevel = Math.floor(xp / 500) + 1;
  const xpInCurrentLevel = xp % 500;
  const xpProgressPercent = (xpInCurrentLevel / 500) * 100;

  // Render current time in HH:MM format
  const [timeStr, setTimeStr] = React.useState("09:41");
  const [greeting, setGreeting] = React.useState("Good morning, Manasvi.");
  const [formattedDate, setFormattedDate] = React.useState("Thursday, October 24");
  const [showDeadlines, setShowDeadlines] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const greet = hours < 12 ? "Good morning, Manasvi." : hours < 18 ? "Good afternoon, Manasvi." : "Good evening, Manasvi.";
      setGreeting(greet);

      // format date
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      setFormattedDate(dateStr);

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDeadlines(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // Today's deadlines definition:
  // 1) Incomplete tasks due today
  const todaysDeadlinesTasks = tasks.filter(t => !t.completed && t.dueDate === todayStr);
  // 2) Exam/Assignment events due today
  const todaysDeadlinesEvents = calendarEvents.filter(e => !e.completed && e.date === todayStr && (e.type === "exam" || e.type === "assignment"));

  const totalDeadlinesCount = todaysDeadlinesTasks.length + todaysDeadlinesEvents.length;

  return (
    <div className="w-full shrink-0 flex flex-col bg-white border-b border-slate-100 select-none relative z-40">
      
      {/* 1. Simulated Neat iOS/Android Status Bar */}
      <div className="w-full px-6 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 bg-slate-50/50">
        <div>{timeStr}</div>
        
        {/* Device Signals */}
        <div className="flex items-center space-x-2">
          {/* Signal bars */}
          <div className="flex items-end space-x-0.5 h-2">
            <div className="w-0.5 h-1 bg-slate-300 rounded-full" />
            <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
            <div className="w-0.5 h-2 bg-slate-400 rounded-full" />
            <div className="w-0.5 h-2.5 bg-slate-400 rounded-full" />
          </div>
          
          <span className="font-sans text-[8px] tracking-wider uppercase">LTE</span>
          
          {/* Battery */}
          <div className="w-4.5 h-2.5 border border-slate-300 rounded-xs p-0.5 flex items-center relative">
            <div className="h-full w-4/5 bg-slate-400 rounded-3xs" />
            <div className="w-0.5 h-1 bg-slate-300 absolute -right-0.5 top-[1px] rounded-r-3xs" />
          </div>
        </div>
      </div>

      {/* 2. Elegant Minimalist Header from Design Instructions */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800 leading-tight">
            {greeting}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            {formattedDate}
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 relative">
          {/* PIKO Mode Indicator Pill */}
          <div 
            onClick={onOpenSettings}
            className="bg-white rounded-full px-3.5 py-1.5 shadow-xs border border-slate-100 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
            title="Click to toggle Focus Mode settings"
          >
            <span className="text-orange-500 font-extrabold italic text-xs tracking-tight">PIKO</span>
            <div className="w-px h-3 bg-slate-200"></div>
            <span className="text-[9px] font-bold text-slate-500">
              {mode === "intense" ? "INTENSE ON" : "FLOW ON"}
            </span>
          </div>

          {/* Today's Deadlines Bell Icon Dropdown container */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-bell-btn"
              onClick={() => setShowDeadlines(!showDeadlines)}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-100 active:scale-95 transition-all text-slate-500 relative"
              title="Today's Deadlines"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              {totalDeadlinesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {totalDeadlinesCount}
                </span>
              )}
            </button>

            {/* Absolute Dropdown showing ONLY Today's Deadlines */}
            {showDeadlines && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl p-4.5 z-50 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Today's Deadlines
                    </h4>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {totalDeadlinesCount} Urgent
                  </span>
                </div>

                {totalDeadlinesCount === 0 ? (
                  <div className="text-center py-6 space-y-1.5">
                    <span className="text-2xl">🎉</span>
                    <p className="text-xs font-extrabold text-slate-700">No deadlines today!</p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                      You are fully caught up for the day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {todaysDeadlinesTasks.map(t => (
                      <div 
                        key={t.id} 
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            t.priority === "high" ? "bg-red-100 text-red-700" :
                            t.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {t.priority} Priority
                          </span>
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Homework Task
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{t.title}</p>
                        {t.description && (
                          <p className="text-[9px] text-slate-400 font-semibold truncate">{t.description}</p>
                        )}
                      </div>
                    ))}

                    {todaysDeadlinesEvents.map(e => (
                      <div 
                        key={e.id} 
                        className="p-3 rounded-xl bg-indigo-50/20 border border-indigo-100/30 flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {e.time}
                          </span>
                          <span className="text-[8px] font-extrabold text-indigo-400 uppercase tracking-widest">
                            {e.type} Event
                          </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-950 leading-snug">{e.title}</p>
                        {e.notes && (
                          <p className="text-[9px] text-indigo-400/80 font-semibold truncate">{e.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile avatar, clicking triggers settings modal */}
          <button
            id="user-avatar-btn"
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-full bg-indigo-50 border-2 border-white shadow-xs flex items-center justify-center cursor-pointer hover:bg-indigo-100 active:scale-95 transition-all text-indigo-600 font-bold text-xs uppercase"
            title="Open Control Center"
          >
            MG
          </button>
        </div>
      </div>

      {/* 3. Sleek Level Progress Bar (Indigo Theme) */}
      <div className="px-6 pb-3.5 bg-white">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-800 font-extrabold">Level {currentLevel}</span>
            <span className="text-slate-200">•</span>
            <span className="text-slate-400">{xpInCurrentLevel}/500 XP</span>
          </div>
          <span className="text-indigo-600 font-extrabold font-mono">{xp} Total XP</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${xpProgressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
