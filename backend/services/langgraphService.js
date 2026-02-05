// --- 1. Imports and Setup ---
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1b. Global Cache for Exercises ---
let exercisesCache = {
  en: null,
  es: null,
  fr: null,
  demo_en: null,
  demo_es: null,
  demo_fr: null,
};

async function loadExercises(locale, isDemo) {
  const cacheKey = isDemo ? `demo_${locale}` : locale;
  if (exercisesCache[cacheKey]) return exercisesCache[cacheKey];

  const fileName = isDemo
    ? `demo-exercises-${locale}.json`
    : `all-exercises-${locale}.json`;
  const filePath = path.join(__dirname, "..", "common", fileName);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    exercisesCache[cacheKey] = JSON.parse(content);
    return exercisesCache[cacheKey];
  } catch (e) {
    console.error(`Error loading exercises for ${cacheKey}:`, e);
    return [];
  }
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
  isDemo: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
});

// --- 3. Define Tools ---

const createTools = (googleToken, stravaToken, userProfile, locale, isDemo) => {
  const searchExercises = new DynamicStructuredTool({
    name: "search_exercises",
    description:
      "Search for specific exercises in the database by name or muscle group. Returns a list of exercise IDs and names.",
    schema: z.object({
      query: z
        .string()
        .describe("The search term (e.g., 'psoas', 'legs', 'warmup')"),
    }),
    func: async ({ query }) => {
      const allEx = await loadExercises(locale, isDemo);
      const q = query.toLowerCase();
      // Simple search in name and instructions (simulating what a vector search would do better)
      const results = allEx
        .filter(
          (ex) =>
            ex.name.toLowerCase().includes(q) ||
            ex.instructions.some((i) => i.toLowerCase().includes(q)),
        )
        .slice(0, 15) // Limit results to avoid context stuffing
        .map((ex) => ({ id: ex.id, name: ex.name }));

      return results.length > 0
        ? JSON.stringify(results)
        : "No exercises found for this query. Try a more general term like 'stretch' or 'mobility'.";
    },
  });

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
    searchExercises,
    getWeather,
    getCalendarEvents,
    createCalendarEvent,
    getUserInfo,
    getStravaActivities,
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
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    configuration: { baseURL: process.env.ENDPOINT_URL },
  });

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
        new SystemMessage(`CONTEXT:
      - Weather: ${weather}
      - Calendar: ${calendar}
      - Strava (Last activities): ${strava}
      - Profile: ${info}
      - Current time (UTC): ${currentTimeIso}
      
      MANDATORY: 
      1. ANALYZE context and Strava activities.
      2. SEARCH for exercises using 'search_exercises' based on your analysis.
      3. BOOK a 30m slot on Google Calendar with 'create_calendar_event'.
      4. GENERATE the routine JSON.`),
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
      new SystemMessage(`You are a world-class personal trainer.
      
      WORKFLOW:
      1. If you haven't searched for exercises yet, use 'search_exercises' to find relevant movements based on the user's Strava activity or goals.
      2. If you haven't booked the calendar, use 'create_calendar_event'.
      3. Once you have the exercise IDs from the search tool, output the final routine JSON.

      CRITICAL REASONING:
      - Strava Run/Ride -> Search for: psoas, hamstrings, glutes, lower back.
      - Strava Weight Training -> Search for: chest, shoulders, or specific muscle groups.
      - Sedentary -> Search for: opening, posture, chest, hip flexors.

      OUTPUT FORMAT:
      - Reasoning: A brief sentence in ${langInstruction} explaining your choices.
      - JSON: { "id": "...", "name": "...", "description": "...", "exercises": [{ "id": "...", "duration": seconds }] }
      
      Total routine duration: 300-600 seconds.`),
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
    {
      messages: [new HumanMessage(userPrompt)],
      locale,
      timeZone,
      isDemo: isDemoActivated,
    },
    { streamMode: "updates" },
  );

  let finalRoutine = null;
  for await (const update of stream) {
    const nodeName = Object.keys(update)[0];
    const data = update[nodeName];

    if (nodeName === "planner") {
      const lastMsg = data.messages[data.messages.length - 1];
      const content = lastMsg.content;

      if (lastMsg.tool_calls?.length > 0) {
        for (const tc of lastMsg.tool_calls) {
          if (tc.name === "search_exercises") {
            const query =
              typeof tc.args === "string"
                ? JSON.parse(tc.args).query
                : tc.args.query;
            yield {
              type: "step",
              node: "planner",
              description: `Searching for ${query} exercises...`,
            };
          } else if (tc.name === "create_calendar_event") {
            yield {
              type: "step",
              node: "planner",
              description: "Booking your session in Google Calendar...",
            };
          }
        }
      }

      if (content && content.trim() && !content.trim().startsWith("{")) {
        yield {
          type: "step",
          node: "planner",
          description: content.trim().split("\n")[0],
        };
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          finalRoutine = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Ignore partial JSON or parsing errors during streaming
        }
      }
    }
  }

  if (finalRoutine) yield { type: "final", data: finalRoutine };
}
