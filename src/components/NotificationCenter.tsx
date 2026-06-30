import React, { useState } from "react";
import { NotificationLog, Task, CalendarEvent } from "../types";
import { DISTRACTION_APPS } from "../data";
import { 
  Bell, 
  ShieldAlert, 
  Clock, 
  Play, 
  Calendar, 
  Zap, 
  Volume2, 
  Smartphone, 
  Sparkles, 
  CheckCircle, 
  Info,
  Layers,
  Music,
  LogOut,
  Moon
} from "lucide-react";

interface NotificationCenterProps {
  mode: "normal" | "intense";
  tasks: Task[];
  logs: NotificationLog[];
  onAddLog: (log: NotificationLog) => void;
  onLaunchFocusSession: (taskId: string) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
  voiceRemindersDisabled: boolean;
  calendarEvents: CalendarEvent[];
  onCommitTask: (taskId: string, taskTitle: string, time: string, location: string) => void;
}

export default function NotificationCenter({
  mode,
  tasks,
  logs,
  onAddLog,
  onLaunchFocusSession,
  addToast,
  voiceRemindersDisabled,
  calendarEvents,
  onCommitTask
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"compare" | "sim">("sim");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ignoreCount, setIgnoreCount] = useState(0);
  const [simTime, setSimTime] = useState("");
  const [simPlace, setSimPlace] = useState("");

  const [activeNotification, setActiveNotification] = useState<{
    message: string;
    taskTitle: string;
    subtaskTitle: string;
    estimatedTime: number;
    taskId: string;
    eventType: "normal" | "intense";
    eventName: string;
  } | null>(null);

  // General notification generator trigger supporting both normal calendar and intense behavioral streams
  const triggerNotificationSimulation = async (
    eventName: string, 
    eventType: "normal" | "intense", 
    appContext?: string
  ) => {
    setSelectedApp(appContext || null);
    setIsLoading(true);

    const isIntense = eventType === "intense";

    // Filter uncompleted tasks to contextualize the alert
    // If intense mode, do not select tasks that already have a committed calendar time
    const isEligible = (t: Task) => {
      if (t.completed) return false;
      if (isIntense && calendarEvents) {
        const hasCommittedTime = calendarEvents.some(ev => ev.associatedTaskId === t.id);
        if (hasCommittedTime) return false;
      }
      return true;
    };

    const eligibleTask = tasks.find(t => isEligible(t) && !t.isQuickWin) || tasks.find(isEligible) || tasks[0];
    if (!eligibleTask) {
      addToast("No pending tasks available to formulate this notification.", "warning");
      setIsLoading(false);
      return;
    }

    const firstIncompleteSubtask = eligibleTask.subtasks?.find(s => !s.completed) || {
      title: "begin preliminary step",
      estimatedTime: 12
    };

    try {
      const response = await fetch("/api/gemini/generate-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: eventType,
          taskTitle: eligibleTask.title,
          subtaskTitle: firstIncompleteSubtask.title,
          distractionApp: appContext || "",
          estimatedTime: firstIncompleteSubtask.estimatedTime,
          eventName: eventName
        })
      });

      const data = await response.json();
      if (data.message) {
        setActiveNotification({
          message: data.message,
          taskTitle: eligibleTask.title,
          subtaskTitle: firstIncompleteSubtask.title,
          estimatedTime: firstIncompleteSubtask.estimatedTime,
          taskId: eligibleTask.id,
          eventType,
          eventName
        });

        onAddLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: data.message,
          type: eventType,
          taskTitle: eligibleTask.title,
          subtaskTitle: firstIncompleteSubtask.title,
          distractionApp: appContext || eventName
        });
        
        addToast(`Simulated Event Generated: "${eventName}" 🔔`, "success");
      }
    } catch (err) {
      console.error("Gemini smart simulation failed, using structured fallbacks:", err);
      // Fallback calculations strictly following the user style examples
      let fallbackMsg = "";
      if (eventType === "normal") {
        if (eventName.toLowerCase().includes("morning")) {
          fallbackMsg = `☀️ Morning summary: Today you scheduled ${eligibleTask.title}. Let's take just ${firstIncompleteSubtask.estimatedTime} mins to complete "${firstIncompleteSubtask.title}".`;
        } else if (eventName.toLowerCase().includes("scheduled")) {
          fallbackMsg = `You planned to study now. Let's complete just the first five questions of "${eligibleTask.title}".`;
        } else if (eventName.toLowerCase().includes("deadline")) {
          fallbackMsg = `📅 Scheduled deadline check-in: "${eligibleTask.title}" is due soon. Let's complete the subtask "${firstIncompleteSubtask.title}" to stay ahead.`;
        } else {
          fallbackMsg = `⚡ Quick Win reminder: Complete your 2-min task right now to get a steady productivity multiplier!`;
        }
      } else {
        // Intense mode
        if (appContext === "YouTube") {
          fallbackMsg = `You're opening YouTube. You can start on your first remaining subtask: "${firstIncompleteSubtask.title}" rather than opening YouTube! Starting this task will only take 2 mins so lets goo!`;
        } else if (appContext === "Instagram") {
          fallbackMsg = `You're opening Instagram. You can start on your first remaining subtask: "${firstIncompleteSubtask.title}" rather than opening Instagram! Starting this task will only take 2 mins so lets goo!`;
        } else if (eventName.toLowerCase().includes("idle")) {
          fallbackMsg = `⚠️ You've been idle for 20 minutes. Screen idle swap: completing 1 question of "${eligibleTask.title}" saves 10 mins of study fatigue tomorrow.`;
        } else if (appContext === "Spotify") {
          fallbackMsg = `🎵 Focus music detected! This is the perfect active moment to power through "${firstIncompleteSubtask.title}" on "${eligibleTask.title}".`;
        } else if (eventName.toLowerCase().includes("missed")) {
          fallbackMsg = `🚨 Focus Session Block was missed! Swapping Instagram scrolling right now for "${firstIncompleteSubtask.title}" takes exactly ${firstIncompleteSubtask.estimatedTime} mins.`;
        } else {
          fallbackMsg = `🔥 Context alert: Instead of swapping apps now, let's nail 1 action step for "${eligibleTask.title}" so you have free time tonight.`;
        }
      }

      setActiveNotification({
        message: fallbackMsg,
        taskTitle: eligibleTask.title,
        subtaskTitle: firstIncompleteSubtask.title,
        estimatedTime: firstIncompleteSubtask.estimatedTime,
        taskId: eligibleTask.id,
        eventType,
        eventName
      });

      onAddLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: fallbackMsg,
        type: eventType,
        taskTitle: eligibleTask.title,
        subtaskTitle: firstIncompleteSubtask.title,
        distractionApp: appContext || eventName
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start related assignment in Focus Tab
  const handleStartNow = () => {
    if (!activeNotification) return;
    if (activeNotification.eventType === "intense") {
      if (!simTime.trim() || !simPlace.trim()) {
        addToast("🔒 INTENSE LOCK: You must enter both a time and a place to proceed!", "warning");
        return;
      }
      onCommitTask(activeNotification.taskId, activeNotification.taskTitle, simTime, simPlace);
    }
    onLaunchFocusSession(activeNotification.taskId);
    setActiveNotification(null);
    setSelectedApp(null);
    setIgnoreCount(0);
    setSimTime("");
    setSimPlace("");
    addToast("Loaded related homework/assignment in Focus tab. Go get it! 🚀", "success");
  };

  // Postpone notification flow
  const handlePostpone = () => {
    if (!activeNotification) return;
    if (activeNotification.eventType === "intense") {
      if (!simTime.trim() || !simPlace.trim()) {
        addToast("🔒 INTENSE LOCK: You must enter both a time and a place to proceed!", "warning");
        return;
      }
      onCommitTask(activeNotification.taskId, activeNotification.taskTitle, simTime, simPlace);
    }

    const currentIgnore = ignoreCount + 1;
    setIgnoreCount(currentIgnore);
    addToast("Postponed check-in by 10 minutes.", "info");

    if (activeNotification.eventType === "intense" && currentIgnore >= 2) {
      triggerVoiceReminder(activeNotification.message);
    } else {
      setActiveNotification(null);
      setSelectedApp(null);
      setSimTime("");
      setSimPlace("");
    }
  };

  // Lock in schedule block on calendar stream
  const handleScheduleBlock = () => {
    if (!activeNotification) return;
    if (activeNotification.eventType === "intense") {
      if (!simTime.trim() || !simPlace.trim()) {
        addToast("🔒 INTENSE LOCK: You must enter both a time and a place to proceed!", "warning");
        return;
      }
    }
    onCommitTask(activeNotification.taskId, activeNotification.taskTitle, simTime || "3:00 PM", simPlace || "Study Room");
    setActiveNotification(null);
    setSelectedApp(null);
    setIgnoreCount(0);
    setSimTime("");
    setSimPlace("");
    addToast(`Committed! Action item "${activeNotification.taskTitle}" scheduled to Calendar!`, "success");
  };

  // Voice Intervention Speech Alert
  const triggerVoiceReminder = (msg: string) => {
    if (voiceRemindersDisabled) {
      addToast("🔇 Voice reminders are currently disabled in settings.", "info");
      setActiveNotification(null);
      setSelectedApp(null);
      setIgnoreCount(0);
      setSimTime("");
      setSimPlace("");
      return;
    }

    if (!("speechSynthesis" in window)) {
      addToast("Speech synthesis not supported in this frame. Voice alert simulated.", "warning");
      setActiveNotification(null);
      setSelectedApp(null);
      setIgnoreCount(0);
      return;
    }

    window.speechSynthesis.cancel();
    const alertText = `Attention. Piko coach intervention. ${msg}. You cannot dismiss this alert without committing to a time and place.`;
    const utterance = new SpeechSynthesisUtterance(alertText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    addToast("🔊 VOICE INTERVENTION SHIELD: Committing is required in Intense Mode!", "warning");

    utterance.onend = () => {
      setActiveNotification(null);
      setSelectedApp(null);
      setIgnoreCount(0);
      setSimTime("");
      setSimPlace("");
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      {/* Tab Select Header */}
      <div className="flex border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab("sim")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-4 cursor-pointer ${
            activeTab === "sim" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          🎮 Simulator Terminal
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-4 cursor-pointer ${
            activeTab === "compare" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          📋 System Comparison Matrix
        </button>
      </div>

      {activeTab === "compare" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Normal Mode card info */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Normal Mode Protocol</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">📅 Calendar-driven & Time-based</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Designed for organized rhythm and steady execution. Notifications are predictable, quiet, and match pre-scheduled checkpoints.
            </p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex justify-between text-[11px] pb-1.5 border-b border-slate-200/50">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Frequency</span>
                <span className="font-extrabold text-indigo-600">4–8 alerts per day</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Core Event Triggers:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium text-[11px]">
                  <li>Morning summary check-ins</li>
                  <li>Before scheduled workspace blocks</li>
                  <li>Before impending homework deadlines</li>
                  <li>2-Min Quick Wins gentle reminders</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-1">Example Message Pattern:</p>
              <p className="text-xs text-indigo-900 font-bold italic">
                "You planned to study now. Let's complete just the first five questions."
              </p>
            </div>
          </div>

          {/* Intense Mode card info */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Intense Mode Protocol</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">🔥 Context-aware & Adaptive</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Designed for distraction mitigation and proactive shield enforcement. Swaps scrolling time for instant progress.
            </p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="flex justify-between text-[11px] pb-1.5 border-b border-slate-200/50">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Frequency</span>
                <span className="font-extrabold text-red-600">Event-Driven / Behavioral</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Core Event Triggers:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium text-[11px]">
                  <li>Social media app interception</li>
                  <li>App-switching distraction loops</li>
                  <li>Focus session interruptions / closures</li>
                  <li>Long computer idle times (&gt;15 mins)</li>
                  <li>Productive sparks (when headphones or Spotify connect)</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/50">
              <p className="text-[10px] font-black text-red-800 uppercase tracking-wider mb-1">Example Message Pattern:</p>
              <p className="text-xs text-red-900 font-bold italic">
                "You're on YouTube. One more video takes about 12 minutes—the same time needed to finish today's coding exercise."
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sim" && (
        <div className="space-y-6">
          {/* Active Mode Notice banner */}
          <div className={`p-4 rounded-[1.5rem] border flex items-center justify-between ${
            mode === "intense" 
              ? "bg-red-50/40 border-red-100 text-red-900" 
              : "bg-indigo-50/40 border-indigo-100 text-indigo-950"
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${mode === "intense" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                {mode === "intense" ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Calendar className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold">
                  System Mode: <span className="uppercase font-black">{mode} Mode Protocol</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {mode === "intense" 
                    ? "Event-driven micro-swaps, app tracking, and non-dismissible scheduled commits are active." 
                    : "Predictable calendar summaries and gentle time-based checklists are active."
                  }
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              mode === "intense" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
            }`}>
              {mode === "intense" ? "Intervention Active" : "Gentle Monitoring"}
            </span>
          </div>

          {/* Normal Mode Event Triggers */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
            <div>
              <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider font-sans block mb-0.5">Event Suite A (Time-Based)</span>
              <h3 className="text-sm font-bold text-slate-800">Normal Flow Checklist Reminders</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Simulate calendar events that trigger gentle, orderly, scheduled prompts.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Morning Summary", "normal")}
                disabled={isLoading}
                className="p-3 text-center rounded-2xl border border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all cursor-pointer text-xs font-extrabold text-indigo-900"
              >
                ☀️ Morning Summary
              </button>
              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Scheduled Work Session", "normal")}
                disabled={isLoading}
                className="p-3 text-center rounded-2xl border border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all cursor-pointer text-xs font-extrabold text-indigo-900"
              >
                📅 Study Nudge
              </button>
              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Urgent Deadline", "normal")}
                disabled={isLoading}
                className="p-3 text-center rounded-2xl border border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all cursor-pointer text-xs font-extrabold text-indigo-900"
              >
                ⏰ Deadline warning
              </button>
              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Quick Win Review", "normal")}
                disabled={isLoading}
                className="p-3 text-center rounded-2xl border border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all cursor-pointer text-xs font-extrabold text-indigo-900"
              >
                ⚡ 2-Min Quick Wins
              </button>
            </div>
          </div>

          {/* Intense Mode Event Triggers */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
            <div>
              <span className="text-[9px] uppercase font-black text-red-500 tracking-wider block mb-0.5">Event Suite B (Behavior-Driven)</span>
              <h3 className="text-sm font-bold text-slate-800">Intense Context Interceptions</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Simulate context triggers (e.g. social media, idle, music activity) that trigger persuasive, adaptive interventions.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Instagram Opened", "intense", "Instagram")}
                disabled={isLoading}
                className="p-3 rounded-2xl border border-red-50 bg-red-50/20 hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all cursor-pointer text-center"
              >
                <div className="text-[10px] text-slate-400 font-extrabold">📱 INSTAGRAM</div>
                <div className="text-[11px] font-bold text-red-950 mt-1">IG Intercept</div>
              </button>

              <button
                type="button"
                onClick={() => triggerNotificationSimulation("YouTube Opened", "intense", "YouTube")}
                disabled={isLoading}
                className="p-3 rounded-2xl border border-red-50 bg-red-50/20 hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all cursor-pointer text-center"
              >
                <div className="text-[10px] text-slate-400 font-extrabold">📺 YOUTUBE</div>
                <div className="text-[11px] font-bold text-red-950 mt-1">YouTube Swap</div>
              </button>

              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Screen Idle Warning", "intense")}
                disabled={isLoading}
                className="p-3 rounded-2xl border border-red-50 bg-red-50/20 hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all cursor-pointer text-center"
              >
                <div className="text-[10px] text-slate-400 font-extrabold">🖥️ IDLE &gt; 15m</div>
                <div className="text-[11px] font-bold text-red-950 mt-1">Idle alert</div>
              </button>

              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Spotify music connected", "intense", "Spotify")}
                disabled={isLoading}
                className="p-3 rounded-2xl border border-red-50 bg-red-50/20 hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all cursor-pointer text-center"
              >
                <div className="text-[10px] text-slate-400 font-extrabold">🎵 MUSIC SPARK</div>
                <div className="text-[11px] font-bold text-red-950 mt-1">Spotify flow</div>
              </button>

              <button
                type="button"
                onClick={() => triggerNotificationSimulation("Missed calendar work block", "intense")}
                disabled={isLoading}
                className="p-3 rounded-2xl border border-red-50 bg-red-50/20 hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all cursor-pointer text-center"
              >
                <div className="text-[10px] text-slate-400 font-extrabold">🚨 MISSED BLOCK</div>
                <div className="text-[11px] font-bold text-red-950 mt-1">Assertive Swap</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Notification Push Intercept Popup */}
      {activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div 
            id="intervention-popup"
            className={`w-full max-w-sm bg-white rounded-[2rem] p-6 border shadow-2xl space-y-5 animate-fadeIn ${
              activeNotification.eventType === "intense" ? "border-red-200" : "border-indigo-100"
            }`}
          >
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${
                  activeNotification.eventType === "intense" 
                    ? "bg-red-50 text-red-600 border-red-100" 
                    : "bg-indigo-50 text-indigo-600 border-indigo-100"
                }`}>
                  {activeNotification.eventType === "intense" ? (
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold block ${
                    activeNotification.eventType === "intense" ? "text-red-500" : "text-indigo-500"
                  }`}>
                    {activeNotification.eventType === "intense" ? "PIKO Intense Intervention" : "PIKO Calendar Check-In"}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {activeNotification.eventType === "intense" ? "Behavior Trigger" : "Time-based Trigger"}
                  </span>
                </div>
              </div>
              
              {activeNotification.eventType === "normal" && (
                <button 
                  onClick={() => {
                    setActiveNotification(null);
                    setSelectedApp(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer border-none bg-transparent"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* Notification content */}
            <div className="space-y-3.5">
              <p className="text-xs font-bold leading-relaxed text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/50 italic">
                "{activeNotification.message}"
              </p>
              
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Next Step: "{activeNotification.subtaskTitle}" ({activeNotification.estimatedTime}m)</span>
              </div>
            </div>

            {/* Commitment Blocker Inputs for Intense Mode */}
            {activeNotification.eventType === "intense" && (
              <div className="space-y-2.5 p-3.5 bg-red-50/50 border border-red-100 rounded-2xl animate-fadeIn">
                <div className="flex items-center space-x-1 text-[10px] text-red-600 font-black uppercase tracking-wider">
                  <span className="animate-pulse">🔒</span>
                  <span>Intense Commitment Required</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Time</label>
                    <input
                      type="text"
                      placeholder="e.g., 2:30 PM"
                      value={simTime}
                      onChange={(e) => setSimTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-red-500 font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Place</label>
                    <input
                      type="text"
                      placeholder="e.g., Study Desk"
                      value={simPlace}
                      onChange={(e) => setSimPlace(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-red-500 font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                id="intervention-start-now"
                onClick={handleStartNow}
                className={`w-full py-3.5 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 hover:bg-opacity-90 transition-all cursor-pointer shadow-sm border-none ${
                  activeNotification.eventType === "intense" ? "bg-red-600" : "bg-indigo-600"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Start Now (+100 XP)</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="intervention-postpone"
                  onClick={handlePostpone}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer border-none"
                >
                  {activeNotification.eventType === "intense" && ignoreCount >= 1 ? "🔊 VOICE INTERVENE" : "Later (10 mins)"}
                </button>
                <button
                  id="intervention-schedule"
                  onClick={handleScheduleBlock}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer border-none"
                >
                  Schedule Block
                </button>
              </div>
            </div>

            {/* Escalation Warning status */}
            {activeNotification.eventType === "intense" && (
              <div className="text-[10px] text-red-500 font-bold leading-snug flex items-center space-x-1 justify-center bg-red-50 p-2.5 rounded-xl border border-red-100/50">
                <span>⚠️ Ignore count: {ignoreCount}/2 • Postponing triggers persistent voice intervention</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proactive Intervention Logs */}
      <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
            <Bell className="w-4 h-4 mr-1.5 text-slate-300" />
            Intervention Feed & Log History
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{logs.length} events logged</span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold">
            Log stream clear. Trigger any simulation event above to start tracking logs.
          </div>
        ) : (
          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {logs.map((log) => {
              const isIntense = log.type === "intense";
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between text-xs transition-colors bg-white ${
                    isIntense ? "bg-red-50/20 border-red-100/40" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="space-y-1.5 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                        isIntense ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-600"
                      }`}>
                        {isIntense ? "INTENSE" : "GENTLE"}
                      </span>
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 leading-snug font-semibold">
                      Triggered <strong className="text-slate-800">{log.distractionApp}</strong>: "{log.message}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
