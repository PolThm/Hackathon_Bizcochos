import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parse as partialParse } from "partial-json";
import { getModel } from "./aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. Define State ---

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  locale: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "en",
  }),
  timeZone: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "Europe/Rome",
  }),
});

// --- 3. Define Nodes and Graph Factory ---

const createTools = (
  googleToken,
  stravaToken,
  userProfile,
  locale = "en",
  isDemoActivated = false,
) => {
  const getUserInfo = new DynamicStructuredTool({
    name: "get_user_info",
    description: "Get user's profile information.",
    schema: z.object({}),
    func: async () => {
      if (!userProfile) return "No user profile found.";
      return `User Profile:
      - Name: ${userProfile.name}
      - Goals: ${userProfile.goals}
      - Fitness Level: ${userProfile.level}
      - Injuries/Limitations: ${userProfile.limitations || "None"}`;
    },
  });

  const searchExercises = new DynamicStructuredTool({
    name: "search_exercises",
    description:
      "Search for exercises by name or benefits (e.g. 'psoas', 'back', 'warmup'). Returns a list of exercises with their IDs and names.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The search term (e.g., 'hamstrings', 'shoulders', 'morning').",
        ),
    }),
    func: async ({ query }) => {
      try {
        const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
        const exercisesFile = isDemoActivated
          ? `demo-exercises-${safeLocale}.json`
          : `all-exercises-${safeLocale}.json`;
        const exercisesPath = path.join(
          __dirname,
          "..",
          "common",
          exercisesFile,
        );
        const fileContent = await fs.readFile(exercisesPath, "utf-8");
        const exercises = JSON.parse(fileContent);
        const q = query.toLowerCase();
        const results = exercises
          .filter(
            (ex) =>
              ex.name.toLowerCase().includes(q) ||
              ex.benefits.some((b) => b.toLowerCase().includes(q)),
          )
          .map((ex) => ({ id: ex.id, name: ex.name, benefits: ex.benefits }));
        return JSON.stringify(results.slice(0, 20));
      } catch (e) {
        return "Error searching exercises.";
      }
    },
  });

  const getStravaActivities = new DynamicStructuredTool({
    name: "get_strava_activities",
    description: "Get recent Strava activities.",
    schema: z.object({}),
    func: async () => {
      if (!stravaToken) return "Strava not connected.";
      try {
        const response = await fetch(
          "https://www.strava.com/api/v3/athlete/activities?per_page=5",
          {
            headers: { Authorization: `Bearer ${stravaToken}` },
          },
        );
        if (!response.ok) return "Error fetching Strava activities.";
        const activities = await response.json();
        if (!activities.length) return "No recent activities.";
        return activities
          .map(
            (a) =>
              `- ${a.start_date_local.split("T")[0]}: ${a.name} (${a.type}, ${(a.distance / 1000).toFixed(1)}km, ${(a.moving_time / 60).toFixed(0)}min)`,
          )
          .join("\n");
      } catch (e) {
        return "Error connecting to Strava.";
      }
    },
  });

  const getWeather = new DynamicStructuredTool({
    name: "get_weather",
    description: "Get the current weather.",
    schema: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    func: async ({ latitude, longitude }) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
        );
        const data = await response.json();
        return `Weather: ${data.current.temperature_2m}°C, Code: ${data.current.weather_code}`;
      } catch (e) {
        return "Weather unavailable.";
      }
    },
  });

  const getCalendarEvents = new DynamicStructuredTool({
    name: "get_calendar_events",
    description: "Get the calendar events for today",
    schema: z.object({}),
    func: async () => {
      const token = googleToken || process.env.GOOGLE_CALENDAR_TOKEN;
      if (!token) return "Calendar not connected.";
      try {
        const now = new Date();
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!data.items?.length) return "Free day.";
        return data.items
          .map((e) => `${e.start.dateTime || e.start.date}: ${e.summary}`)
          .join("\n");
      } catch (e) {
        return "Error reading calendar.";
      }
    },
  });

  const createCalendarEvent = new DynamicStructuredTool({
    name: "create_calendar_event",
    description:
      "MANDATORY: Put an event on Google Calendar (if connected). Create a new event in the user's Google Calendar.",
    schema: z.object({
      summary: z.string(),
      description: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      timeZone: z.string().optional(),
      colorId: z.string().optional(),
    }),
    func: async (args) => {
      const token = googleToken || process.env.GOOGLE_CALENDAR_TOKEN;
      if (!token) return "Calendar not connected.";
      const now = new Date();
      const startTime = new Date(args.startTime);
      if (startTime < now) {
        return "Cannot schedule in the past. The slot must start at or after the current time.";
      }
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary: args.summary,
              description: args.description,
              start: {
                dateTime: args.startTime,
                timeZone: args.timeZone || "UTC",
              },
              end: { dateTime: args.endTime, timeZone: args.timeZone || "UTC" },
              colorId: args.colorId || "6",
            }),
          },
        );
        return response.ok
          ? "Successfully created the calendar event."
          : "Failed to create event.";
      } catch (e) {
        return "Error creating event.";
      }
    },
  });

  return [
    getWeather,
    getCalendarEvents,
    createCalendarEvent,
    getUserInfo,
    getStravaActivities,
    searchExercises,
  ];
};

export async function* streamAgenticRoutine(
  userPrompt,
  locale = "en",
  latitude,
  longitude,
  googleToken,
  userProfile = null,
  timeZone = "Europe/Rome",
  stravaToken = null,
  isDemoActivated = false,
) {
  const tools = createTools(
    googleToken,
    stravaToken,
    userProfile,
    locale,
    isDemoActivated,
  );
  const toolNode = new ToolNode(tools);
  const model = getModel();

  const fetchContextNode = async () => {
    const [weather, calendar, info, strava] = await Promise.all([
      tools.find((t) => t.name === "get_weather").func({ latitude, longitude }),
      tools.find((t) => t.name === "get_calendar_events").func({}),
      tools.find((t) => t.name === "get_user_info").func(),
      tools.find((t) => t.name === "get_strava_activities").func(),
    ]);

    const now = new Date();
    const currentTimeIso = now.toISOString();
    return {
      messages: [
        new HumanMessage(`CONTEXT:
      - Weather: ${weather}
      - Calendar: ${calendar}
      - Strava (Last activities): ${strava}
      - Profile: ${info}
      - Current time (UTC): ${currentTimeIso}
      
      MANDATORY: 
      1. Put an event on Google Calendar (if connected). Call 'create_calendar_event' for a 30m FREE slot TODAY (with the name of the routine). The slot MUST be booked AFTER the current time, never before. ColorId 6, TimeZone ${timeZone}.
      2. SEARCH for appropriate exercises using 'search_exercises' based on the context (Strava activities, user goals, etc.).
      3. Generate the routine JSON.`),
      ],
    };
  };

  const planner = async (state) => {
    const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
    const langInstruction =
      safeLocale === "en"
        ? "English"
        : safeLocale === "fr"
          ? "French"
          : "Spanish";

    const plannerModel = model.bindTools(tools);
    const response = await plannerModel.invoke([
      new SystemMessage(`You are a world-class personal trainer and mobility / stretching expert.
      
      CRITICAL REASONING RULES:
      1. ANALYZE context (Strava, Weather, Calendar, Profile).
      2. PARALLEL TOOLS: You MUST call 'search_exercises' and 'create_calendar_event' in the SAME turn if possible to save time.
      3. SEARCH: Use 'search_exercises' to find suitable exercises. Do not guess exercise IDs.
      4. REASONING: Provide brief sentences in ${langInstruction} (max 60 chars each, ending with "...") explaining your strategy.
      
      TASK:
      1. Output routine JSON: { "id": "...", "name": "...", "description": "...", "exercises": [{ "id": "...", "duration": seconds }] }
      2. Write a short and catchy "name" in ${langInstruction} (30 characters maximum).
      3. Write "description" in ${langInstruction} (100-300 chars). Be specific about Strava activities and the calendar slot.
      4. DURATION: Total duration between 300 and 900 seconds. Each exercise 15-60s.
      
      Be precise. Stream the JSON as soon as you have the exercise IDs.`),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const workflow = new StateGraph(GraphState)
    .addNode("fetcher", fetchContextNode)
    .addNode("tools", (state) => toolNode.invoke(state))
    .addNode("planner", planner)
    .addEdge(START, "fetcher")
    .addEdge("fetcher", "planner")
    .addConditionalEdges("planner", (state) => {
      const last = state.messages[state.messages.length - 1];
      return last.tool_calls?.length > 0 ? "tools" : END;
    })
    .addEdge("tools", "planner");

  const app = workflow.compile();
  const stream = await app.stream(
    { messages: [new HumanMessage(userPrompt)], locale, timeZone },
    { streamMode: ["messages", "updates"] },
  );

  let finalRoutine = null;
  let fullContent = "";
  let yieldedExerciseIds = new Set();

  for await (const [mode, update] of stream) {
    if (mode === "messages") {
      const [msg, metadata] = update;
      if (metadata.langgraph_node === "planner" && msg.content) {
        fullContent += msg.content;

        // Try to parse partial JSON
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const partial = partialParse(jsonMatch[0]);
            if (
              partial &&
              partial.exercises &&
              Array.isArray(partial.exercises)
            ) {
              for (const ex of partial.exercises) {
                if (ex.id && !yieldedExerciseIds.has(ex.id)) {
                  yieldedExerciseIds.add(ex.id);
                  yield {
                    type: "partial_exercise",
                    data: ex,
                  };
                }
              }
            }
          } catch (e) {
            // Ignore partial parse errors
          }
        }
      }
    } else if (mode === "updates") {
      const nodeName = Object.keys(update)[0];
      const data = update[nodeName];

      if (nodeName === "planner") {
        const lastMsg = data.messages[data.messages.length - 1];
        const content = lastMsg.content;

        if (lastMsg.tool_calls?.length > 0) {
          for (const tc of lastMsg.tool_calls) {
            yield {
              type: "step",
              node: "tools",
              description: `Using tool: ${tc.name}...`,
            };
          }
        }

        // Reasoning lines
        if (content && content.trim() && !content.trim().startsWith("{")) {
          const lines = content
            .trim()
            .split("\n")
            .filter((l) => l.trim() && !l.trim().startsWith("{"));
          for (const line of lines) {
            if (line.length > 5 && !line.includes('":')) {
              yield {
                type: "step",
                node: "planner",
                description: line,
              };
            }
          }
        }

        const finalJsonMatch = content.match(/\{[\s\S]*\}/);
        if (finalJsonMatch) {
          try {
            finalRoutine = JSON.parse(finalJsonMatch[0]);
          } catch (e) {
            // No-op
          }
        }
      }
    }
  }

  if (finalRoutine) {
    // Post-process final routine
    const exercises = finalRoutine.exercises || [];
    const clampDuration = (d) => Math.max(15, Math.min(60, Math.round(d || 0)));
    let processed = exercises.map((ex) => ({
      ...ex,
      duration: clampDuration(ex.duration),
    }));

    const totalSeconds = processed.reduce(
      (sum, ex) => sum + (ex.duration || 0),
      0,
    );
    const MAX_TOTAL_SECONDS = 900;
    if (totalSeconds > MAX_TOTAL_SECONDS && totalSeconds > 0) {
      const scale = MAX_TOTAL_SECONDS / totalSeconds;
      processed = processed.map((ex) => ({
        ...ex,
        duration: clampDuration((ex.duration || 0) * scale),
      }));
    }
    finalRoutine.exercises = processed;
    // Fill in exercise names if missing (since the planner might only have IDs)
    const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
    const exercisesFile = isDemoActivated
      ? `demo-exercises-${safeLocale}.json`
      : `all-exercises-${safeLocale}.json`;
    const exercisesPath = path.join(__dirname, "..", "common", exercisesFile);
    try {
      const fileContent = await fs.readFile(exercisesPath, "utf-8");
      const allExercises = JSON.parse(fileContent);
      const idToName = Object.fromEntries(
        allExercises.map((ex) => [ex.id, ex.name]),
      );

      finalRoutine.exercises = finalRoutine.exercises.map((ex) => ({
        ...ex,
        name: ex.name || idToName[ex.id] || "Unknown Exercise",
      }));
    } catch (e) {
      console.error("Error enrichment:", e);
    }

    yield { type: "final", data: finalRoutine };
  }
}

const DEMO_STEP_MESSAGES = {
  en: [
    "Analyzing your profile — focusing on lower back relief...",
    "Checking today's weather: 14°C and sunny — perfect for mobility work!",
    "Reviewing your Strava: 8km run yesterday — targeting hip flexors & lower back...",
    "Syncing with Google Health — your sleep data suggests a gentle flow today...",
    "Booking a 30-min slot in your Google Calendar for 6:30 PM...",
    "Selecting exercises to release tension in your lower back...",
    "Pol, your Lower Back Pain routine is ready!",
  ],
  fr: [
    "Analyse de ton profil — focus sur le soulagement du bas du dos...",
    "Météo du jour : 14°C et ensoleillé — idéal pour la mobilité !",
    "Strava : 8 km hier — je cible les fléchisseurs de hanche et le bas du dos...",
    "Sync avec Google Health — ton sommeil suggère un flux doux aujourd'hui...",
    "Réservation d'un créneau de 30 min dans ton Google Calendar à 18h30...",
    "Sélection d'exercices pour libérer les tensions du bas du dos...",
    "Pol, ta routine Mal de dos est prête !",
  ],
  es: [
    "Analizando tu perfil — enfoque en alivio de la zona lumbar...",
    "Clima de hoy: 14°C y soleado — ¡perfecto para movilidad!",
    "Strava: 8 km ayer — enfocando flexores de cadera y zona lumbar...",
    "Sincronizando con Google Health — tu sueño sugiere un flujo suave hoy...",
    "Reservando una franja de 30 min en tu Google Calendar a las 18:30...",
    "Seleccionando ejercicios para liberar la tensión en tu zona lumbar...",
    "¡Pol, tu rutina Dolor lumbar está lista!",
  ],
};

const DEMO_DELAY_MS = 3500;

const DEMO_ROUTINE_META = {
  en: {
    name: "Lower Back Pain Relief",
    description:
      "Pol, a gentle mobility flow designed to release tension in your lower back. Based on your 8km run yesterday, today's sunny weather, and your sleep data from Google Health — this 8-exercise sequence targets hip flexors, hamstrings and spine to ease discomfort.",
  },
  fr: {
    name: "Soulagement du mal de dos",
    description:
      "Pol, un flux de mobilité doux pour libérer les tensions du bas du dos. Basé sur ta course de 8 km hier, la météo ensoleillée d'aujourd'hui et tes données de sommeil Google Health — cette séquence de 8 exercices cible les fléchisseurs de hanche, ischio-jambiers et la colonne pour soulager l'inconfort.",
  },
  es: {
    name: "Alivio del dolor lumbar",
    description:
      "Pol, un flujo de movilidad suave para liberar la tensión en la zona lumbar. Basado en tu carrera de 8 km de ayer, el clima soleado de hoy y tus datos de sueño de Google Health — esta secuencia de 8 ejercicios trabaja flexores de cadera, isquiotibiales y columna para aliviar las molestias.",
  },
};

export async function* streamDemoRoutine(locale = "en") {
  const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
  const messages = DEMO_STEP_MESSAGES[safeLocale] || DEMO_STEP_MESSAGES.en;

  for (const msg of messages) {
    yield { type: "step", node: "demo", description: msg };
    await new Promise((r) => setTimeout(r, DEMO_DELAY_MS));
  }

  const routinePath = path.join(__dirname, "..", "common", "routine-demo.json");
  const exercisesPath = path.join(
    __dirname,
    "..",
    "common",
    `demo-exercises-${safeLocale}.json`,
  );

  const [routineContent, exercisesContent] = await Promise.all([
    fs.readFile(routinePath, "utf-8"),
    fs.readFile(exercisesPath, "utf-8"),
  ]);

  const routine = JSON.parse(routineContent);
  const meta = DEMO_ROUTINE_META[safeLocale] || DEMO_ROUTINE_META.en;
  routine.name = meta.name;
  routine.description = meta.description;
  const localeExercises = JSON.parse(exercisesContent);
  const idToName = Object.fromEntries(
    localeExercises.map((ex) => [ex.id, ex.name]),
  );

  routine.exercises = (routine.exercises || []).map((ex) => ({
    id: ex.exerciseId ?? ex.id,
    name: idToName[ex.exerciseId] ?? ex.name ?? "Unknown",
    duration: ex.duration,
  }));

  routine.breakDuration = 5;
  routine.preparationDuration = 5;

  yield { type: "final", data: routine };
}
