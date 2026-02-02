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

const createTools = (googleToken, userProfile) => {
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
    description: "Create a new event in the user's Google Calendar.",
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

  return [getWeather, getCalendarEvents, createCalendarEvent, getUserInfo];
};

export async function* streamAgenticRoutine(
  userPrompt,
  locale = "en",
  latitude,
  longitude,
  googleToken,
  userProfile = null,
  timeZone = "Europe/Rome",
) {
  const tools = createTools(googleToken, userProfile);
  const toolNode = new ToolNode(tools);
  const model = new ChatOpenAI({
    modelName: "gpt-5-nano",
    temperature: 0.5,
    configuration: { baseURL: process.env.ENDPOINT_URL },
  });

  const fetchContextNode = async () => {
    const [weather, calendar, info] = await Promise.all([
      tools.find((t) => t.name === "get_weather").func({ latitude, longitude }),
      tools.find((t) => t.name === "get_calendar_events").func({}),
      tools.find((t) => t.name === "get_user_info").func(),
    ]);

    return {
      messages: [
        new SystemMessage(`CONTEXT:
      - Weather: ${weather}
      - Calendar: ${calendar}
      - Profile: ${info}
      
      Mandate: Call 'create_calendar_event' for a 30m FREE slot TODAY. ColorId 6, TimeZone ${timeZone}. Then generate the routine JSON.`),
      ],
    };
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

    const plannerModel = model.bindTools(tools);
    const response = await plannerModel.invoke([
      new SystemMessage(`You are a fitness AI. 
      1. USE 'create_calendar_event' NOW for a 30m slot.
      2. Output routine JSON: { "id": "...", "name": "...", "description": "...", "exercises": [{ "id": "...", "duration": seconds }] }
      Available exercises: ${JSON.stringify(exercises)}
      Be fast. One-shot.`),
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
    { streamMode: "updates" },
  );

  let finalRoutine = null;
  for await (const update of stream) {
    const nodeName = Object.keys(update)[0];
    const data = update[nodeName];

    if (nodeName === "fetcher") {
      yield {
        type: "step",
        node: "fetcher",
        description: "Analisi contesto e scheduling...",
      };
    } else if (nodeName === "tools") {
      for (const msg of data.messages) {
        if (msg.content.includes("Successfully")) {
          yield {
            type: "step",
            node: "tools",
            description: "Ho riservato uno slot nel tuo calendario! ✅",
          };
        }
      }
    } else if (nodeName === "planner") {
      const content = data.messages[data.messages.length - 1].content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          finalRoutine = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    }
  }

  if (finalRoutine) yield { type: "final", data: finalRoutine };
}
