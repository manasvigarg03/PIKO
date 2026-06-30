import { Task, CalendarEvent, CommunityPost, AccountabilityGroup, Integration } from "./types";

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Database Assignment",
    description: "Write SQL queries for homework 4, test indices on local Postgres, and submit report.",
    priority: "medium",
    xpReward: 120,
    duration: 35,
    progress: 40,
    isQuickWin: false,
    completed: false,
    dueDate: "2026-07-02",
    subtasks: [
      { id: "sub-1-1", title: "Read instructions & schemas", estimatedTime: 5, xpReward: 20, completed: true },
      { id: "sub-1-2", title: "Write queries 1 to 5", estimatedTime: 10, xpReward: 30, completed: true },
      { id: "sub-1-3", title: "Verify execution plans & indices", estimatedTime: 10, xpReward: 30, completed: false },
      { id: "sub-1-4", title: "Format PDF and insert diagrams", estimatedTime: 8, xpReward: 25, completed: false },
      { id: "sub-1-5", title: "Submit assignment on portal", estimatedTime: 2, xpReward: 15, completed: false }
    ]
  },
  {
    id: "task-2",
    title: "Complete AI Essay",
    description: "Write 1500-word essay detailing the societal impacts of multimodal transformer models and generative video.",
    priority: "high",
    xpReward: 200,
    duration: 60,
    progress: 0,
    isQuickWin: false,
    completed: false,
    dueDate: "2026-06-25",
    overdue: true,
    subtasks: [
      { id: "sub-2-1", title: "Create essay structure outline", estimatedTime: 10, xpReward: 30, completed: false },
      { id: "sub-2-2", title: "Draft introduction and historical context", estimatedTime: 15, xpReward: 40, completed: false },
      { id: "sub-2-3", title: "Write technical sections on multimodal training", estimatedTime: 20, xpReward: 50, completed: false },
      { id: "sub-2-4", title: "Write ethical implications chapter", estimatedTime: 10, xpReward: 40, completed: false },
      { id: "sub-2-5", title: "Format citations and proofread", estimatedTime: 5, xpReward: 40, completed: false }
    ]
  },
  {
    id: "qw-1",
    title: "Accept Teams Invitation",
    description: "Accept the quarterly review meeting invite sent by the team lead.",
    priority: "low",
    xpReward: 10,
    duration: 2,
    progress: 0,
    isQuickWin: true,
    completed: false,
    dueDate: "2026-07-05",
    subtasks: []
  },
  {
    id: "qw-2",
    title: "Reply to Professor's Email",
    description: "Email Professor Higgins regarding the office hours timing adjustments.",
    priority: "medium",
    xpReward: 15,
    duration: 1,
    progress: 0,
    isQuickWin: true,
    completed: false,
    dueDate: "2026-07-03",
    subtasks: []
  },
  {
    id: "qw-3",
    title: "Pay Electricity Bill",
    description: "Log in to the power portal and process the monthly payment of $84.20.",
    priority: "high",
    xpReward: 20,
    duration: 2,
    progress: 0,
    isQuickWin: true,
    completed: false,
    dueDate: "2026-07-04",
    subtasks: []
  },
  {
    id: "qw-4",
    title: "Upload Assignment PDF",
    description: "Upload the signed feedback PDF to the academic counseling drive.",
    priority: "low",
    xpReward: 10,
    duration: 1,
    progress: 0,
    isQuickWin: true,
    completed: false,
    dueDate: "2026-06-20",
    overdue: true,
    subtasks: []
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "event-1",
    title: "Zoom Meeting with Prof. Higgins",
    type: "meeting",
    date: "2026-06-29",
    time: "10:00 AM",
    duration: 45,
    completed: false,
    isWorkable: true,
    notes: "Reviewing paper drafts and midterm corrections.",
    associatedTaskId: "qw-2"
  },
  {
    id: "event-2",
    title: "Database Assignment Deadline",
    type: "assignment",
    date: "2026-06-29",
    time: "11:59 PM",
    duration: 30,
    completed: false,
    isWorkable: true,
    notes: "Must submit HW 4 on Portal.",
    associatedTaskId: "task-1"
  },
  {
    id: "event-3",
    title: "Electricity Bill Reminder",
    type: "bill",
    date: "2026-06-29",
    time: "05:00 PM",
    duration: 15,
    completed: false,
    isWorkable: false,
    notes: "Check email for invoice #4421.",
    associatedTaskId: "qw-3"
  },
  {
    id: "event-4",
    title: "Midterm Exam Study Block",
    type: "exam",
    date: "2026-06-30",
    time: "02:00 PM",
    duration: 120,
    completed: false,
    isWorkable: true,
    notes: "Covering Chapters 4 through 8, practice worksheets."
  },
  {
    id: "event-5",
    title: "Morning Gym Session",
    type: "gym",
    date: "2026-07-03",
    time: "08:00 AM",
    duration: 60,
    completed: false,
    isWorkable: false,
    notes: "Leg day + stretching cardio."
  },
  {
    id: "event-6",
    title: "Focus: Deep Work Sprint",
    type: "focus",
    date: "2026-06-29",
    time: "03:30 PM",
    duration: 25,
    completed: false,
    isWorkable: true,
    notes: "District-free session to kickstart essay drafting.",
    associatedTaskId: "task-2"
  }
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    author: "Alex Chen",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    commitment: "I'm finishing my internship presentation tonight and rehearsing it twice.",
    timeAgo: "2h ago",
    cheersCount: 5,
    hasCheered: false,
    reactions: ["🔥", "💪"],
    completed: false,
    comments: [
      { id: "c1", author: "Marcus Vance", text: "You've got this! Slides are clean.", timeAgo: "1h ago" },
      { id: "c2", author: "Sarah Jenkins", text: "You will crush it. Tell us when you complete!", timeAgo: "30m ago" }
    ]
  },
  {
    id: "post-2",
    author: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    commitment: "Crushed 3 hours of focused coding! Complete compiler project grammar analysis.",
    timeAgo: "4h ago",
    cheersCount: 12,
    hasCheered: true,
    reactions: ["👏", "🎉", "🧠"],
    completed: true,
    comments: [
      { id: "c3", author: "Alex Chen", text: "Wow, compiler grammar is brutal! Outstanding work.", timeAgo: "3h ago" }
    ]
  },
  {
    id: "post-3",
    author: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    commitment: "Studying for my physics midterm tomorrow. Let's block social media for 4 hours.",
    timeAgo: "5h ago",
    cheersCount: 3,
    hasCheered: false,
    reactions: ["📚"],
    completed: false,
    comments: []
  }
];

export const INITIAL_ACCOUNTABILITY_GROUPS: AccountabilityGroup[] = [
  { id: "g-1", name: "AI Engineering Squad", description: "Students & developers researching deep learning and model fine-tuning.", membersCount: 42, joined: true, category: "CS & Tech" },
  { id: "g-2", name: "Night Owls Productivity", description: "Quiet accountability blocks starting after 10 PM. Focus sprints.", membersCount: 118, joined: true, category: "General Study" },
  { id: "g-3", name: "Study with Me (25/5 Pomodoro)", description: "Regular daily virtual Pomodoro groups to battle procrastination.", membersCount: 230, joined: false, category: "General Study" },
  { id: "g-4", name: "No Procrastination Support", description: "Sharing daily wins, quick accountability check-ins twice a day.", membersCount: 89, joined: false, category: "Gamified Habits" }
];

export const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "gcal",
    name: "Google Calendar",
    connected: true,
    purpose: "Sync events and deadlines automatically into your PIKO schedule.",
    permission: "Read/write access to your calendar events and schedules.",
    icon: "Calendar"
  },
  {
    id: "gmail",
    name: "Gmail Integration",
    connected: true,
    purpose: "Analyze inbox for upcoming invoices, exams, and assignment notifications.",
    permission: "Secure read-only email metadata categorization (sender & headers).",
    icon: "Mail"
  },
  {
    id: "zoom",
    name: "Zoom",
    connected: false,
    purpose: "Launch class video links directly into Focus Mode as workable events.",
    permission: "Create, view, and read online meeting metadata.",
    icon: "Video"
  },
  {
    id: "gpay",
    name: "Google Pay",
    connected: false,
    purpose: "Auto-detect billing schedules and flag payments under Quick Wins.",
    permission: "Secure invoice detection and billing history parsing.",
    icon: "CreditCard"
  },
  {
    id: "wellbeing",
    name: "Digital Wellbeing",
    connected: false,
    purpose: "Detect social media distraction spikes to trigger Intense Mode notifications.",
    permission: "System level app usage tracking and notification interception.",
    icon: "Activity"
  }
];

export const DISTRACTION_APPS = [
  { name: "Instagram", color: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600", icon: "Instagram" },
  { name: "YouTube", color: "bg-red-600", icon: "Youtube" },
  { name: "Spotify", color: "bg-emerald-500", icon: "Music" },
  { name: "Reddit", color: "bg-orange-500", icon: "MessageSquare" }
];
