import React, { useState } from "react";
import { CalendarEvent, Integration } from "../types";
import { 
  Plus, Clock, BookOpen, CreditCard, Video, Target, Dumbbell, 
  ChevronRight, Play, HelpCircle, FileText, ChevronLeft, Calendar as CalendarIcon,
  CheckCircle2, RefreshCw, Mail, Sparkles, Check, X, Link, ExternalLink, ArrowDownToLine
} from "lucide-react";

interface CalendarTabProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id" | "completed">) => void;
  onLaunchFocusSessionByEvent: (eventId: string) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
  integrations: Integration[];
  onToggleIntegration: (id: string) => void;
  onAddTask?: (task: any) => void;
}

export default function CalendarTab({
  events,
  onAddEvent,
  onLaunchFocusSessionByEvent,
  addToast,
  integrations,
  onToggleIntegration,
  onAddTask
}: CalendarTabProps) {
  // Today's date reference
  const todayStr = "2026-06-29";
  const today = new Date(todayStr);

  // Active view states
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("meeting");
  const [time, setTime] = useState("10:00 AM");
  const [eventDate, setEventDate] = useState(todayStr);
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  // Integrations Hub States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressMessage, setScanProgressMessage] = useState("");
  const [scannedEvents, setScannedEvents] = useState<any[]>([]);
  const [showIntegrationsHub, setShowIntegrationsHub] = useState(false);
  const [importedEvents, setImportedEvents] = useState<string[]>([]);

  const handleScanIntegrations = () => {
    const connectedList = integrations.filter(i => i.connected);
    if (connectedList.length === 0) {
      addToast("No connected accounts! Toggle integrations on first in the panel below.", "warning");
      return;
    }

    setIsScanning(true);
    setScannedEvents([]);
    
    const steps = [
      "Checking Secure OAuth tokens...",
      "Polling active Google Calendar API endpoints...",
      "Analyzing Gmail message headers and subject line query rules...",
      "Querying active Zoom video webinar lists...",
      "Accessing Google Pay automatic billing reminders...",
      "Finalizing synchronized external assets..."
    ];

    let currentStep = 0;
    setScanProgressMessage(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanProgressMessage(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        const detected: any[] = [];
        
        if (integrations.find(i => i.id === "gcal" && i.connected)) {
          detected.push({
            id: "scanned-gcal-1",
            title: "AI Research Sync",
            type: "meeting",
            date: "2026-06-29",
            time: "11:00 AM",
            duration: 60,
            notes: "Weekly project sync with Dr. Alvarez and AI development group.",
            isWorkable: true,
            service: "Google Calendar",
            icon: "Calendar"
          });
        }
        
        if (integrations.find(i => i.id === "gmail" && i.connected)) {
          detected.push({
            id: "scanned-gmail-1",
            title: "Physics Final Exam Confirmation",
            type: "exam",
            date: "2026-06-30",
            time: "09:00 AM",
            duration: 180,
            notes: "Room 402, Hall of Sciences. Remember to bring a non-programmable calculator.",
            isWorkable: true,
            service: "Gmail Integration",
            icon: "Mail"
          });
        }
        
        if (integrations.find(i => i.id === "zoom" && i.connected)) {
          detected.push({
            id: "scanned-zoom-1",
            title: "Compiler Construction Q&A Session",
            type: "meeting",
            date: "2026-06-29",
            time: "04:30 PM",
            duration: 45,
            notes: "Live online office hours. Meeting ID: 884-219-445",
            isWorkable: true,
            service: "Zoom",
            icon: "Video"
          });
        }
        
        if (integrations.find(i => i.id === "gpay" && i.connected)) {
          detected.push({
            id: "scanned-gpay-1",
            title: "Aesthetic Premium Subscription Reminder",
            type: "bill",
            date: "2026-06-29",
            time: "06:00 PM",
            duration: 15,
            notes: "Auto-recurring invoice from Aesthetic Corp. Billing ref: #GP-99120",
            isWorkable: false,
            service: "Google Pay",
            icon: "CreditCard"
          });
        }

        setScannedEvents(detected);
        setIsScanning(false);
        addToast(`Scan complete! Auto-detected ${detected.length} upcoming events.`, "success");
      }
    }, 450);
  };

  const handleImportScannedEvent = (ev: any) => {
    onAddEvent({
      title: ev.title,
      type: ev.type,
      date: ev.date,
      time: ev.time,
      duration: ev.duration,
      isWorkable: ev.isWorkable,
      notes: `${ev.notes} (Imported from ${ev.service})`
    });
    setImportedEvents(prev => [...prev, ev.id]);
    addToast(`Successfully imported "${ev.title}" into your local schedule!`, "success");
  };

  const handleImportAllEvents = () => {
    const unimported = scannedEvents.filter(ev => !importedEvents.includes(ev.id));
    if (unimported.length === 0) {
      addToast("All scanned events are already imported!", "info");
      return;
    }
    unimported.forEach(ev => {
      onAddEvent({
        title: ev.title,
        type: ev.type,
        date: ev.date,
        time: ev.time,
        duration: ev.duration,
        isWorkable: ev.isWorkable,
        notes: `${ev.notes} (Imported from ${ev.service})`
      });
    });
    setImportedEvents(prev => [...prev, ...unimported.map(ev => ev.id)]);
    addToast(`Successfully imported ${unimported.length} events into your local schedule!`, "success");
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate.trim() || !time.trim()) {
      addToast("Please fill in title, date, and scheduled time.", "warning");
      return;
    }

    onAddEvent({
      title: title.trim(),
      type,
      date: eventDate,
      time: time.trim(),
      duration: parseInt(duration) || 30,
      isWorkable: type !== "bill" && type !== "gym",
      notes: notes.trim() || undefined
    });

    setTitle("");
    setNotes("");
    setTime("10:00 AM");
    setDuration("30");
    setShowAddForm(false);
    addToast(`Scheduled: "${title}" for ${eventDate}`, "success");
  };

  const eventConfig: Record<CalendarEvent["type"], { icon: React.ReactNode; color: string; label: string; dotColor: string }> = {
    assignment: {
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      color: "bg-blue-50 text-blue-700 border-blue-100/50",
      dotColor: "bg-blue-500",
      label: "📚 Assignment"
    },
    bill: {
      icon: <CreditCard className="w-4 h-4 text-amber-500" />,
      color: "bg-amber-50 text-amber-700 border-amber-100/50",
      dotColor: "bg-amber-500",
      label: "💰 Bill Reminder"
    },
    meeting: {
      icon: <Video className="w-4 h-4 text-emerald-500" />,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
      dotColor: "bg-emerald-500",
      label: "📅 Meeting"
    },
    focus: {
      icon: <Target className="w-4 h-4 text-indigo-500" />,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100/50",
      dotColor: "bg-indigo-500",
      label: "🎯 Focus Block"
    },
    gym: {
      icon: <Dumbbell className="w-4 h-4 text-slate-500" />,
      color: "bg-slate-100 text-slate-700 border-slate-200/50",
      dotColor: "bg-slate-500",
      label: "🏋 Gym Session"
    },
    exam: {
      icon: <FileText className="w-4 h-4 text-red-500" />,
      color: "bg-red-50 text-red-700 border-red-100/50",
      dotColor: "bg-red-500",
      label: "📝 Exam Block"
    }
  };

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calendar Helper Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid arrays
  const daysArray: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

  // Prev month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const formattedMonth = (prevMonthIdx + 1).toString().padStart(2, "0");
    const formattedDay = prevDay.toString().padStart(2, "0");
    daysArray.push({
      day: prevDay,
      isCurrentMonth: false,
      dateStr: `${prevYear}-${formattedMonth}-${formattedDay}`
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const formattedMonth = (month + 1).toString().padStart(2, "0");
    const formattedDay = i.toString().padStart(2, "0");
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      dateStr: `${year}-${formattedMonth}-${formattedDay}`
    });
  }

  // Next month padding days
  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const formattedMonth = (nextMonthIdx + 1).toString().padStart(2, "0");
    const formattedDay = i.toString().padStart(2, "0");
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      dateStr: `${nextYear}-${formattedMonth}-${formattedDay}`
    });
  }

  // Filter events for the currently selected date
  const selectedDateEvents = events.filter(e => e.date === selectedDateStr);

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setEventDate(dateStr);
  };

  const getDayEvents = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      
      {/* Calendar Header with add manual event */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xs border border-slate-100 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider block mb-0.5">Time Organizer</span>
          <h2 className="text-base font-extrabold text-slate-800">Personalized Schedule</h2>
        </div>
        <button
          id="toggle-add-event-form"
          onClick={() => {
            setEventDate(selectedDateStr);
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Dynamic Integrations Hub & Sync Center */}
      <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <RefreshCw className={`w-4.5 h-4.5 ${isScanning ? "animate-spin text-indigo-500" : ""}`} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Connected Accounts & Auto-Sync</h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                Sync from {integrations.filter(i => i.connected).length} active third-party platforms
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowIntegrationsHub(!showIntegrationsHub)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>{showIntegrationsHub ? "Hide Hub" : "Manage Hub"}</span>
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${showIntegrationsHub ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Expanded Hub Controls */}
        {showIntegrationsHub && (
          <div className="space-y-4 pt-2 border-t border-slate-50 animate-fadeIn">
            {/* Integrations Switches Grid */}
            <div className="grid grid-cols-2 gap-3">
              {integrations.map((item) => {
                const isConnected = item.connected;
                return (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                      isConnected 
                        ? "bg-slate-50/50 border-slate-200" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${
                          item.id === "gcal" ? "bg-blue-50 text-blue-500" :
                          item.id === "gmail" ? "bg-red-50 text-red-500" :
                          item.id === "zoom" ? "bg-emerald-50 text-emerald-500" :
                          item.id === "gpay" ? "bg-amber-50 text-amber-500" : "bg-indigo-50 text-indigo-500"
                        }`}>
                          {item.id === "gcal" && <CalendarIcon className="w-3.5 h-3.5" />}
                          {item.id === "gmail" && <Mail className="w-3.5 h-3.5" />}
                          {item.id === "zoom" && <Video className="w-3.5 h-3.5" />}
                          {item.id === "gpay" && <CreditCard className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-700">{item.name}</span>
                      </div>
                      
                      {/* Connection Toggle */}
                      <button
                        onClick={() => onToggleIntegration(item.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          isConnected ? "bg-indigo-600 justify-end" : "bg-slate-200 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-xs animate-scaleIn" />
                      </button>
                    </div>
                    <p className="text-[9.5px] text-slate-400 mt-2 leading-relaxed">
                      {item.purpose}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Scan Action Button */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 space-y-3">
              <div className="text-center max-w-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Auto-Detect & Categorize Schedule</span>
                <p className="text-[9.5px] text-slate-400 font-medium">
                  Scan external calendar feeds, emails, bills, or classroom agendas and map them directly into playable Focus Blocks.
                </p>
              </div>

              {isScanning ? (
                <div className="w-full flex flex-col items-center justify-center py-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-700 animate-pulse">Running secure sync scan...</span>
                  </div>
                  <p className="text-[9.5px] text-indigo-600 font-mono font-bold max-w-xs text-center leading-snug">
                    {scanProgressMessage}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleScanIntegrations}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan & Detect External Events</span>
                </button>
              )}
            </div>

            {/* Scanned/Detected Events Display */}
            {scannedEvents.length > 0 && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>Detected Pending Events</span>
                  </h4>
                  {scannedEvents.some(ev => !importedEvents.includes(ev.id)) && (
                    <button
                      onClick={handleImportAllEvents}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowDownToLine className="w-2.5 h-2.5" />
                      <span>Import All</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {scannedEvents.map((ev) => {
                    const isImported = importedEvents.includes(ev.id);
                    return (
                      <div 
                        key={ev.id}
                        className={`p-3 rounded-2xl border flex items-start justify-between transition-all ${
                          isImported 
                            ? "bg-slate-50/50 border-slate-100 opacity-60" 
                            : "bg-white border-slate-100 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-xl mt-0.5 ${
                            ev.service === "Google Calendar" ? "bg-blue-50 text-blue-500" :
                            ev.service === "Gmail Integration" ? "bg-red-50 text-red-500" :
                            ev.service === "Zoom" ? "bg-emerald-50 text-emerald-500" :
                            "bg-amber-50 text-amber-500"
                          }`}>
                            {ev.icon === "Calendar" && <CalendarIcon className="w-3.5 h-3.5" />}
                            {ev.icon === "Mail" && <Mail className="w-3.5 h-3.5" />}
                            {ev.icon === "Video" && <Video className="w-3.5 h-3.5" />}
                            {ev.icon === "CreditCard" && <CreditCard className="w-3.5 h-3.5" />}
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] font-extrabold text-slate-800 leading-snug">
                                {ev.title}
                              </span>
                              <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                {ev.service}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed max-w-xs font-semibold">
                              {ev.notes}
                            </p>
                            <div className="flex items-center space-x-2 text-[9px] text-slate-500 font-semibold pt-1">
                              <span>Date: {ev.date}</span>
                              <span>•</span>
                              <span>Time: {ev.time} ({ev.duration} min)</span>
                            </div>
                          </div>
                        </div>

                        {isImported ? (
                          <div className="flex flex-col items-end space-y-1.5 shrink-0">
                            <div className="flex items-center space-x-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2.5 py-1.5 rounded-full">
                              <Check className="w-3 h-3" />
                              <span>Imported</span>
                            </div>
                            
                            {/* Option to create a dedicated prep task before the deadline! */}
                            {onAddTask && (ev.type === "exam" || ev.title.toLowerCase().includes("exam") || ev.title.toLowerCase().includes("assignment") || ev.notes?.toLowerCase().includes("exam") || ev.notes?.toLowerCase().includes("final")) && (
                              <button
                                onClick={() => {
                                  // Calculate prep date (1 day before the deadline)
                                  const prepDate = new Date(ev.date);
                                  prepDate.setDate(prepDate.getDate() - 1);
                                  const prepDateStr = prepDate.toISOString().split("T")[0];

                                  onAddTask({
                                    id: `task-prep-${Date.now()}`,
                                    title: `Prepare for ${ev.title}`,
                                    description: `Auto-generated preparation task for the upcoming deadline on ${ev.date}. Notes: ${ev.notes}`,
                                    priority: "high",
                                    dueDate: prepDateStr,
                                    completed: false,
                                    duration: 45,
                                    subtasks: [
                                      { id: `sub-${Date.now()}-1`, title: "Review past lectures & key formulas", completed: false, estimatedTime: 15 },
                                      { id: `sub-${Date.now()}-2`, title: "Solve at least 3 practice questions", completed: false, estimatedTime: 15 },
                                      { id: `sub-${Date.now()}-3`, title: "Organize cheat sheet or summary page", completed: false, estimatedTime: 15 }
                                    ]
                                  });
                                  addToast(`Created dedicated preparation task "Prepare for ${ev.title}" on ${prepDateStr}! 🚀`, "success");
                                }}
                                className="text-[9px] font-black uppercase text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 hover:border-amber-600 px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1"
                                title="Create prep task scheduled before the deadline"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-500 hover:text-white shrink-0" />
                                <span>Create Prep Task</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImportScannedEvent(ev)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 px-3 py-1.5 rounded-full transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Import</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proper Monthly Calendar Grid Card */}
      <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100 space-y-4">
        
        {/* Month Selector Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-extrabold text-slate-800">
              {monthNames[month]} {year}
            </span>
          </div>

          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1 font-sans">
              {d}
            </span>
          ))}
        </div>

        {/* Monthly Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            const dayEvents = getDayEvents(cell.dateStr);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`aspect-square relative rounded-xl flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer border ${
                  isSelected 
                    ? "bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-sm scale-[1.03] z-10" 
                    : isToday
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold"
                    : cell.isCurrentMonth
                    ? "bg-white border-transparent text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-100"
                    : "bg-slate-50/50 border-transparent text-slate-300 font-normal hover:bg-slate-100/50"
                }`}
              >
                {/* Day number */}
                <span className="text-[11px] leading-none">{cell.day}</span>

                {/* Event dots indicator */}
                {hasEvents && (
                  <div className="flex space-x-0.5 justify-center w-full overflow-hidden h-1 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const cfg = eventConfig[ev.type];
                      return (
                        <span 
                          key={ev.id} 
                          className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : cfg?.dotColor || "bg-indigo-500"}`} 
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className={`text-[6px] leading-none ${isSelected ? "text-white" : "text-indigo-600"} font-bold`}>+</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input Add Event Form */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-4 shadow-xs animate-fadeIn"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Schedule Event for {eventDate}
          </h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Title</label>
            <input
              type="text"
              placeholder="e.g. Calculus Practice Set 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEvent["type"])}
                className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="assignment">📚 Assignment</option>
                <option value="bill">💰 Bill Payment</option>
                <option value="meeting">📅 Meeting</option>
                <option value="focus">🎯 Focus Sprint</option>
                <option value="gym">🏋 Gym Session</option>
                <option value="exam">📝 Exam Block</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Time</label>
              <input
                type="text"
                placeholder="e.g. 3:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Submit on LMS page"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Confirm Schedule
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Selected Day Timeline */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Timeline
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            {formatHeaderDate(selectedDateStr)}
          </span>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-2.5">
            <p>No events scheduled for this day.</p>
            <button
              onClick={() => {
                setEventDate(selectedDateStr);
                setShowAddForm(true);
              }}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              + Create Scheduled Block
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateEvents.map((event) => {
              const config = eventConfig[event.type] || {
                icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
                color: "bg-slate-50 text-slate-700 border-slate-200/50",
                label: "Event"
              };

              return (
                <div
                  key={event.id}
                  id={`calendar-event-${event.id}`}
                  onClick={() => setSelectedEvent(event)}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${config.color} shrink-0 bg-white`}>
                      {config.icon}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {event.title}
                        </span>
                        {event.associatedTaskId && (
                          <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.2 rounded font-bold shrink-0 uppercase tracking-wide">
                            LINKED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 font-semibold">
                        <span>{config.label}</span>
                        <span className="text-slate-200">•</span>
                        <span className="font-mono flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-0.5 text-slate-300" />
                          {event.time} ({event.duration}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Detail Dialog Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-xl space-y-4 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${eventConfig[selectedEvent.type].color}`}>
                {eventConfig[selectedEvent.type].label}
              </span>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                {selectedEvent.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Scheduled: {selectedEvent.date} @ {selectedEvent.time} ({selectedEvent.duration} min)
              </p>
            </div>

            {selectedEvent.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                <strong className="text-slate-800">Sync Notes:</strong>
                <p className="mt-1">{selectedEvent.notes}</p>
              </div>
            )}

            {selectedEvent.isWorkable ? (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] text-slate-400 leading-snug">
                  This synchronized event is a Focus Target. Launching a Focus session will prepare your countdown and pause distractions.
                </p>
                <button
                  id={`launch-event-session-${selectedEvent.id}`}
                  onClick={() => {
                    const id = selectedEvent.id;
                    setSelectedEvent(null);
                    onLaunchFocusSessionByEvent(id);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Work Session (+100 XP)</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-[10px] text-slate-400 leading-snug">
                This is a logging-only event and cannot be actively completed inside Pomodoro Focus mode.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
