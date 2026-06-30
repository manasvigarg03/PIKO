import React, { useState } from "react";
import { Task, Subtask } from "../types";
import { 
  Plus, Sparkles, Clock, Trash, CheckCircle2, ChevronDown, ChevronUp, Play, Loader2, CheckSquare,
  Calendar, AlertTriangle, CheckCircle, Edit2, Check, X
} from "lucide-react";

interface TasksTabProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onCompleteSubtask: (taskId: string, subtaskId: string) => void;
  onCompleteTaskDirectly: (taskId: string) => void;
  onLaunchFocusSession: (taskId: string) => void;
  onAddSubtasks: (taskId: string, subtasks: Omit<Subtask, "completed">[]) => void;
  onUpdateSubtask: (taskId: string, subtaskId: string, updatedFields: Partial<Subtask>) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning") => void;
  mode?: "normal" | "intense";
}

export default function TasksTab({
  tasks,
  onAddTask,
  onDeleteTask,
  onCompleteSubtask,
  onCompleteTaskDirectly,
  onLaunchFocusSession,
  onAddSubtasks,
  onUpdateSubtask,
  addToast,
  mode = "normal"
}: TasksTabProps) {
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTwoMinTask, setIsTwoMinTask] = useState(false);

  // Subtask editing states
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [editSubtaskTime, setEditSubtaskTime] = useState(10);

  const handleSaveEdit = (taskId: string, subtaskId: string) => {
    if (!editSubtaskTitle.trim()) {
      addToast("Subtask title cannot be empty.", "warning");
      return;
    }
    onUpdateSubtask(taskId, subtaskId, {
      title: editSubtaskTitle,
      estimatedTime: editSubtaskTime
    });
    setEditingSubtaskId(null);
  };

  // Expanded tasks tracking
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  // Task list categorization state
  const [activeTaskCategory, setActiveTaskCategory] = useState<"upcoming" | "completed" | "overdue">("upcoming");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast("Please enter a task title.", "warning");
      return;
    }

    const newTaskId = `task-${Date.now()}`;
    setIsGenerating(true);

    let generatedSubtasks: Subtask[] = [];

    if (useAI) {
      addToast("Generating AI subtask breakdown...", "info");
      try {
        const response = await fetch("/api/gemini/breakdown-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, priority })
        });
        
        const data = await response.json();
        if (data.subtasks && Array.isArray(data.subtasks)) {
          generatedSubtasks = data.subtasks.map((sub: any, idx: number) => ({
            id: `sub-${newTaskId}-${idx}`,
            title: sub.title || "Action Item",
            estimatedTime: sub.estimatedTime || 10,
            xpReward: sub.xpReward || 20,
            completed: false
          }));
          addToast("AI generated optimized subtasks!", "success");
        } else {
          throw new Error("Invalid subtask response format");
        }
      } catch (err) {
        console.error("AI Generation failed, falling back", err);
        addToast("AI offline. Using procedural task generator.", "info");
        // Simple manual procedural generator
        generatedSubtasks = [
          { id: `sub-${newTaskId}-1`, title: "Review requirements and objectives", estimatedTime: 10, xpReward: 20, completed: false },
          { id: `sub-${newTaskId}-2`, title: "Gather essential notes and documents", estimatedTime: 15, xpReward: 30, completed: false },
          { id: `sub-${newTaskId}-3`, title: "Execute the core workload step-by-step", estimatedTime: 30, xpReward: 50, completed: false },
          { id: `sub-${newTaskId}-4`, title: "Proofread results and finalize submission", estimatedTime: 10, xpReward: 20, completed: false }
        ];
      }
    } else {
      generatedSubtasks = [
        { id: `sub-${newTaskId}-default`, title: "Initial Task Action Item", estimatedTime: 15, xpReward: 30, completed: false }
      ];
    }

    const totalDuration = generatedSubtasks.reduce((acc, s) => acc + s.estimatedTime, 0);
    const totalXP = generatedSubtasks.reduce((acc, s) => acc + s.xpReward, 0);

    // Override if explicitly set as a 2-min task
    const finalDuration = isTwoMinTask ? 2 : (totalDuration || 30);
    const finalXP = isTwoMinTask ? 30 : (totalXP || 100);
    const finalSubtasks = isTwoMinTask 
      ? [{ id: `sub-${newTaskId}-quick`, title: "⚡ Quick Action Step", estimatedTime: 2, xpReward: 30, completed: false }]
      : generatedSubtasks;

    // Check if task is overdue immediately (due date is past today)
    const taskDueDate = dueDate || new Date().toISOString().split("T")[0];
    const isOverdueTask = new Date(taskDueDate) < new Date(new Date().setHours(0,0,0,0));

    const newTask: Task = {
      id: newTaskId,
      title: title.trim(),
      description: description.trim() || "No description provided",
      priority,
      xpReward: finalXP,
      duration: finalDuration,
      progress: 0,
      isQuickWin: isTwoMinTask || finalDuration <= 2,
      subtasks: finalSubtasks,
      completed: false,
      dueDate: taskDueDate,
      overdue: isOverdueTask
    };

    onAddTask(newTask);
    setTitle("");
    setDescription("");
    setDueDate("");
    setIsTwoMinTask(false);
    setUseAI(true);
    setShowAddForm(false);
    setIsGenerating(false);
    setExpandedTaskId(newTaskId);
    addToast(`Task created: "${newTask.title}"`, "success");
  };

  const handleRegenerateSubtasks = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    setIsGenerating(true);
    addToast("Querying Gemini to restructure subtasks...", "info");

    try {
      const response = await fetch("/api/gemini/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: targetTask.title, 
          description: targetTask.description, 
          priority: targetTask.priority 
        })
      });
      const data = await response.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const formatted = data.subtasks.map((sub: any, idx: number) => ({
          title: sub.title || "Action Step",
          estimatedTime: sub.estimatedTime || 10,
          xpReward: sub.xpReward || 20
        }));
        onAddSubtasks(taskId, formatted);
        addToast("Subtasks optimized by AI Coach!", "success");
      }
    } catch (err) {
      addToast("Failed to connect to AI. Please try again later.", "warning");
    } finally {
      setIsGenerating(false);
    }
  };

  // Maps priorities to border/bg highlights
  const priorityMap = {
    high: { border: "border-l-4 border-l-red-500", labelColor: "text-red-700 bg-red-50 border-red-100/50" },
    medium: { border: "border-l-4 border-l-slate-400", labelColor: "text-slate-700 bg-slate-50 border-slate-150" },
    low: { border: "border-l-4 border-l-indigo-400", labelColor: "text-indigo-700 bg-indigo-50 border-indigo-100/50" }
  };

  return (
    <div className="space-y-6 animate-fadeIn p-1">
      
      {/* Tab Header Card */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xs border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider block mb-0.5">Overcome Inertia</span>
          <h2 className="text-base font-extrabold text-slate-800">Task Decomposition</h2>
        </div>
        <button
          id="toggle-add-task-form"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isGenerating}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Creation Form with Sparkle AI Integration */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-4 shadow-xs animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              <CheckSquare className="w-4 h-4 mr-1.5 text-slate-800" />
              Configure Task Planner
            </h3>
            <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600 font-bold uppercase tracking-wider">
              Manual Draft
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Complete AI Assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
              required
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Short Description</label>
            <textarea
              placeholder="e.g. Finish lecture summaries and upload essay to academic counselling"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="w-full text-xs px-2.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isGenerating}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* AI Assist toggle */}
            <div className="flex items-center space-x-2 sm:pt-2">
              <input
                type="checkbox"
                id="use-ai-breakdown"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                disabled={isGenerating || isTwoMinTask}
              />
              <label 
                htmlFor="use-ai-breakdown" 
                className="text-xs font-bold text-slate-600 flex items-center cursor-pointer select-none"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1 animate-pulse" />
                AI Subtask Splitting
              </label>
            </div>

            {/* 2-Min Task toggle */}
            <div className="flex items-center space-x-2 sm:pt-2">
              <input
                type="checkbox"
                id="is-two-min-task"
                checked={isTwoMinTask}
                onChange={(e) => {
                  setIsTwoMinTask(e.target.checked);
                  if (e.target.checked) {
                    setUseAI(false);
                  }
                }}
                className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 accent-amber-600 cursor-pointer"
                disabled={isGenerating}
              />
              <label 
                htmlFor="is-two-min-task" 
                className="text-xs font-bold text-slate-600 flex items-center cursor-pointer select-none"
              >
                <span className="mr-1">⚡</span>
                Make it a 2-Min Task (Quick Win)
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Splitting...</span>
                </>
              ) : (
                <>
                  {useAI && <Sparkles className="w-3.5 h-3.5 fill-white" />}
                  <span>Add with {useAI ? "AI Breakdown" : "Standard Model"}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={isGenerating}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Segmented Control */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTaskCategory("upcoming")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTaskCategory === "upcoming"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Upcoming</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTaskCategory === "upcoming" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
          }`}>
            {tasks.filter(t => !t.completed && !(t.overdue || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0))))).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTaskCategory("overdue")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTaskCategory === "overdue"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Overdue</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTaskCategory === "overdue" ? "bg-red-200 text-red-850" : "bg-red-100 text-red-600"
          }`}>
            {tasks.filter(t => !t.completed && (t.overdue || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0))))).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTaskCategory("completed")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTaskCategory === "completed"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Completed</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTaskCategory === "completed" ? "bg-emerald-250 text-emerald-900" : "bg-slate-200 text-slate-600"
          }`}>
            {tasks.filter(t => t.completed).length}
          </span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3.5">
        {(() => {
          const overdueTasks = tasks.filter(t => !t.completed && (t.overdue || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)))));
          const completedTasks = tasks.filter(t => t.completed);
          const upcomingTasks = tasks.filter(t => !t.completed && !(t.overdue || (t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0)))));

          const activeList = 
            activeTaskCategory === "upcoming" ? upcomingTasks :
            activeTaskCategory === "overdue" ? overdueTasks :
            completedTasks;

          if (activeList.length === 0) {
            return (
              <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-[2rem] p-6 space-y-2 animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                  {activeTaskCategory === "upcoming" && <CheckSquare className="w-5 h-5" />}
                  {activeTaskCategory === "overdue" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {activeTaskCategory === "completed" && <Clock className="w-5 h-5" />}
                </div>
                <h4 className="text-xs font-bold text-slate-700">
                  {activeTaskCategory === "upcoming" && "No upcoming tasks!"}
                  {activeTaskCategory === "overdue" && "No overdue tasks!"}
                  {activeTaskCategory === "completed" && "No completed tasks yet!"}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {activeTaskCategory === "upcoming" && "Add a task and unlock automatic AI breakdowns to organize your agenda."}
                  {activeTaskCategory === "overdue" && "You are completely on schedule! All pending deliverables are on track. 🔥"}
                  {activeTaskCategory === "completed" && "Finish task action steps during your focus intervals to earn reward XP!"}
                </p>
              </div>
            );
          }

          const twoMinTasks = activeList
            .filter(t => t.isQuickWin || t.duration <= 2)
            .sort((a, b) => {
              const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
              return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
            });
          const normalTasks = activeList
            .filter(t => !(t.isQuickWin || t.duration <= 2))
            .sort((a, b) => {
              const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
              return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
            });

          const renderTaskCard = (task: Task) => {
            const isExpanded = expandedTaskId === task.id;
            const config = priorityMap[task.priority] || priorityMap.medium;

            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const totalSubtasks = task.subtasks.length;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden transition-all shadow-xs ${
                  config.border
                } ${task.completed ? "opacity-75" : ""}`}
              >
                {/* Task Header Summary block */}
                <div 
                  className="p-5 flex items-start justify-between cursor-pointer select-none"
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                >
                  <div className="space-y-2 pr-4 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className={`text-xs font-extrabold leading-tight ${task.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </h3>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${config.labelColor}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0 flex items-center space-x-0.5 ${
                          activeTaskCategory === "overdue" 
                            ? "bg-red-50 border-red-100 text-red-600" 
                            : "bg-slate-50 border-slate-100 text-slate-500"
                        }`}>
                          <Calendar className="w-2.5 h-2.5 mr-0.5" />
                          <span>Due: {task.dueDate}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug line-clamp-2 font-medium">
                      {task.description}
                    </p>

                    {/* Tiny progress status */}
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-0.5 text-slate-300" />
                        ~{task.duration}m
                      </span>
                      <span className="text-slate-200">•</span>
                      <span>{task.progress}% Done</span>
                      <span className="text-slate-200">•</span>
                      <span className="text-indigo-600 font-extrabold">+{task.xpReward} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      id={`delete-task-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors mr-1 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Progress Line */}
                <div className="w-full h-1 bg-slate-100">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                {/* Expanded Actionable Subtask Area */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-4 animate-fadeIn">
                    
                    {/* Task Actions toolbar */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Subtasks Decomposition
                      </span>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          id={`regenerate-sub-${task.id}`}
                          onClick={() => handleRegenerateSubtasks(task.id)}
                          disabled={isGenerating || task.completed}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center space-x-0.5 cursor-pointer bg-transparent border-none"
                          title="Rewrite subtasks using AI Coach"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-0.5 animate-pulse text-indigo-500" />
                          <span>AI Re-Split</span>
                        </button>

                        {!task.completed && (
                          <button
                            type="button"
                            id={`launch-focus-task-${task.id}`}
                            onClick={() => onLaunchFocusSession(task.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-sm"
                          >
                            <Play className="w-2.5 h-2.5 fill-white text-white" />
                            <span>Focus Session</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subtask listing with checkbox */}
                    {totalSubtasks === 0 ? (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-xs text-slate-400">No subtasks found for this task.</p>
                        <button
                          type="button"
                          onClick={() => handleRegenerateSubtasks(task.id)}
                          className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                        >
                          Generate AI Subtasks
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {task.subtasks.map((sub) => {
                          const isEditing = editingSubtaskId === sub.id;
                          return (
                            <div
                              key={sub.id}
                              id={`subtask-${sub.id}`}
                              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors bg-white ${
                                sub.completed 
                                  ? "border-slate-100 text-slate-400 bg-slate-50/20" 
                                  : "border-slate-150 text-slate-700 hover:border-slate-200"
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 pr-2">
                                  <input
                                    type="text"
                                    id={`edit-subtask-title-${sub.id}`}
                                    value={editSubtaskTitle}
                                    onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit(task.id, sub.id);
                                      if (e.key === "Escape") setEditingSubtaskId(null);
                                    }}
                                    className="flex-1 text-xs px-2.5 py-1.5 border border-indigo-200 rounded-lg bg-white font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                    placeholder="Subtask title"
                                    autoFocus
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      id={`edit-subtask-time-${sub.id}`}
                                      min="1"
                                      max="180"
                                      value={editSubtaskTime}
                                      onChange={(e) => setEditSubtaskTime(parseInt(e.target.value) || 5)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit(task.id, sub.id);
                                        if (e.key === "Escape") setEditingSubtaskId(null);
                                      }}
                                      className="w-14 text-xs px-2 py-1.5 border border-indigo-200 rounded-lg bg-white font-bold text-slate-700 text-center focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">min</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3 pr-2">
                                  <button
                                    type="button"
                                    id={`complete-sub-${sub.id}`}
                                    onClick={() => onCompleteSubtask(task.id, sub.id)}
                                    disabled={task.completed}
                                    className="cursor-pointer bg-transparent border-none p-0"
                                  >
                                    {sub.completed ? (
                                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 fill-indigo-50" />
                                    ) : (
                                      <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 hover:border-indigo-600" />
                                    )}
                                  </button>
                                  
                                  <span className={`text-xs font-bold leading-tight ${sub.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                                    {sub.title}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center space-x-2 shrink-0">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      id={`save-sub-btn-${sub.id}`}
                                      onClick={() => handleSaveEdit(task.id, sub.id)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                      title="Save"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      id={`cancel-sub-btn-${sub.id}`}
                                      onClick={() => setEditingSubtaskId(null)}
                                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                      {sub.estimatedTime}m
                                    </span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                      sub.completed ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"
                                    }`}>
                                      +{sub.xpReward} XP
                                    </span>
                                    {!task.completed && (
                                      <button
                                        type="button"
                                        id={`edit-sub-btn-${sub.id}`}
                                        onClick={() => {
                                          setEditingSubtaskId(sub.id);
                                          setEditSubtaskTitle(sub.title);
                                          setEditSubtaskTime(sub.estimatedTime);
                                        }}
                                        className="p-1 hover:bg-indigo-50 rounded-lg text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                                        title="Edit subtask"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Immediate direct completion */}
                    {!task.completed && (
                      <button
                        type="button"
                        id={`direct-complete-task-${task.id}`}
                        onClick={() => onCompleteTaskDirectly(task.id)}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors mt-2 cursor-pointer"
                      >
                        Complete Entire Task & Earn Combined XP
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div className="space-y-6">
              {twoMinTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2 px-1">
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center">
                      ⚡ 2-Min Micro Tasks (Quick Wins)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {twoMinTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}

              {normalTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2 px-1 pt-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center">
                      📋 Normal Tasks
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Best reserved for dedicated focus blocks</span>
                  </div>
                  <div className="space-y-3">
                    {normalTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

    </div>
  );
}
