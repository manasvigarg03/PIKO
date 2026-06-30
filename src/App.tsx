import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import PlannerTab from "./components/PlannerTab";
import CalendarTab from "./components/CalendarTab";
import FocusTab from "./components/FocusTab";
import TasksTab from "./components/TasksTab";
import GrowthTab from "./components/GrowthTab";
import SettingsModal from "./components/SettingsModal";
import CelebrationModal from "./components/CelebrationModal";
import NotificationCenter from "./components/NotificationCenter";
import { Task, CalendarEvent, CommunityPost, AccountabilityGroup, Integration, NotificationLog, Subtask, Goal, Habit } from "./types";
import { 
  INITIAL_TASKS, 
  INITIAL_CALENDAR_EVENTS, 
  INITIAL_COMMUNITY_POSTS, 
  INITIAL_ACCOUNTABILITY_GROUPS, 
  INITIAL_INTEGRATIONS 
} from "./data";
import { Sparkles, Calendar, Target, CheckSquare, Users, AlertTriangle, ShieldCheck, MessageSquare, Clock, ShieldAlert, Volume2, MapPin, ExternalLink, Lock, Bell } from "lucide-react";

// Helper to resolve task category type to specific learning portals
const getTaskRedirectUrl = (title: string): string => {
  const lowercase = title.toLowerCase();
  if (lowercase.includes("database") || lowercase.includes("homework") || lowercase.includes("math") || lowercase.includes("assignment") || lowercase.includes("ques")) {
    return "https://classroom.google.com";
  }
  if (lowercase.includes("essay") || lowercase.includes("paper") || lowercase.includes("write") || lowercase.includes("draft") || lowercase.includes("reading")) {
    return "https://docs.google.com";
  }
  if (lowercase.includes("code") || lowercase.includes("git") || lowercase.includes("react") || lowercase.includes("api") || lowercase.includes("programming")) {
    return "https://github.com";
  }
  if (lowercase.includes("email") || lowercase.includes("inbox") || lowercase.includes("message") || lowercase.includes("reply")) {
    return "https://mail.google.com";
  }
  if (lowercase.includes("meeting") || lowercase.includes("zoom") || lowercase.includes("schedule") || lowercase.includes("appointment")) {
    return "https://calendar.google.com";
  }
  return "https://classroom.google.com";
};

// Parse standard and 24-hour time strings (e.g. "2:30 PM", "14:30", "09:00 AM") to {hours, minutes}
const parseTimeString = (timeStr: string) => {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)?$/);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3];

  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
};

// Deduplicate calendar events by associatedTaskId, keeping only the latest one given by the user
const deduplicateCalendarEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const seenTaskIds = new Set<string>();
  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (event.associatedTaskId) {
      if (seenTaskIds.has(event.associatedTaskId)) {
        continue;
      }
      seenTaskIds.add(event.associatedTaskId);
    }
    result.push(event);
  }
  return result;
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"planner" | "calendar" | "focus" | "tasks" | "growth">("planner");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Core State (initialized with LocalStorage fallbacks for full offline durability)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("piko_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("piko_calendar_events");
    const parsed = saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
    return deduplicateCalendarEvents(parsed);
  });

  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem("piko_posts");
    return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
  });

  const [groups, setGroups] = useState<AccountabilityGroup[]>(() => {
    const saved = localStorage.getItem("piko_groups");
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTABILITY_GROUPS;
  });

  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    const saved = localStorage.getItem("piko_integrations");
    return saved ? JSON.parse(saved) : INITIAL_INTEGRATIONS;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem("piko_notification_logs");
    return saved ? JSON.parse(saved) : [];
  });

  // Productivity stats
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem("piko_xp");
    return saved ? parseInt(saved) : 340;
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("piko_streak");
    return saved ? parseInt(saved) : 5;
  });

  const [timeSaved, setTimeSaved] = useState<number>(() => {
    const saved = localStorage.getItem("piko_time_saved");
    return saved ? parseInt(saved) : 25;
  });

  const [mode, setMode] = useState<"normal" | "intense">(() => {
    const saved = localStorage.getItem("piko_mode");
    return saved ? (saved as "normal" | "intense") : "normal";
  });

  const [normalInterval, setNormalInterval] = useState<number>(() => {
    const saved = localStorage.getItem("piko_normal_interval");
    return saved ? parseInt(saved) : 30;
  });

  // Goals, Habits & Voice Setting state
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("piko_goals");
    return saved ? JSON.parse(saved) : [
      {
        id: "goal-1",
        title: "Master Advanced TypeScript",
        targetDate: "2026-07-15",
        completed: false,
        recommendedHabits: ["Practice 15m coding", "Read TS playground examples", "Review daily error logs"]
      }
    ];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("piko_habits");
    return saved ? JSON.parse(saved) : [
      {
        id: "habit-1",
        goalId: "goal-1",
        title: "Practice TS coding",
        frequency: "daily",
        completedDates: [],
        reminderTime: "08:00 AM",
        reminderEnabled: true
      },
      {
        id: "habit-2",
        goalId: "goal-1",
        title: "Review daily errors",
        frequency: "weekdays",
        completedDates: [],
        reminderTime: "09:00 AM",
        reminderEnabled: false
      }
    ];
  });

  const [voiceRemindersDisabled, setVoiceRemindersDisabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("piko_voice_reminders_disabled");
    return saved === "true";
  });

  // Proactive timed reminders state
  const [activeTimedReminder, setActiveTimedReminder] = useState<{
    id: string;
    task: Task;
    message: string;
    mode: "normal" | "intense";
    redirectUrl?: string;
  } | null>(null);

  const sentRemindersRef = React.useRef<Record<string, { fiveMinSent?: boolean; dueSent?: boolean }>>({});
  const taskReminderTriggerCountRef = React.useRef<Record<string, number>>({});

  const [proposedTime, setProposedTime] = useState<string>("");
  const [proposedLocation, setProposedLocation] = useState<string>("");

  // Focus selection state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);

  // SMS-style custom text message notifications state
  interface TextMessage {
    id: string;
    sender: string;
    avatar?: string;
    message: string;
    type: "success" | "info" | "warning" | "coach" | "growth";
  }

  const [textMessages, setTextMessages] = useState<TextMessage[]>([]);

  const addTextNotification = (
    message: string, 
    sender: string = "Piko Coach", 
    type: "success" | "info" | "warning" | "coach" | "growth" = "coach",
    avatar?: string
  ) => {
    const id = `msg-${Date.now()}`;
    const defaultAvatars: Record<string, string> = {
      "Piko Coach": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      "Focus Sphere": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=80&auto=format&fit=crop&q=80",
      "Focus Protector": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=80&auto=format&fit=crop&q=80",
      "Tasks System": "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=80&auto=format&fit=crop&q=80",
      "Accountability Guild": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=80&auto=format&fit=crop&q=80",
      "Alex Chen": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80",
      "Sarah Jenkins": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
    };
    const nextAvatar = avatar || defaultAvatars[sender] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80";
    
    setTextMessages((prev) => [...prev, { id, sender, message, type, avatar: nextAvatar }]);
    setTimeout(() => {
      setTextMessages((prev) => prev.filter((m) => m.id !== id));
    }, 4500);
  };

  const addToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    let sender = "Piko Coach";
    let notifType: "success" | "info" | "warning" | "coach" | "growth" = "coach";
    
    if (type === "warning") notifType = "warning";
    else if (type === "success") notifType = "success";

    if (message.includes("Joined") || message.includes("Left") || message.includes("cheer")) {
      sender = "Accountability Guild";
      notifType = "growth";
    } else if (message.includes("Focus session") || message.includes("workspace") || message.includes("Timer") || message.includes("Focusing")) {
      sender = "Focus Sphere";
    } else if (message.includes("Task") || message.includes("Quick Win") || message.includes("Step")) {
      sender = "Tasks System";
    }

    addTextNotification(message, sender, notifType);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("piko_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("piko_calendar_events", JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem("piko_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("piko_groups", JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem("piko_integrations", JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    localStorage.setItem("piko_notification_logs", JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem("piko_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("piko_streak", streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem("piko_time_saved", timeSaved.toString());
  }, [timeSaved]);

  useEffect(() => {
    localStorage.setItem("piko_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("piko_normal_interval", normalInterval.toString());
  }, [normalInterval]);

  useEffect(() => {
    localStorage.setItem("piko_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("piko_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("piko_voice_reminders_disabled", voiceRemindersDisabled.toString());
  }, [voiceRemindersDisabled]);

  // Helper to parse due date/time
  const getTaskDueDateTime = (task: Task, eventsList: CalendarEvent[]): Date | null => {
    const assocEvent = eventsList.find(ev => ev.associatedTaskId === task.id);
    const dateStr = assocEvent?.date || task.dueDate;
    if (!dateStr) return null;
    const timeStr = assocEvent?.time || "10:00 AM"; // Default to 10 AM if no event is found

    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return new Date(year, month - 1, day, 10, 0, 0);
      let [_, hoursStr, minutesStr, ampm] = match;
      let hours = parseInt(hoursStr, 10);
      let minutes = parseInt(minutesStr, 10);
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch (e) {
      return null;
    }
  };

  // Proactive background reminders (Normal Mode)
  useEffect(() => {
    const isIntense = mode === "intense";
    if (isIntense) return; // No periodic background reminders in Intense Mode!

    const checkReminders = () => {
      const now = new Date();

      // --- NORMAL MODE REMINDERS ---
      // Frequency: just send a reminder 5 mins before when the task is due and at the time when the task is due.
      tasks.forEach(task => {
        if (task.completed) return;
        const dueTime = getTaskDueDateTime(task, calendarEvents);
        if (!dueTime) return;

        const diffMins = (dueTime.getTime() - now.getTime()) / 60000;

        // Check if due in 5 minutes (diffMins between 4.0 and 5.0)
        if (diffMins > 4.0 && diffMins <= 5.0) {
          if (!sentRemindersRef.current[task.id]?.fiveMinSent) {
            if (!sentRemindersRef.current[task.id]) {
              sentRemindersRef.current[task.id] = {};
            }
            sentRemindersRef.current[task.id].fiveMinSent = true;

            let message = "";
            if (task.isQuickWin || task.duration <= 2) {
              message = `Got 2 mins? Starting this task will only take 2 mins so lets goo! Let's complete: "${task.title}"`;
            } else {
              const firstSub = task.subtasks?.find(s => !s.completed);
              if (firstSub) {
                message = `Upcoming Task: "${task.title}" is due in 5 minutes. Let's tackle the first remaining subtask "${firstSub.title}" to stay ahead!`;
              } else {
                message = `Upcoming Task: "${task.title}" is due in 5 minutes. Let's start working on it!`;
              }
            }

            setActiveTimedReminder({
              id: `reminder-${Date.now()}`,
              task,
              message,
              mode: "normal",
              redirectUrl: getTaskRedirectUrl(task.title)
            });
            addToast(`Upcoming Task Check-In: "${task.title}" is due in 5 mins!`, "info");
          }
        }

        // Check if due right now (diffMins between -1.0 and 0.2)
        if (diffMins > -1.0 && diffMins <= 0.2) {
          if (!sentRemindersRef.current[task.id]?.dueSent) {
            if (!sentRemindersRef.current[task.id]) {
              sentRemindersRef.current[task.id] = {};
            }
            sentRemindersRef.current[task.id].dueSent = true;

            let message = "";
            if (task.isQuickWin || task.duration <= 2) {
              message = `Got 2 mins? Starting this task will only take 2 mins so lets goo! Let's complete: "${task.title}"`;
            } else {
              const firstSub = task.subtasks?.find(s => !s.completed);
              if (firstSub) {
                message = `It's due time! Let's start with your first remaining subtask: "${firstSub.title}" for "${task.title}" now.`;
              } else {
                message = `It's time to work! Let's start working on "${task.title}" right now.`;
              }
            }

            setActiveTimedReminder({
              id: `reminder-${Date.now()}`,
              task,
              message,
              mode: "normal",
              redirectUrl: getTaskRedirectUrl(task.title)
            });
            addToast(`Task Check-In: "${task.title}" is due now! ⏰`, "success");
          }
        }
      });
    };

    // Run first check
    checkReminders();

    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [mode, tasks, calendarEvents, voiceRemindersDisabled]);

  // Periodic voice reminders for uncommitted Intense Mode popups
  useEffect(() => {
    if (!activeTimedReminder || activeTimedReminder.mode !== "intense") return;

    const speakAlert = () => {
      if (voiceRemindersDisabled) return;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = `Attention. This is when you scroll a lot. Let's complete one question from your assignment, ${activeTimedReminder.task.title}, so that you can have five minutes free tomorrow. Please set up a time and place for when you will start.`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    };

    // First speak
    speakAlert();

    const voiceInterval = setInterval(() => {
      speakAlert();
    }, 8500); // repeating voice reminders every 8.5 seconds until scheduled

    return () => {
      clearInterval(voiceInterval);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTimedReminder, voiceRemindersDisabled]);

  // Dynamic calculations
  const completedTasks = tasks.filter(t => t.completed).length;
  const joinedGroups = groups.filter(g => g.joined).length;
  const productivityScore = Math.min(100, Math.max(10, 60 + (completedTasks * 10) + (joinedGroups * 4)));

  // State manipulation handlers
  const handleEarnXP = (amount: number, timeSavedIncrement: number = 0) => {
    setXp((prev) => prev + amount);
    if (timeSavedIncrement > 0) {
      setTimeSaved((prev) => prev + timeSavedIncrement);
    }
  };

  // Click handler to open the task redirect URL and switch tab to Tasks
  const handleTimedReminderClick = (reminder: { task: Task; redirectUrl?: string }) => {
    if (reminder.redirectUrl) {
      window.open(reminder.redirectUrl, "_blank", "noopener,noreferrer");
    }
    setActiveTab("tasks");
    if (activeTimedReminder?.mode === "intense") {
      addToast(`Navigating to task. Please enter a time and place below to lock and dismiss this alert! 🔒`, "info");
    } else {
      setActiveTimedReminder(null);
      addToast(`Navigating to task "${reminder.task.title}". Redirection complete! 🚀`, "success");
    }
  };

  // Intense mode scheduler commitment handler (adds to Calendar, stops voice alerts, awards XP)
  const handleTimedReminderCommit = (time: string, location: string) => {
    if (!activeTimedReminder) return;

    if (activeTimedReminder.mode === "intense") {
      if (!time.trim() || !location.trim()) {
        addToast("🔒 INTENSE LOCK: You must enter both a time and a place to proceed!", "warning");
        return;
      }
    }

    const finalTime = time || "3:00 PM";
    const finalLocation = location || "Library";

    // Add a real event to the calendar
    const newEvent: CalendarEvent = {
      id: `cal-commit-${Date.now()}`,
      title: `Commitment: ${activeTimedReminder.task.title}`,
      type: "focus",
      date: new Date().toISOString().split("T")[0], // Today's date
      time: finalTime,
      duration: 30,
      completed: false,
      isWorkable: true,
      notes: `Location: ${finalLocation}. Set up under Piko intense anti-distraction scrolling shield.`,
      associatedTaskId: activeTimedReminder.task.id
    };

    setCalendarEvents((prev) => deduplicateCalendarEvents([newEvent, ...prev]));

    // Cancel Speech Synthesis voice
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Award bonus XP for committing
    handleEarnXP(50);
    
    // Clear states
    setActiveTimedReminder(null);
    setProposedTime("");
    setProposedLocation("");

    addToast(`Locked in! Scheduled "${activeTimedReminder.task.title}" for ${finalTime} at ${finalLocation}! 🔒 +50 XP!`, "success");
  };

  const handleCommitTask = (taskId: string, taskTitle: string, time: string, location: string) => {
    const finalTime = time || "3:00 PM";
    const finalLocation = location || "Library";

    const newEvent: CalendarEvent = {
      id: `cal-commit-${Date.now()}`,
      title: `Commitment: ${taskTitle}`,
      type: "focus",
      date: new Date().toISOString().split("T")[0], // Today's date
      time: finalTime,
      duration: 30,
      completed: false,
      isWorkable: true,
      notes: `Location: ${finalLocation}. Set up under Piko intense anti-distraction scrolling shield.`,
      associatedTaskId: taskId
    };

    setCalendarEvents((prev) => deduplicateCalendarEvents([newEvent, ...prev]));
    handleEarnXP(50);
  };

  // Check committed times for tasks and trigger redirection on time
  useEffect(() => {
    if (mode !== "intense") return;

    const checkRedirects = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split("T")[0];

      calendarEvents.forEach((event) => {
        if (event.completed || !event.associatedTaskId) return;

        // Ensure it's for today's date
        if (event.date !== todayStr) return;

        const parsed = parseTimeString(event.time);
        if (!parsed) return;

        // If the current hour and minute matches the scheduled event
        if (parsed.hours === currentHours && parsed.minutes === currentMinutes) {
          const redirectKey = `redirected_${event.id}_${currentHours}_${currentMinutes}`;
          const alreadyDone = sessionStorage.getItem(redirectKey);
          if (!alreadyDone) {
            sessionStorage.setItem(redirectKey, "true");

            const task = tasks.find(t => t.id === event.associatedTaskId);
            if (task) {
              addToast(`🕒 SCHEDULED TIME ARRIVED! Redirecting you to your committed task: "${task.title}" 🚀`, "success");
              
              const redirectUrl = getTaskRedirectUrl(task.title);
              if (redirectUrl) {
                window.open(redirectUrl, "_blank", "noopener,noreferrer");
              }

              // Switch to focus/tasks tab and load it
              handleLaunchFocusSession(task.id);
            }
          }
        }
      });
    };

    const timer = setInterval(checkRedirects, 15000); // Check every 15 seconds
    return () => clearInterval(timer);
  }, [mode, calendarEvents, tasks]);

  // Quick Wins: immediate tap-to-complete
  const handleCompleteQuickWin = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          handleEarnXP(t.xpReward, t.duration);
          addToast(`Quick Win cleared! +${t.xpReward} XP!`, "success");
          
          // Complete corresponding calendar event too if linked!
          setCalendarEvents(events => 
            events.map(ev => ev.associatedTaskId === id ? { ...ev, completed: true } : ev)
          );

          // Update active community commitments if any match
          setPosts(p => 
            p.map(post => {
              if (post.author === "You" && !post.completed) {
                return { ...post, completed: true };
              }
              return post;
            })
          );

          const updated = { ...t, completed: true, progress: 100 };
          setCompletedTaskForCelebration(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // Launch Focus mode from a Task
  const handleLaunchFocusSession = (taskId: string) => {
    setActiveTaskId(taskId);
    setActiveSubtaskId(null);
    setActiveTab("focus");
  };

  // Launch Focus mode from a Calendar Event
  const handleLaunchFocusSessionByEvent = (eventId: string) => {
    const event = calendarEvents.find((e) => e.id === eventId);
    if (!event) return;

    if (event.associatedTaskId) {
      setActiveTaskId(event.associatedTaskId);
    } else {
      const tempId = `temp-focus-${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title: event.title,
        description: event.notes || "Sprinted study target calendar block.",
        priority: "medium",
        xpReward: 100,
        duration: event.duration,
        progress: 0,
        isQuickWin: false,
        subtasks: [
          { id: `${tempId}-sub-1`, title: "Initiate session target", estimatedTime: event.duration, xpReward: 50, completed: false }
        ],
        completed: false
      };
      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(tempId);
    }

    setActiveSubtaskId(null);
    setActiveTab("focus");
    addToast(`Focus session loaded for: "${event.title}"`, "success");
  };

  // Mark subtask as complete
  const handleCompleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          let earnedXP = 0;
          const updatedSubtasks = task.subtasks.map((sub) => {
            if (sub.id === subtaskId) {
              const nextState = !sub.completed;
              if (nextState) {
                earnedXP = sub.xpReward;
                handleEarnXP(sub.xpReward, sub.estimatedTime);
                addToast(`Step cleared: "${sub.title}"! +${sub.xpReward} XP!`, "success");
              } else {
                setXp((p) => Math.max(0, p - sub.xpReward));
              }
              return { ...sub, completed: nextState };
            }
            return sub;
          });

          const completedCount = updatedSubtasks.filter((s) => s.completed).length;
          const totalCount = updatedSubtasks.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isFullyCompleted = progress === 100;

          const updatedTask = {
            ...task,
            subtasks: updatedSubtasks,
            progress,
            completed: isFullyCompleted
          };

          if (isFullyCompleted && !task.completed) {
            handleEarnXP(25, 2);
            addToast(`Outstanding! Entire Task "${task.title}" completed! +25 XP Bonus! 🏆`, "success");
            setCompletedTaskForCelebration(updatedTask);
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  // Direct completion of larger tasks
  const handleCompleteTaskDirectly = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const uncompleted = task.subtasks.filter((s) => !s.completed);
          const remainingXP = uncompleted.reduce((acc, s) => acc + s.xpReward, 0);
          const totalReward = remainingXP + task.xpReward;

          handleEarnXP(totalReward, task.duration);
          addToast(`Task completed! Cleared all subtasks. +${totalReward} XP! 🏆`, "success");

          const updated = {
            ...task,
            completed: true,
            progress: 100,
            subtasks: task.subtasks.map((s) => ({ ...s, completed: true }))
          };
          setCompletedTaskForCelebration(updated);
          return updated;
        }
        return task;
      })
    );
  };

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => {
      const list = [newTask, ...prev];
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return [...list].sort((a, b) => (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2));
    });

    // Sync to personalized calendar
    const newCalEvent: CalendarEvent = {
      id: `cal-task-${newTask.id}`,
      title: `Focus: ${newTask.title}`,
      type: "focus",
      date: newTask.dueDate || new Date().toISOString().split("T")[0],
      time: "09:00 AM",
      duration: newTask.duration || 30,
      completed: false,
      isWorkable: true,
      notes: newTask.description || `Focus session synced from tasks list. Priority: ${newTask.priority}`,
      associatedTaskId: newTask.id
    };
    setCalendarEvents((prev) => deduplicateCalendarEvents([newCalEvent, ...prev]));
    addToast(`Task synced to personalized calendar! 📅`, "success");
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setActiveSubtaskId(null);
    }
    addToast("Task deleted.", "info");
  };

  // Goals & Habits Handlers
  const handleAddGoal = async (title: string, targetDate: string) => {
    const newGoalId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      id: newGoalId,
      title,
      targetDate,
      completed: false,
      recommendedHabits: []
    };

    setGoals((prev) => [newGoal, ...prev]);

    // Sync to personalized calendar
    const newCalEvent: CalendarEvent = {
      id: `cal-goal-${newGoalId}`,
      title: `🎯 Goal: ${title}`,
      type: "focus",
      date: targetDate,
      time: "09:00 AM",
      duration: 60,
      completed: false,
      isWorkable: false,
      notes: `Target completion date for your goal: "${title}".`
    };
    setCalendarEvents((prev) => [newCalEvent, ...prev]);

    addToast(`Goal synced to personalized calendar! 📅`, "success");

    // Fetch recommendations from backend
    try {
      const response = await fetch("/api/gemini/recommend-habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle: title })
      });
      const data = await response.json();
      if (data.habits && Array.isArray(data.habits)) {
        setGoals((prev) => prev.map(g => g.id === newGoalId ? { ...g, recommendedHabits: data.habits } : g));
        
        // Auto-add recommended habits linked to this goal
        const autoHabits: Habit[] = data.habits.map((hTitle: string, idx: number) => ({
          id: `habit-${Date.now()}-${idx}`,
          goalId: newGoalId,
          title: hTitle,
          frequency: "daily",
          completedDates: [],
          reminderTime: "08:00 AM",
          reminderEnabled: true
        }));
        setHabits((prev) => [...autoHabits, ...prev]);
        addToast(`Gemini recommended 3 micro-habits! 💡`, "success");
      }
    } catch (err) {
      console.error("Failed to recommend habits via API:", err);
    }
  };

  const handleAddHabit = (title: string, frequency: "daily" | "weekly" | "weekdays" | "custom", goalId?: string) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      goalId,
      title,
      frequency,
      completedDates: [],
      reminderTime: "08:00 AM",
      reminderEnabled: true
    };
    setHabits((prev) => [newHabit, ...prev]);
    addToast(`Habit "${title}" added!`, "success");
  };

  const handleToggleHabit = (id: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const alreadyDone = h.completedDates.includes(todayStr);
          let newDates = [];
          if (alreadyDone) {
            newDates = h.completedDates.filter((d) => d !== todayStr);
            addToast(`Habit incomplete.`, "info");
          } else {
            newDates = [...h.completedDates, todayStr];
            handleEarnXP(10);
            addToast(`Habit completed! +10 XP! 🌟`, "success");
          }
          return { ...h, completedDates: newDates };
        }
        return h;
      })
    );
  };

  const handleDeleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    addToast("Habit deleted.", "info");
  };

  const handleChangeHabitFrequency = (id: string, frequency: "daily" | "weekly" | "weekdays" | "custom") => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, frequency } : h))
    );
    addToast(`Frequency updated to ${frequency}.`, "success");
  };

  const handleToggleHabitReminder = (id: string, reminderTime?: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const enabled = !h.reminderEnabled;
          return {
            ...h,
            reminderEnabled: enabled,
            reminderTime: reminderTime || h.reminderTime || "08:00 AM"
          };
        }
        return h;
      })
    );
    addToast("Reminder settings updated.", "success");
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== `cal-goal-${id}`));
    setHabits((prev) =>
      prev.map((h) => (h.goalId === id ? { ...h, goalId: undefined } : h))
    );
    addToast("Goal removed.", "info");
  };

  const handleAddEvent = (eventData: Omit<CalendarEvent, "id" | "completed">) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      completed: false
    };
    setCalendarEvents((prev) => deduplicateCalendarEvents([newEvent, ...prev]));
  };

  const handleAddPost = (commitment: string) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      author: "You",
      avatar: "",
      commitment,
      timeAgo: "Just now",
      cheersCount: 0,
      hasCheered: false,
      reactions: [],
      completed: false,
      comments: []
    };
    setPosts((prev) => [newPost, ...prev]);
    handleEarnXP(50);
  };

  const handleCheerPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextCheered = !p.hasCheered;
          return {
            ...p,
            hasCheered: nextCheered,
            cheersCount: nextCheered ? p.cheersCount + 1 : Math.max(0, p.cheersCount - 1)
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `comm-${Date.now()}`,
                author: "You",
                text,
                timeAgo: "Just now"
              }
            ]
          };
        }
        return p;
      })
    );
  };

  const handleAddReaction = (postId: string, emoji: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const exists = p.reactions.includes(emoji);
          const nextReactions = exists 
            ? p.reactions.filter((r) => r !== emoji)
            : [...p.reactions, emoji];
          return { ...p, reactions: nextReactions };
        }
        return p;
      })
    );
  };

  const handleToggleGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextJoined = !g.joined;
          if (nextJoined) {
            handleEarnXP(50);
            addToast(`Joined ${g.name}! +50 XP and accountability active.`, "success");
          } else {
            addToast(`Left ${g.name}.`, "info");
          }
          return { ...g, joined: nextJoined };
        }
        return g;
      })
    );
  };

  const handleToggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const nextConnected = !i.connected;
          addToast(
            nextConnected 
              ? `${i.name} connected successfully.` 
              : `${i.name} disconnected.`,
            nextConnected ? "success" : "info"
          );
          return { ...i, connected: nextConnected };
        }
        return i;
      })
    );
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    setNotificationLogs((prev) => [log, ...prev]);
  };

  const handleTriggerNormalPreview = () => {
    const task = tasks.find(t => !t.completed) || {
      id: "task-temp-preview",
      title: "Complete Advanced Calculus Assignment",
      description: "Auto-generated preview task",
      priority: "high" as const,
      dueDate: "2026-06-30",
      completed: false,
      duration: 45,
      progress: 33,
      xpReward: 120,
      isQuickWin: false,
      subtasks: [
        { id: "sub-1", title: "Review double integrals & polar coordinates", completed: false, estimatedTime: 15, xpReward: 30 },
        { id: "sub-2", title: "Solve practice problems in Chapter 14", completed: false, estimatedTime: 15, xpReward: 30 },
        { id: "sub-3", title: "Submit response sheet on blackboard portal", completed: false, estimatedTime: 15, xpReward: 30 }
      ]
    };
    
    const firstSub = task.subtasks?.find(s => !s.completed)?.title || "your next subtask";
    setActiveTimedReminder({
      id: `reminder-preview-normal-${Date.now()}`,
      task,
      message: `Upcoming Task: "${task.title}" is due in 5 minutes. Let's tackle the first remaining subtask "${firstSub}" to stay ahead!`,
      mode: "normal",
      redirectUrl: `/tasks?title=${encodeURIComponent(task.title)}`
    });
    addToast("Normal Mode reminder preview triggered! 🔔", "success");
  };

  const handleTriggerIntensePreview = () => {
    const task = tasks.find(t => !t.completed) || {
      id: "task-temp-preview",
      title: "Complete Advanced Calculus Assignment",
      description: "Auto-generated preview task",
      priority: "high" as const,
      dueDate: "2026-06-30",
      completed: false,
      duration: 45,
      progress: 33,
      xpReward: 120,
      isQuickWin: false,
      subtasks: [
        { id: "sub-1", title: "Review double integrals & polar coordinates", completed: false, estimatedTime: 15, xpReward: 30 },
        { id: "sub-2", title: "Solve practice problems in Chapter 14", completed: false, estimatedTime: 15, xpReward: 30 },
        { id: "sub-3", title: "Submit response sheet on blackboard portal", completed: false, estimatedTime: 15, xpReward: 30 }
      ]
    };
    const firstSub = task.subtasks?.find(s => !s.completed)?.title || "your next subtask";
    setActiveTimedReminder({
      id: `reminder-preview-intense-${Date.now()}`,
      task,
      message: `You're opening YouTube. You can start on your first remaining subtask: "${firstSub}" rather than opening YouTube! Starting this task will only take 2 mins so lets goo!`,
      mode: "intense",
      redirectUrl: `/tasks?title=${encodeURIComponent(task.title)}`
    });
    
    if (!voiceRemindersDisabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Attention. Coach intervention. You opened YouTube. Before starting a video, did you know you can knock out your first subtask "${firstSub}" in just 2 minutes? Let's do that first!`);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
    
    addToast("Intense Mode intervention preview triggered! 🔥🔊", "success");
  };

  const handleAddSubtasksToTask = (taskId: string, subtaskDrafts: Omit<Subtask, "completed">[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSubs = subtaskDrafts.map((s, idx) => ({
            id: `sub-${taskId}-ai-${idx}-${Date.now()}`,
            title: s.title,
            estimatedTime: s.estimatedTime,
            xpReward: s.xpReward,
            completed: false
          }));

          const updatedSubs = [...t.subtasks, ...newSubs];
          const completedCount = updatedSubs.filter(s => s.completed).length;
          const totalDuration = updatedSubs.reduce((acc, s) => acc + s.estimatedTime, 0);
          const totalXP = updatedSubs.reduce((acc, s) => acc + s.xpReward, 0);
          const progress = updatedSubs.length > 0 ? Math.round((completedCount / updatedSubs.length) * 100) : 0;

          return {
            ...t,
            subtasks: updatedSubs,
            duration: totalDuration,
            xpReward: totalXP,
            progress
          };
        }
        return t;
      })
    );
  };

  const handleUpdateSubtask = (taskId: string, subtaskId: string, updatedFields: Partial<Subtask>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubs = t.subtasks.map((sub) => {
            if (sub.id === subtaskId) {
              const updatedSub = { ...sub, ...updatedFields };
              if (updatedFields.estimatedTime !== undefined) {
                // Ensure proportional XP reward updates (e.g. 2 * minutes)
                updatedSub.xpReward = updatedFields.estimatedTime * 2;
              }
              return updatedSub;
            }
            return sub;
          });

          const completedCount = updatedSubs.filter(s => s.completed).length;
          const totalDuration = updatedSubs.reduce((acc, s) => acc + s.estimatedTime, 0);
          const totalXP = updatedSubs.reduce((acc, s) => acc + s.xpReward, 0);
          const progress = updatedSubs.length > 0 ? Math.round((completedCount / updatedSubs.length) * 100) : 0;

          return {
            ...t,
            subtasks: updatedSubs,
            duration: totalDuration,
            xpReward: totalXP,
            progress
          };
        }
        return t;
      })
    );
    addToast("Subtask updated successfully!", "success");
  };

  const handleTabChange = (targetTab: "planner" | "calendar" | "focus" | "tasks" | "growth") => {
    if (focusSessionActive && targetTab !== "focus") {
      addToast("Focus Lock Active! Complete or pause your active Focus session to access other features.", "warning");
      return;
    }
    setActiveTab(targetTab);
  };

  const handleOpenSettings = () => {
    if (focusSessionActive) {
      addToast("Focus Lock is Active! No distractions or settings allowed.", "warning");
      return;
    }
    setSettingsOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F7F9] flex items-center justify-center font-sans p-0 md:p-4">
      
      {/* Phone emulator frame wrapper styled with Clean Minimalism */}
      <div 
        id="piko-applet"
        className="w-full max-w-md min-h-screen md:min-h-[850px] md:max-h-[900px] bg-[#F4F7F9] shadow-xl md:rounded-[2.5rem] overflow-hidden relative border border-slate-100 flex flex-col"
      >
        
        {/* SMS-style Text Message Notification Popup Layer */}
        <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none space-y-3">
          {textMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl p-3.5 flex items-start space-x-3 pointer-events-auto transition-all duration-300 transform translate-y-0 animate-slideDown max-w-sm mx-auto"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                {msg.avatar ? (
                  <img src={msg.avatar} alt="Sender" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-extrabold uppercase">{msg.sender.substring(0, 2)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 tracking-tight uppercase">
                    {msg.sender}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">now</span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold mt-1 leading-snug">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Header & Status Bar */}
        <Header 
          onOpenSettings={handleOpenSettings}
          streak={streak}
          xp={xp}
          mode={mode}
          tasks={tasks}
          calendarEvents={calendarEvents}
        />

        {/* Active tab content view */}
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-24">
          {activeTab === "planner" && (
            <PlannerTab
              tasks={tasks}
              xpToday={xp - 340 > 0 ? xp - 340 : 0}
              streak={streak}
              timeSaved={timeSaved}
              productivityScore={productivityScore}
              goals={goals}
              habits={habits}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddHabit={handleAddHabit}
              onToggleHabit={handleToggleHabit}
              onDeleteHabit={handleDeleteHabit}
              onChangeHabitFrequency={handleChangeHabitFrequency}
              onToggleHabitReminder={handleToggleHabitReminder}
              onCompleteQuickWin={handleCompleteQuickWin}
              onLaunchFocusSession={handleLaunchFocusSession}
              onSwitchTab={handleTabChange}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarTab
              events={calendarEvents}
              onAddEvent={handleAddEvent}
              onLaunchFocusSessionByEvent={handleLaunchFocusSessionByEvent}
              addToast={addToast}
              integrations={integrations}
              onToggleIntegration={handleToggleIntegration}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === "focus" && (
            <FocusTab
              tasks={tasks}
              activeTaskId={activeTaskId}
              activeSubtaskId={activeSubtaskId}
              onSetFocusTask={(tId, sId) => {
                setActiveTaskId(tId);
                setActiveSubtaskId(sId);
              }}
              onCompleteSubtask={handleCompleteSubtask}
              onEarnXP={handleEarnXP}
              addToast={addToast}
              isRunning={focusSessionActive}
              onRunningChange={setFocusSessionActive}
            />
          )}

          {activeTab === "tasks" && (
            <TasksTab
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onCompleteSubtask={handleCompleteSubtask}
              onCompleteTaskDirectly={handleCompleteTaskDirectly}
              onLaunchFocusSession={handleLaunchFocusSession}
              onAddSubtasks={handleAddSubtasksToTask}
              onUpdateSubtask={handleUpdateSubtask}
              addToast={addToast}
              mode={mode}
            />
          )}

          {activeTab === "growth" && (
            <GrowthTab
              posts={posts}
              onAddPost={handleAddPost}
              onCheerPost={handleCheerPost}
              onAddComment={handleAddComment}
              onAddReaction={handleAddReaction}
              addToast={addToast}
            />
          )}
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-40 select-none">
          {/* Planner */}
          <button
            id="tab-planner"
            onClick={() => handleTabChange("planner")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors cursor-pointer ${
              activeTab === "planner" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Planner</span>
          </button>

          {/* Calendar */}
          <button
            id="tab-calendar"
            onClick={() => handleTabChange("calendar")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors cursor-pointer ${
              activeTab === "calendar" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Calendar</span>
          </button>

          {/* Focus */}
          <button
            id="tab-focus"
            onClick={() => handleTabChange("focus")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors cursor-pointer ${
              activeTab === "focus" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Target className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Focus</span>
          </button>

          {/* Tasks */}
          <button
            id="tab-tasks"
            onClick={() => handleTabChange("tasks")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors cursor-pointer ${
              activeTab === "tasks" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Tasks</span>
          </button>

          {/* Growth */}
          <button
            id="tab-growth"
            onClick={() => handleTabChange("growth")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors cursor-pointer ${
              activeTab === "growth" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Growth</span>
          </button>
        </div>

        {/* Global Control Center settings drawer modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          mode={mode}
          setMode={setMode}
          normalInterval={normalInterval}
          setNormalInterval={setNormalInterval}
          integrations={integrations}
          onToggleIntegration={handleToggleIntegration}
          addToast={addToast}
          voiceRemindersDisabled={voiceRemindersDisabled}
          setVoiceRemindersDisabled={setVoiceRemindersDisabled}
          onOpenSimulator={() => setNotificationsOpen(true)}
          onTriggerNormalPreview={handleTriggerNormalPreview}
          onTriggerIntensePreview={handleTriggerIntensePreview}
        />

        {/* Celebration Congratulations Modal popup */}
        {completedTaskForCelebration && (
          <CelebrationModal
            task={completedTaskForCelebration}
            onClose={() => setCompletedTaskForCelebration(null)}
          />
        )}

        {/* Proactive Timed Reminder Overlay (Normal vs Intense Mode) */}
        {activeTimedReminder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
            <div 
              className={`w-full max-w-md bg-white rounded-[2.5rem] p-6 border shadow-2xl space-y-5 relative transition-all ${
                activeTimedReminder.mode === "intense" ? "border-red-200 ring-4 ring-red-500/10" : "border-indigo-100"
              }`}
            >
              {/* Normal Dismiss button */}
              {activeTimedReminder.mode === "normal" && (
                <button
                  type="button"
                  onClick={() => setActiveTimedReminder(null)}
                  className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs font-bold border-none bg-transparent"
                >
                  Dismiss
                </button>
              )}

              {/* Icon & Title */}
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  activeTimedReminder.mode === "intense" ? "bg-red-50 text-red-600 border border-red-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                }`}>
                  {activeTimedReminder.mode === "intense" ? (
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      activeTimedReminder.mode === "intense" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {activeTimedReminder.mode === "intense" ? "Intense Mode Shield" : "Normal Mode Prompt"}
                    </span>
                    {activeTimedReminder.mode === "intense" && (
                      <span className="text-[9px] font-extrabold text-red-600 animate-pulse flex items-center">
                        <Volume2 className="w-3 h-3 mr-0.5" />
                        Voice Reminder Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">
                    {activeTimedReminder.mode === "intense" ? "Anti-Distraction Action Cues" : "Upcoming Agenda Check-In"}
                  </h3>
                </div>
              </div>

              {/* Notification Message content */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                  "{activeTimedReminder.message}"
                </p>
                
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-extrabold pt-1.5 border-t border-slate-200/50">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Estimated time: ~{activeTimedReminder.task.duration}m
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    activeTimedReminder.task.priority === "high" ? "bg-red-50 text-red-600 font-bold" : "bg-slate-100 text-slate-600 font-semibold"
                  }`}>
                    Priority: {activeTimedReminder.task.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Redirection / Action Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleTimedReminderClick(activeTimedReminder)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer border-none ${
                    activeTimedReminder.mode === "intense" 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>Open Related Task & Source Link</span>
                </button>
                {activeTimedReminder.redirectUrl && (
                  <p className="text-[10px] text-center text-slate-400 font-bold">
                    Target Portal: <span className="text-indigo-600 font-extrabold underline">{activeTimedReminder.redirectUrl}</span>
                  </p>
                )}
              </div>

              {/* Intense Mode Lockdown Form */}
              {activeTimedReminder.mode === "intense" ? (
                <div className="pt-3 border-t border-dashed border-red-100 space-y-3">
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100/50">
                    <p className="text-[10px] text-red-800 font-bold leading-normal flex items-center">
                      <Lock className="w-3.5 h-3.5 mr-1.5 text-red-600 shrink-0" />
                      Commitment Blocker Active: Set scheduling details to unlock this notification and quiet voice alerts.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        Proposed Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2:30 PM"
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-red-500 font-extrabold text-slate-700 placeholder-slate-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                        Proposed Place
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Study Desk"
                        value={proposedLocation}
                        onChange={(e) => setProposedLocation(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-red-500 font-extrabold text-slate-700 placeholder-slate-400 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTimedReminderCommit(proposedTime, proposedLocation)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider flex items-center justify-center space-x-1.5 border-none"
                  >
                    <span>🔒 Lock Commitment Schedule (+50 XP)</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTimedReminder(null)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                  >
                    Dismiss notification
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coach Simulator & Interventions Feed Drawer */}
        {notificationsOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-slate-50 h-full flex flex-col shadow-2xl overflow-hidden animate-slideLeft">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-100 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Piko Coach Simulator
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Manage & Trigger Context Interventions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all font-extrabold text-sm cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content wrapper */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <NotificationCenter
                  mode={mode}
                  tasks={tasks}
                  logs={notificationLogs}
                  onAddLog={(log) => setNotificationLogs((prev) => [log, ...prev])}
                  onLaunchFocusSession={handleLaunchFocusSession}
                  addToast={addToast}
                  voiceRemindersDisabled={voiceRemindersDisabled}
                  calendarEvents={calendarEvents}
                  onCommitTask={handleCommitTask}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
