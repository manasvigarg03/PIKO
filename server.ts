import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Initialize Gemini if key exists
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey && apiKey !== "MY_GEMINI_API_KEY" ? new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  console.log(`[PIKO Backend] Gemini AI Key present: ${!!ai}`);

  // Endpoint to break down a larger task into small, highly actionable subtasks
  app.post("/api/gemini/breakdown-task", async (req, res) => {
    const { title, description, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }

    // Default procedural fallback lists for common task keywords
    const fallbackBreakdowns: { [key: string]: Array<{ title: string; estimatedTime: number; xpReward: number }> } = {
      assignment: [
        { title: "Read assignment instructions & rubrics", estimatedTime: 5, xpReward: 20 },
        { title: "Gather reference papers and materials", estimatedTime: 10, xpReward: 30 },
        { title: "Draft outlines or solve question 1-2", estimatedTime: 15, xpReward: 40 },
        { title: "Complete calculations/write remaining sections", estimatedTime: 25, xpReward: 50 },
        { title: "Double-check for plagiarism or errors", estimatedTime: 5, xpReward: 20 },
        { title: "Submit assignment on portal", estimatedTime: 2, xpReward: 15 }
      ],
      study: [
        { title: "Organize study desk & clear distractions", estimatedTime: 2, xpReward: 10 },
        { title: "Review lecture notes & slide decks", estimatedTime: 15, xpReward: 30 },
        { title: "Create flashcards for core terms", estimatedTime: 10, xpReward: 25 },
        { title: "Attempt 3 practice questions", estimatedTime: 20, xpReward: 45 },
        { title: "Summarize tough concepts in own words", estimatedTime: 10, xpReward: 30 }
      ],
      cleaning: [
        { title: "Pick up trash and clutter", estimatedTime: 5, xpReward: 15 },
        { title: "Wipe down desks and surfaces", estimatedTime: 10, xpReward: 25 },
        { title: "Vacuum or sweep the floor", estimatedTime: 15, xpReward: 35 },
        { title: "Organize cables and desk drawers", estimatedTime: 10, xpReward: 25 }
      ],
      coding: [
        { title: "Initialize repository & verify dev environment", estimatedTime: 5, xpReward: 20 },
        { title: "Design database schemas or mock state", estimatedTime: 15, xpReward: 30 },
        { title: "Implement core business logic & routing", estimatedTime: 30, xpReward: 60 },
        { title: "Build responsive frontend layout & CSS styles", estimatedTime: 20, xpReward: 40 },
        { title: "Fix lint errors & verify standard flow", estimatedTime: 10, xpReward: 30 }
      ]
    };

    // Determine type based on keywords
    let matchedCategory = "assignment";
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || "").toLowerCase();
    
    if (lowerTitle.includes("clean") || lowerTitle.includes("wash") || lowerTitle.includes("room")) {
      matchedCategory = "cleaning";
    } else if (lowerTitle.includes("study") || lowerTitle.includes("exam") || lowerTitle.includes("test") || lowerTitle.includes("learn") || lowerTitle.includes("read")) {
      matchedCategory = "study";
    } else if (lowerTitle.includes("code") || lowerTitle.includes("build") || lowerTitle.includes("program") || lowerTitle.includes("app") || lowerTitle.includes("database")) {
      matchedCategory = "coding";
    }

    const localFallback = fallbackBreakdowns[matchedCategory];

    if (!ai) {
      console.log(`[PIKO Backend] Using high-quality local fallback breakdown for: "${title}"`);
      // customize slightly based on title
      const customFallback = localFallback.map((item, idx) => {
        if (idx === 2 && lowerTitle) {
          return { ...item, title: `${item.title.split("solve")[0]} "${title.slice(0, 20)}..."` };
        }
        return item;
      });
      return res.json({ subtasks: customFallback });
    }

    try {
      console.log(`[PIKO Backend] Invoking Gemini API to split task: "${title}"`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Break down the following task into 4 to 6 bite-sized, actionable, non-overlapping subtasks that help overcome task initiation friction:
Task Title: "${title}"
Task Description: "${description || "No description provided"}"
Task Priority: "${priority || "medium"}"

Provide an estimated duration in minutes for each subtask (between 2 and 30 minutes) and an XP reward proportional to the complexity (between 10 and 50 XP).`,
        config: {
          systemInstruction: "You are an expert Productivity AI Coach designed to reduce task paralysis. Create extremely granular, small, actionable subtasks that are easy to start.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Highly concrete action step (e.g., 'Open Google Docs and write outline')" },
                estimatedTime: { type: Type.INTEGER, description: "Duration in minutes" },
                xpReward: { type: Type.INTEGER, description: "XP score (10 to 50 XP)" }
              },
              required: ["title", "estimatedTime", "xpReward"]
            }
          }
        }
      });

      const textResult = response.text?.trim() || "[]";
      const parsed = JSON.parse(textResult);
      return res.json({ subtasks: parsed });
    } catch (err: any) {
      console.error("[PIKO Backend] Gemini Task breakdown failed, using fallback:", err);
      return res.json({ subtasks: localFallback });
    }
  });

  // Endpoint to generate intelligent, low-friction, micro-step notifications
  app.post("/api/gemini/generate-notification", async (req, res) => {
    const { mode, taskTitle, subtaskTitle, distractionApp, estimatedTime, eventName } = req.body;

    const task = taskTitle || "your tasks";
    const subtask = subtaskTitle || "take the first step";
    const duration = estimatedTime || 12;

    // Normal Mode: Calendar-driven, predictable, gentle, time-based reminders
    const fallbackRemindersNormal = [
      `You planned to study now. Let's complete just the first five questions.`,
      `You planned to work on "${task}" now. Let's start with just "${subtask}". It'll take about ${duration} minutes.`,
      `Time-based gentle nudge: "${task}" is scheduled. Let's tackle "${subtask}" now to keep your schedule predictable.`,
      `Gentle calendar check-in: Time to check off "${subtask}". Just a few minutes of focus makes your day easier!`
    ];

    // Intense Mode: Context-aware, adaptive, dynamic, behavior-triggered reminders
    const fallbackRemindersIntense: { [key: string]: string[] } = {
      Instagram: [
        `You're opening Instagram. You can start on your first remaining subtask: "${subtask}" rather than opening Instagram! Starting this task will only take 2 mins so lets goo!`,
        `You're scrolling Instagram. Let's start on your first subtask "${subtask}" instead of browsing Instagram! Starting now takes only 2 mins, let's go!`
      ],
      YouTube: [
        `You're opening YouTube. You can start on your first remaining subtask: "${subtask}" rather than opening YouTube! Starting this task will only take 2 mins so lets goo!`,
        `You opened YouTube. Before starting a video, did you know you can knock out your first subtask "${subtask}" in just ${duration} minutes? Let's do that first!`
      ],
      Spotify: [
        `You're on Spotify. This productive playlist is the perfect backdrop to spend ${duration} minutes on "${subtask}". Let's flow!`,
        `Music is playing! Let's leverage this focus spike to do "${subtask}" right now and earn +30 XP!`
      ],
      Reddit: [
        `You're reading Reddit. Scrolling threads takes 15 minutes—the exact block needed to cross off "${subtask}"!`,
        `Reddit is infinite, but your free time tomorrow isn't. Let's spend ${duration} minutes on "${subtask}" now.`
      ],
      default: [
        `Distraction detected! Let's complete just 1 question from "${task}" so you can free up 5 mins tomorrow.`,
        `Long idle period detected. Swapping 10 minutes of screen idle time for "${subtask}" saves your evening!`,
        `You just switched apps. Let's channel that change in context to conquer "${subtask}" in just ${duration} mins.`
      ]
    };

    const isIntense = mode === "intense";
    let message = "";

    if (isIntense) {
      const appKey = distractionApp || "";
      if (fallbackRemindersIntense[appKey]) {
        const list = fallbackRemindersIntense[appKey];
        message = list[Math.floor(Math.random() * list.length)];
      } else {
        const list = fallbackRemindersIntense.default;
        message = list[Math.floor(Math.random() * list.length)];
      }
    } else {
      message = fallbackRemindersNormal[Math.floor(Math.random() * fallbackRemindersNormal.length)];
    }

    if (!ai) {
      console.log(`[PIKO Backend] Generated local reminder (Mode: ${mode}, App: ${distractionApp || "None"}): "${message}"`);
      return res.json({ message });
    }

    try {
      console.log(`[PIKO Backend] Requesting Gemini smart reminder for mode: "${mode}"`);
      
      let prompt = "";
      if (isIntense) {
        prompt = `Create an Intense Mode context-aware notification reminder triggered by user behavior.
Context Details:
- Distracting activity/app: "${distractionApp || "switching focus/long screen idle"}"
- Target task that needs completion: "${task}"
- Target next bite-sized step: "${subtask}" (takes about ${duration} minutes)
${eventName ? `- Trigger Event: "${eventName}"` : ""}

Notification Rules:
- MUST be context-aware, adaptive, dynamic, and highly personalized.
- MUST follow this exact style/tone example: "You're on YouTube. One more video takes about 12 minutes—the same time needed to finish today's coding exercise."
- Challenge their current distraction (e.g. YouTube, Instagram, scrolling, idleness) and pitch an immediate swap for a small action of similar length.
- Strictly do NOT say "Complete your assignment". Recommend ONE small, concrete step.
- Must fit within 1-2 sentences (under 180 characters).`;
      } else {
        prompt = `Create a Normal Mode calendar-driven gentle reminder notification for scheduled work.
Context Details:
- Target task: "${task}"
- Target next subtask step: "${subtask}" (takes about ${duration} minutes)
${eventName ? `- Trigger Event: "${eventName}"` : ""}

Notification Rules:
- MUST be calendar-driven, time-based, gentle, predictable, and non-intrusive.
- MUST follow this exact style/tone example: "You planned to study now. Let's complete just the first five questions."
- Avoid any behavior tracking, app intercept context, or aggressive wording. Keep it sweet and orderly.
- Must fit within 1-2 sentences (under 180 characters).`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite, persuasive, ultra-helpful Android productivity coach. Your goal is to maximize action and reduce task paralysis. Write concise, highly engaging human-style notifications.",
          temperature: 0.8,
        }
      });

      const generated = response.text?.trim() || message;
      // strip out outer quotes if present
      const cleanMessage = generated.replace(/^["']|["']$/g, '');
      return res.json({ message: cleanMessage });
    } catch (err) {
      console.error("[PIKO Backend] Gemini notification gen failed, using fallback:", err);
      return res.json({ message });
    }
  });

  // Endpoint to recommend daily habits for a given goal
  app.post("/api/gemini/recommend-habits", async (req, res) => {
    const { goalTitle } = req.body;
    if (!goalTitle) {
      return res.status(400).json({ error: "Goal title is required." });
    }

    const titleLower = goalTitle.toLowerCase();
    let defaultHabits = [
      "Dedicate 10 minutes to planning next steps",
      "Read 5 pages of related material",
      "Log daily progress in your tracker"
    ];

    if (titleLower.includes("study") || titleLower.includes("learn") || titleLower.includes("code") || titleLower.includes("typescript") || titleLower.includes("exam") || titleLower.includes("school")) {
      defaultHabits = [
        "Review 1 concept or flashcard for 10 minutes",
        "Practice coding or solving 1 exercise",
        "Clear study workspace of all distractions before starting"
      ];
    } else if (titleLower.includes("health") || titleLower.includes("fitness") || titleLower.includes("run") || titleLower.includes("gym") || titleLower.includes("workout")) {
      defaultHabits = [
        "Stretch or exercise actively for 15 minutes",
        "Drink at least 2.5 liters of pure water",
        "Do 10 air squats or simple calf raises"
      ];
    } else if (titleLower.includes("book") || titleLower.includes("read") || titleLower.includes("writing") || titleLower.includes("write")) {
      defaultHabits = [
        "Read or write continuously for 15 minutes",
        "Write down 1 key idea or reflection",
        "Put phone in another room while reading"
      ];
    }

    if (!ai) {
      console.log(`[PIKO Backend] Local habits generated for goal "${goalTitle}":`, defaultHabits);
      return res.json({ habits: defaultHabits });
    }

    try {
      console.log(`[PIKO Backend] Requesting Gemini smart habits for goal: "${goalTitle}"`);
      const prompt = `You are a world-class life coach and habit design expert. 
For the following goal, recommend exactly 3 small, daily, highly actionable and low-friction micro-habits that will help the user achieve it.
Goal: "${goalTitle}"

Rules:
- Each habit MUST be under 55 characters.
- Each habit MUST be highly concrete and specific (not vague like "Stay focused").
- Format your response as a simple JSON array of strings, like this: ["Habit 1", "Habit 2", "Habit 3"]. Do not include markdown code block formatting or any other text outside the JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional life coach and behavior scientist. Your response MUST be valid JSON, containing exactly 3 highly actionable micro-habits formatted as an array of strings.",
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "";
      console.log(`[PIKO Backend] Gemini response for habits:`, text);
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ habits: parsed.slice(0, 3) });
      }
      return res.json({ habits: defaultHabits });
    } catch (err) {
      console.error("[PIKO Backend] Gemini habits generation failed, using fallback:", err);
      return res.json({ habits: defaultHabits });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[PIKO Backend] Vite loaded as middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[PIKO Backend] Serving static production build.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PIKO Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
