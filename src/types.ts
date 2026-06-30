export interface Subtask {
  id: string;
  title: string;
  estimatedTime: number; // in minutes
  xpReward: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  xpReward: number;
  duration: number; // total estimated duration in minutes
  progress: number; // completed percentage (e.g. 40)
  isQuickWin: boolean;
  subtasks: Subtask[];
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  overdue?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "assignment" | "bill" | "meeting" | "focus" | "gym" | "exam";
  date: string; // YYYY-MM-DD format, e.g. "2026-06-29"
  time: string; // e.g. "10:00 AM" or "2:30 PM"
  duration: number; // in minutes
  completed: boolean;
  isWorkable: boolean;
  notes?: string;
  associatedTaskId?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  commitment: string;
  timeAgo: string;
  cheersCount: number;
  hasCheered: boolean;
  reactions: string[]; // array of emoji strings
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timeAgo: string;
  }>;
  completed: boolean;
}

export interface AccountabilityGroup {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  joined: boolean;
  category: string;
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  purpose: string;
  permission: string;
  icon: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  message: string;
  type: "normal" | "intense" | "alert" | "escalation";
  taskTitle?: string;
  subtaskTitle?: string;
  distractionApp?: string;
}

export interface Habit {
  id: string;
  goalId?: string;
  title: string;
  frequency: "daily" | "weekly" | "weekdays" | "custom";
  completedDates: string[]; // e.g. ["2026-06-30"]
  reminderTime?: string; // e.g. "08:00 AM"
  reminderEnabled: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  recommendedHabits?: string[]; // list of recommended habits
}
