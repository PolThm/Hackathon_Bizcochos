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

// --- 1. Caches ---
const exerciseCache = new Map();
const contextCache = new Map(); // Stores { weather, strava, calendar, timestamp }

async function getExercises(locale, isDemoActivated) {
  const safeLocale = ["en", "fr", "es", "it"].includes(locale) ? locale : "en";
  const cacheKey = `${safeLocale}-${isDemoActivated}`;
  if (exerciseCache.has(cacheKey)) return exerciseCache.get(cacheKey);

  const exercisesFile = isDemoActivated
    ? `demo-exercises-${safeLocale}.json`
    : `all-exercises-${safeLocale}.json`;
  const exercisesPath = path.join(__dirname, "..", "common", exercisesFile);
  try {
    const fileContent = await fs.readFile(exercisesPath, "utf-8");
    const data = JSON.parse(fileContent);
    exerciseCache.set(cacheKey, data);
    return data;
  } catch (e) {
    return [];
  }
}

async function getCachedContext(key, fetchFn, ttl = 14400000) {
  // 4 hours default
  const cached = contextCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) return cached.data;
  const data = await fetchFn();
  contextCache.set(key, { data, timestamp: Date.now() });
  return data;
}

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
  iterationCount: Annotation({
    reducer: (x, y) => x + y,
    default: () => 0,
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
  const searchExercises = new DynamicStructuredTool({
    name: "search_exercises",
    description:
      "Search for exercises by name or benefits. Provide a comma-separated list of keywords (e.g. 'psoas, hips, back').",
    schema: z.object({
      query: z.string().describe("Comma-separated keywords."),
    }),
    func: async ({ query }) => {
      const exercises = await getExercises(locale, isDemoActivated);
      const keywords = query
        .toLowerCase()
        .split(",")
        .map((k) => k.trim());
      let filtered = exercises.filter((ex) =>
        keywords.some(
          (k) =>
            ex.name.toLowerCase().includes(k) ||
            ex.benefits.some((b) => b.toLowerCase().includes(k)),
        ),
      );
      if (filtered.length === 0) filtered = exercises.slice(0, 10);
      return JSON.stringify(
        filtered.slice(0, 25).map((ex) => ({ id: ex.id, name: ex.name })),
      );
    },
  });

  const createCalendarEvent = new DynamicStructuredTool({
    name: "create_calendar_event",
    description: "Put an event on Google Calendar.",
    schema: z.object({
      summary: z.string(),
      description: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      timeZone: z.string().optional(),
    }),
    func: async (args) => {
      const token = googleToken || process.env.GOOGLE_CALENDAR_TOKEN;
      if (!token) return "Calendar not connected.";
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
              colorId: "6",
            }),
          },
        );
        return response.ok ? "Success." : "Failed.";
      } catch (e) {
        return "Error.";
      }
    },
  });

  return [searchExercises, createCalendarEvent];
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
    const [weather, strava, calendar, info] = await Promise.all([
      getCachedContext(`weather-${latitude}-${longitude}`, async () => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`,
          );
          const data = await res.json();
          return `${data.current.temperature_2m}°C`;
        } catch {
          return "Unknown";
        }
      }),
      getCachedContext(`strava-${stravaToken}`, async () => {
        if (!stravaToken) return "Not connected.";
        try {
          const res = await fetch(
            "https://www.strava.com/api/v3/athlete/activities?per_page=1",
            {
              headers: { Authorization: `Bearer ${stravaToken}` },
            },
          );
          const data = await res.json();
          return data[0] ? `${data[0].name} (${data[0].type})` : "None.";
        } catch {
          return "Error.";
        }
      }),
      getCachedContext(`calendar-${googleToken}`, async () => {
        const token = googleToken || process.env.GOOGLE_CALENDAR_TOKEN;
        if (!token) return "Not connected.";
        try {
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=3`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await res.json();
          return data.items?.map((i) => i.summary).join(", ") || "Free.";
        } catch {
          return "Error.";
        }
      }),
      Promise.resolve(
        userProfile
          ? `${userProfile.name}, Goals: ${userProfile.goals}`
          : "Unknown",
      ),
    ]);

    return {
      messages: [
        new HumanMessage(`CONTEXT: Weather: ${weather}, Strava: ${strava}, Calendar: ${calendar}, Profile: ${info}.
        
        TASK: 
        1. Call 'create_calendar_event' for a 30m slot TODAY.
        2. Call 'search_exercises' for appropriate moves.
        3. Generate JSON.`),
      ],
    };
  };
  const planner = async (state) => {
    const plannerModel = model.bindTools(tools);
    const response = await plannerModel.invoke([
      new SystemMessage(`You are a world-class personal trainer.
      
      CRITICAL RULES:
      1. TOOL USE: Call 'search_exercises' (with ALL needed keywords) and 'create_calendar_event' IMMEDIATELY.
      2. NO HALLUCINATIONS: Use ONLY IDs from search results.
      3. STOP: Once tools return, output ONLY JSON. No filler.
      
      TASK:
      Generate JSON: { "id": "...", "name": "...", "description": "...", "exercises": [{ "id": "...", "duration": seconds }] }
      - Routine Duration: Goal is ~600s (10 min).
      - Exercise Duration: 15-60s each.
      
      Be extremely fast.`),
      ...state.messages,
    ]);
    return { messages: [response], iterationCount: 1 };
  };

  const workflow = new StateGraph(GraphState)
    .addNode("fetcher", fetchContextNode)
    .addNode("tools", (state) => toolNode.invoke(state))
    .addNode("planner", planner)
    .addEdge(START, "fetcher")
    .addEdge("fetcher", "planner")
    .addConditionalEdges("planner", (state) => {
      const last = state.messages[state.messages.length - 1];
      const count = state.iterationCount || 0;
      if (count >= 2) return END;
      return last.tool_calls?.length > 0 ? "tools" : END;
    })
    .addEdge("tools", "planner");

  const app = workflow.compile();
  const stream = await app.stream(
    { messages: [new HumanMessage(userPrompt)], locale, timeZone },
    { streamMode: ["messages", "updates"] },
  );

  const TOOL_DESCRIPTIONS = {
    en: {
      search_exercises: "Picking exercises...",
      create_calendar_event: "Syncing calendar...",
    },
    fr: {
      search_exercises: "Choix des exercices...",
      create_calendar_event: "Synchro calendario...",
    },
    es: {
      search_exercises: "Eligiendo ejercicios...",
      create_calendar_event: "Sincronizando calendario...",
    },
    it: {
      search_exercises: "Scelta esercizi...",
      create_calendar_event: "Sincronizzo calendario...",
    },
  };

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
            // No-op
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
          const safeLocale = ["en", "fr", "es", "it"].includes(locale)
            ? locale
            : "en";
          for (const tc of lastMsg.tool_calls) {
            const desc =
              TOOL_DESCRIPTIONS[safeLocale]?.[tc.name] ||
              TOOL_DESCRIPTIONS.en[tc.name] ||
              `Using ${tc.name}...`;
            yield {
              type: "step",
              node: "tools",
              description: desc,
            };
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
