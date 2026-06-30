import React from "react";
import { Integration } from "../types";
import { X, Shield, AlertCircle, ToggleLeft, ToggleRight, Info, ChevronRight, Sparkles, Bell } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "normal" | "intense";
  setMode: (mode: "normal" | "intense") => void;
  normalInterval: number;
  setNormalInterval: (val: number) => void;
  integrations: Integration[];
  onToggleIntegration: (id: string) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
  voiceRemindersDisabled: boolean;
  setVoiceRemindersDisabled: (val: boolean) => void;
  onOpenSimulator: () => void;
  onTriggerNormalPreview?: () => void;
  onTriggerIntensePreview?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  mode,
  setMode,
  normalInterval,
  setNormalInterval,
  integrations,
  onToggleIntegration,
  addToast,
  voiceRemindersDisabled,
  setVoiceRemindersDisabled,
  onOpenSimulator,
  onTriggerNormalPreview,
  onTriggerIntensePreview
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleModeChange = (newMode: "normal" | "intense") => {
    setMode(newMode);
    if (newMode === "intense") {
      addToast("Intense Mode Activated: Digital Wellbeing scanning enabled.", "warning");
    } else {
      addToast("Normal Mode Activated: Gentle recommendations active.", "success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        id="settings-panel"
        className="w-full max-w-md bg-white rounded-[2rem] shadow-xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Control Center</h2>
          </div>
          <button 
            id="close-settings"
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section: Simulator */}
          <div className="p-4 bg-indigo-50 hover:bg-indigo-100/60 rounded-2xl border border-indigo-100/50 flex items-center justify-between transition-colors cursor-pointer" onClick={() => { onClose(); onOpenSimulator(); }}>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                🎮 Open Coach Simulator Terminal
              </h4>
              <p className="text-[10px] text-indigo-700 font-semibold leading-relaxed">
                Test custom app interception and trigger behavioral prompts.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          
          {/* Section: Productivity Modes */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Productivity Mode
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Normal Mode card */}
              <button
                id="mode-normal-btn"
                onClick={() => handleModeChange("normal")}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                  mode === "normal"
                    ? "border-indigo-600 bg-indigo-50/20 text-indigo-900"
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">Gentle Flow</span>
                  <div className={`w-2 h-2 rounded-full ${mode === "normal" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                  Mindful reminders at regular intervals. Never pushy or stressful.
                </p>
                {mode === "normal" && (
                  <div className="absolute right-1 bottom-1 text-[8px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                    ACTIVE
                  </div>
                )}
              </button>

              {/* Intense Mode card */}
              <button
                id="mode-intense-btn"
                onClick={() => handleModeChange("intense")}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer ${
                  mode === "intense"
                    ? "border-red-500 bg-red-50/30 text-slate-900"
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-red-600">Intense Mode</span>
                  <div className={`w-2 h-2 rounded-full ${mode === "intense" ? "bg-red-500 animate-pulse" : "bg-slate-300"}`} />
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                  Digital Wellbeing locks. Distraction alerts cannot be dismissed easily.
                </p>
                {mode === "intense" && (
                  <div className="absolute right-1 bottom-1 text-[8px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md">
                    INTENSE
                  </div>
                )}
              </button>
            </div>
            
            {mode === "normal" && (
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl flex flex-col space-y-2 border border-indigo-100/50 animate-fadeIn">
                <h4 className="text-xs font-black text-indigo-950 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse" />
                  Smart Deadline Reminders
                </h4>
                <p className="text-[10px] text-indigo-700 font-semibold leading-relaxed">
                  Piko will automatically nudge you exactly <strong>5 minutes before</strong> a task is due, and <strong>at the time</strong> it is due. Quick-wins of 2 minutes are highlighted to get you started easily!
                </p>
              </div>
            )}

            {mode === "intense" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-red-50 rounded-2xl flex items-start space-x-2.5 border border-red-100/50 animate-fadeIn">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                    <strong>Intervention Shield Active:</strong> When opening distracting apps (e.g., YouTube, Instagram), Piko will immediately intercept with custom behavioral alerts and direct voice prompts to keep you focused on your subtasks. No regular background reminder alerts will disturb you.
                  </p>
                </div>
              </div>
            )}

            {/* Section: Voice Reminder Settings */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Voice Interventions</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                  Play spoken warnings when distracted in Intense Mode.
                </p>
              </div>
              <button
                id="toggle-voice-reminders"
                type="button"
                onClick={() => {
                  setVoiceRemindersDisabled(!voiceRemindersDisabled);
                  addToast(
                    !voiceRemindersDisabled
                      ? "Voice reminders disabled! 🔇"
                      : "Voice reminders enabled! 🔊",
                    "info"
                  );
                }}
                className="focus:outline-none cursor-pointer border-none bg-transparent"
              >
                {voiceRemindersDisabled ? (
                  <ToggleLeft className="w-10 h-6 text-slate-300 hover:text-slate-400" />
                ) : (
                  <ToggleRight className="w-10 h-6 text-indigo-600" />
                )}
              </button>
            </div>

            {/* Section: Live Reminders Preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/60 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Instant Mode Reminders Preview
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                  Trigger temporary overlays to see and hear exactly what text both modes show!
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={onTriggerNormalPreview}
                  className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm border border-indigo-100"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Preview Normal Mode</span>
                </button>
                <button
                  type="button"
                  onClick={onTriggerIntensePreview}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-[11px] rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm border border-red-100"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Preview Intense Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Connected Integrations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                System Integrations
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold">
                {integrations.filter(i => i.connected).length}/{integrations.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {integrations.map((item) => {
                const isConnected = item.connected;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isConnected 
                        ? "border-slate-100 bg-slate-50/50" 
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            {item.name}
                          </span>
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${
                              isConnected
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isConnected ? "ACTIVE" : "OFFLINE"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">{item.purpose}</p>
                      </div>
                      
                      {/* Connection toggle button */}
                      <button
                        id={`toggle-int-${item.id}`}
                        onClick={() => onToggleIntegration(item.id)}
                        className="focus:outline-none cursor-pointer"
                      >
                        {isConnected ? (
                          <ToggleRight className="w-10 h-6 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Detailed Permission Explanation Expandable */}
                    <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 flex items-start space-x-1.5 text-[11px] text-slate-400 font-semibold leading-normal">
                      <Info className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-500 font-bold uppercase tracking-wide text-[9px] mr-1">Access:</strong> {item.permission}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px] font-bold px-6">
          <div className="flex items-center space-x-1 uppercase tracking-wider">
            <span>PIKO v1.0.4 • Sandbox</span>
          </div>
          <button
            id="close-settings-footer"
            onClick={onClose}
            className="px-4.5 py-2.5 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
