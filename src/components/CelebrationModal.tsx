import React, { useEffect } from "react";
import { Task } from "../types";
import { Award, Sparkles, CheckCircle, ShieldCheck, ArrowRight } from "lucide-react";

interface CelebrationModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function CelebrationModal({ task, onClose }: CelebrationModalProps) {
  useEffect(() => {
    if (!task) return;

    // Optional: play a subtle celebratory sound if desired, or trigger haptic
    // Let's add a lovely CSS confetti animation.
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      
      {/* Container Card */}
      <div 
        id="celebration-popup"
        className="w-full max-w-sm bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col p-6 text-center space-y-5 animate-scaleIn"
      >
        
        {/* Confetti floating effect background layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none">
          <div className="absolute text-xl animate-float-slow top-4 left-6">🎉</div>
          <div className="absolute text-2xl animate-float-medium top-12 right-12">✨</div>
          <div className="absolute text-lg animate-float-fast bottom-16 left-12">🏆</div>
          <div className="absolute text-2xl animate-float-slow bottom-8 right-8">🌟</div>
          <div className="absolute text-xl animate-float-medium top-24 left-16">⚡</div>
          <div className="absolute text-xl animate-float-fast top-36 right-16">🔥</div>
        </div>

        {/* Big circular icon area */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 relative z-10">
          <Award className="w-10 h-10 animate-bounce" />
          <div className="absolute -inset-1 rounded-full border-2 border-indigo-200/50 animate-ping opacity-75" />
        </div>

        {/* Titles */}
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
            Victory Achieved!
          </span>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-snug">
            Task Conquered!
          </h2>
          <p className="text-xs text-slate-500 font-semibold px-4">
            Outstanding job breaking inertia and finishing this goal.
          </p>
        </div>

        {/* Task Details Card */}
        <div className="bg-slate-50 border border-slate-150/50 p-4.5 rounded-2xl text-left space-y-3 relative z-10">
          <div className="flex items-start space-x-2.5">
            <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 leading-snug">{task.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">{task.description}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200/60 pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">REWARD EARNED</span>
              <span className="text-xs font-extrabold text-emerald-600 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                +{task.xpReward} XP
              </span>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">STUDY TIME</span>
              <span className="text-xs font-extrabold text-slate-700">
                {task.duration} mins
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Speech Balloon */}
        <div className="bg-indigo-50/50 border border-indigo-100/40 p-3.5 rounded-xl text-[11px] text-indigo-900 leading-relaxed font-semibold italic text-left">
          "Piko Coach: Spectacular consistency! Dividing this objective into subtasks and focusing on each one keeps procrastination at bay. Let's carry this high-vibe momentum forward!"
        </div>

        {/* Dismiss Button */}
        <button
          id="claim-rewards-btn"
          onClick={onClose}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/10 z-10 hover:shadow-indigo-600/25"
        >
          <span>Claim Rewards</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
