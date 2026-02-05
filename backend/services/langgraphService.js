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

const createTools = (googleToken, stravaToken, userProfile) => {
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
) {
  const tools = createTools(googleToken, stravaToken, userProfile);
  const toolNode = new ToolNode(tools);
  const model = new ChatOpenAI({
    modelName: "gpt-5-nano",
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
      
      MANDATORY: Put an event on Google Calendar (if connected). Call 'create_calendar_event' for a 30m FREE slot TODAY (with the name of the routine). The slot MUST be booked AFTER the current time, never before. ColorId 6, TimeZone ${timeZone}. Then generate the routine JSON.`),
      ],
    };
  };

  const analyzer = async (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
    const lang =
      safeLocale === "en"
        ? "English"
        : safeLocale === "fr"
          ? "French"
          : "Spanish";

    const response = await model.invoke([
      new SystemMessage(`Analyze the context (Weather, Calendar, Strava, Profile). 
      Generate exactly 3 very brief thoughts (max 60 characters each) about what you see.
      Be specific (e.g., mention the temperature, a specific Strava activity, or a free slot).
      Language: ${lang}.
      Output ONLY a JSON object: { "thoughts": ["...", "...", "..."] }`),
      lastMessage,
    ]);
    return { messages: [response] };
  };

  const planner = async (state) => {
    const exercisesPath = path.join(
      __dirname,
      "..",
      "common",
      `all-exercises-en.json`,
    );
    const fileContent = await fs.readFile(exercisesPath, "utf-8");
    const exercises = JSON.parse(fileContent).map((ex) => ({
      id: ex.id,
      name: ex.name,
    }));

    const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
    const langInstruction =
      safeLocale === "en"
        ? "English"
        : safeLocale === "fr"
          ? "French"
          : "Spanish";

    const plannerModel = model.bindTools(tools);
    const response = await plannerModel.invoke([
      new SystemMessage(`You are a fitness AI.
      1. MANDATORY: Put an event on Google Calendar (if connected). USE 'create_calendar_event' NOW for a 30m slot (with the name of the routine). The slot MUST be booked AFTER the current time, never in the past.
      2. REASONING: Before calling a tool or outputting JSON, provide a brief sentence in ${langInstruction} explaining what you are doing (e.g., "I'm booking a slot at 4 PM as you're free").
      3. Output routine JSON: { "id": "...", "name": "...", "description": "...", "exercises": [{ "id": "...", "duration": seconds }] }
      4. Write a short and catchy "name" in ${langInstruction} (30 characters maximum, without mentioning the routine duration, and without mentioning the user's name).
      5. Write "description" in ${langInstruction} (between 100 and 300 characters maximum, without mentioning the exercise names, without mentioning the routine name, and without mentioning the routine duration). The description MUST: (a) mention the user's first name naturally at least once; (b) explain why this routine was chosen—if possible, reference today's context (weather (if it’s brings something interesting, but don’t focus on the temperature of the current moment, but rather on the overall weather for the day), calendar, schedule) that justifies these choices; otherwise explain more globally why it fits the user's profile (goals, level, limitations).
      6. DURATION (STRICT): The SUM of all exercise "duration" values MUST be between 300 and 900 seconds (5–15 minutes). Never exceed 900 seconds total. The longer the routine, the greater the number of exercises should be (an exercise should be at minimum 15 seconds, and at most 60 seconds). Choose the exercise durations smartly regarding each exercise nature and user's profile.
      Available exercises: ${JSON.stringify(exercises)}
      Be fast. One-shot.`),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const workflow = new StateGraph(GraphState)
    .addNode("fetcher", fetchContextNode)
    .addNode("analyzer", analyzer)
    .addNode("tools", (state) => toolNode.invoke(state))
    .addNode("planner", planner)
    .addEdge(START, "fetcher")
    .addEdge("fetcher", "analyzer")
    .addEdge("analyzer", "planner")
    .addConditionalEdges("planner", (state) => {
      const last = state.messages[state.messages.length - 1];
      return last.tool_calls?.length > 0 ? "tools" : END;
    })
    .addEdge("tools", "planner");

  const app = workflow.compile();
  const stream = await app.stream(
    { messages: [new HumanMessage(userPrompt)], locale, timeZone },
    { streamMode: "updates" },
  );

  let finalRoutine = null;
  for await (const update of stream) {
    const nodeName = Object.keys(update)[0];
    const data = update[nodeName];

    if (nodeName === "analyzer") {
      const content = data.messages[data.messages.length - 1].content;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.thoughts && Array.isArray(parsed.thoughts)) {
            for (const thought of parsed.thoughts) {
              yield {
                type: "step",
                node: "analyzer",
                description: thought,
              };
            }
          }
        }
      } catch (e) {
        console.error("Analyzer parse error:", e);
      }
    } else if (nodeName === "planner") {
      const lastMsg = data.messages[data.messages.length - 1];
      const content = lastMsg.content;

      // If there is reasoning content (not just JSON), yield it
      if (content && content.trim() && !content.trim().startsWith("{")) {
        yield {
          type: "step",
          node: "planner",
          description: content.trim().split("\n")[0], // Take first line of reasoning
        };
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          finalRoutine = JSON.parse(jsonMatch[0]);

          // Enforce 5–10 min total duration: scale down if AI exceeded 600s
          const exercises = finalRoutine.exercises || [];
          const totalSeconds = exercises.reduce(
            (sum, ex) => sum + (ex.duration || 0),
            0,
          );
          const MAX_TOTAL_SECONDS = 600;
          if (totalSeconds > MAX_TOTAL_SECONDS && totalSeconds > 0) {
            const scale = MAX_TOTAL_SECONDS / totalSeconds;
            finalRoutine.exercises = exercises.map((ex) => ({
              ...ex,
              duration: Math.max(15, Math.round((ex.duration || 0) * scale)),
            }));
          }
        } catch (e) {
          // It might just be reasoning without JSON yet
        }
      }
    }
  }

  if (finalRoutine) yield { type: "final", data: finalRoutine };
}
