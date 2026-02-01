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
  feedback: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  iterations: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
});

// --- 3. Define Nodes and Graph Factory ---

const createTools = (googleToken) => {
  const getWeather = new DynamicStructuredTool({
    name: "get_weather",

    description: "Get the current weather using latitude and longitude.",

    schema: z.object({
      latitude: z.number().optional().describe("Latitude of the location"),

      longitude: z.number().optional().describe("Longitude of the location"),

      location: z.string().optional().describe("Name of the location (city)"),
    }),

    func: async ({ latitude, longitude }) => {
      console.log(
        `Tool: Fetching weather for Lat: ${latitude}, Lon: ${longitude}...`,
      );

      if (!latitude || !longitude) {
        return "I need latitude and longitude to check the weather. Please provide them.";
      }

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
        );

        const data = await response.json();

        const temp = data.current.temperature_2m;

        const code = data.current.weather_code;

        // Simple weather code mapping

        let weatherDesc = "Unknown";

        if (code === 0) weatherDesc = "Clear sky";
        else if (code >= 1 && code <= 3) weatherDesc = "Partly cloudy";
        else if (code >= 45 && code <= 48) weatherDesc = "Foggy";
        else if (code >= 51 && code <= 67) weatherDesc = "Rainy";
        else if (code >= 71 && code <= 77) weatherDesc = "Snowy";
        else if (code >= 95) weatherDesc = "Thunderstorm";

        return `The current weather is ${weatherDesc} with a temperature of ${temp}°C.`;
      } catch (error) {
        console.error("Weather fetch error:", error);

        return "Could not fetch weather data at the moment.";
      }
    },
  });

  const getCalendarEvents = new DynamicStructuredTool({
    name: "get_calendar_events",

    description: "Get the calendar events for today",

    schema: z.object({}),

    func: async () => {
      console.log("Tool: Fetching calendar events...");

      const token = googleToken || process.env.GOOGLE_CALENDAR_TOKEN;

      if (!token) {
        return "Google Calendar is not connected. I cannot see the user's schedule for today. Advise the user to connect it in the Home page for a better experience.";
      }

      try {
        const now = new Date();

        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Google Calendar API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
          return "The user has no events scheduled for today. They have a completely free day.";
        }

        const eventsSummary = data.items

          .map((event) => {
            const start = event.start.dateTime || event.start.date;

            const summary = event.summary || "Busy";

            const timeStr = new Date(start).toLocaleTimeString("en-US", {
              hour: "2-digit",

              minute: "2-digit",
            });

            return `${timeStr}: ${summary}`;
          })

          .join("\n");

        return `User's events for today:\n${eventsSummary}`;
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);

        return "I encountered an error trying to read the calendar. I will proceed without schedule context.";
      }
    },
  });

  const getStravaStats = new DynamicStructuredTool({
    name: "get_strava_stats",

    description: "Get recent activity stats from Strava",

    schema: z.object({}),

    func: async () => {
      console.log("Tool: Fetching Strava stats...");

      // Still mocked for now as Strava OAuth is pending

      return "Yesterday you had a moderate workout. Heart rate was stable. Ready for mobility.";
    },
  });

  const getEmails = new DynamicStructuredTool({
    name: "get_emails",

    description: "Get relevant recent emails",

    schema: z.object({}),

    func: async () => {
      console.log("Tool: Fetching emails...");

      // Still mocked for now

      return "No urgent fitness-related emails today.";
    },
  });

  return [getWeather, getCalendarEvents, getStravaStats, getEmails];
};

const toolMapping = {
  get_weather: "Analyzing local weather conditions...",

  get_calendar_events: "Checking your schedule for today...",

  get_strava_stats: "Syncing your latest fitness activity...",

  get_emails: "Looking for coach feedback in your inbox...",
};

export async function* streamAgenticRoutine(
  userPrompt,

  locale = "en",

  latitude,

  longitude,

  googleToken,

  history = [],
) {
  // 0. Initial Log for Memory Retrieval (Marathon Agent Signature)

  yield {
    type: "step",

    node: "memory",

    description:
      history.length > 0
        ? `Thinking Level 0: Retrieving your last ${history.length} sessions for continuity...`
        : "Thinking Level 0: Starting fresh session (no previous history found).",
  };

  // 1. Create tools with the user-specific token

  const tools = createTools(googleToken);

  const toolNode = new ToolNode(tools);

  // 2. Define Model and Nodes (re-created per request to bind specific tools)

  const model = new ChatOpenAI({
    modelName: "gpt-5-nano",

    temperature: 1,

    configuration: {
      baseURL: process.env.ENDPOINT_URL,
    },
  });

  const researcher = async (state) => {
    const { messages } = state;

    const researcherModel = model.bindTools(tools);

    const response = await researcherModel.invoke([
      new SystemMessage(
        "You are a research agent. Your goal is to gather all relevant information (weather, calendar, strava, emails) to help plan a fitness routine. Use the available tools.",
      ),

      ...messages,
    ]);

    return { messages: [response] };
  };

  const planner = async (state) => {
    const { messages, feedback } = state;

    // Load exercises to provide to the planner

    const exercisesPathEn = path.join(
      __dirname,

      "..",

      "common",

      "all-exercises-en.json",
    );

    const fileContent = await fs.readFile(exercisesPathEn, "utf-8");

    const allExercises = JSON.parse(fileContent);

    const simplifiedExercises = allExercises.map((ex) => ({
      id: ex.id,

      name: ex.name,

      benefits: ex.benefits,
    }));

    let systemPrompt = `

  

    

  

        You are a world-class fitness and mobility expert. Your task is to generate a professional workout routine based ONLY on the exercises provided in the list below.

  

    

  

        Available exercises:

  

        ${JSON.stringify(simplifiedExercises, null, 2)}

  

    

  

        User History (Last sessions):

  

        ${JSON.stringify(history, null, 2)}

  

    

  

        Rules:

  

        1. Provide a brief, natural language summary (1-2 sentences) of your reasoning BEFORE the JSON. You MUST explain how you adapted the routine to the user's context: weather, schedule, and specifically their HISTORY (ensure variety from previous sessions).

  

        2. Use the "id" exactly as provided in the list for each exercise.

  

        3. Find and set a short and catchy name for the routine (30 characters maximum).

  

        4. Find and set a short and catchy description (150 characters maximum) explaining why this is tailored to the request and the current context.

  

        5. Estimate a realistic "duration" in seconds for each exercise.

  

        6. The output MUST end with a valid JSON object.

  

    

  

        JSON Structure:

  

        {

  

          "id": "unique-id",

  

          "name": "Routine Name",

  

          "description": "Routine Description",

  

          "exercises": [

  

            {

  

              "id": "exercise-id-from-list",

  

              "duration": number

  

            }

  

          ]

  

        }

  

        `;

    if (feedback) {
      systemPrompt += `\n\nCRITICAL UPDATE: Your previous attempt was reviewed and needs correction.

        Feedback: "${feedback}"

        Please regenerate the routine addressing this feedback explicitly.`;
    }

    const response = await model.invoke([
      new SystemMessage(systemPrompt),

      ...messages,
    ]);

    return { messages: [response] };
  };

  const reviewer = async (state) => {
    const { messages, iterations } = state;

    const lastMessage = messages[messages.length - 1];

    const response = await model.invoke([
      new SystemMessage(
        `You are a senior fitness editor (Reviewer Node - Thinking Level 2). 

          Your goal is to validate the workout routine proposed by the planner.

          

          Check for:

          1. Weather safety (e.g., no outdoor running if it's raining/snowing/stormy).

          2. Time constraints (is it too long based on calendar context?).

          3. Balance (does it mix mobility and strength?).

          

          If the routine is GOOD and SAFE, reply exactly with: "APPROVE".

          If the routine has issues, reply with a concise instruction to fix it.

          

          Context from previous messages: ${messages.map((m) => m.content).join("\n")}`,
      ),

      new HumanMessage(`Review this plan: ${lastMessage.content}`),
    ]);

    return {
      messages: [response],

      iterations: iterations + 1,

      feedback: response.content,
    };
  };

  // 3. Compile Graph (per request)

  const workflow = new StateGraph(GraphState)

    .addNode("researcher", researcher)

    .addNode("tools", (state) => toolNode.invoke(state))

    .addNode("planner", planner)

    .addNode("reviewer", reviewer)

    .addEdge(START, "researcher")

    .addConditionalEdges("researcher", (state) => {
      const lastMessage = state.messages[state.messages.length - 1];

      if (lastMessage.tool_calls?.length > 0) {
        return "tools";
      }

      return "planner";
    })

    .addEdge("tools", "researcher")

    .addEdge("planner", "reviewer")

    .addConditionalEdges("reviewer", (state) => {
      if (
        state.feedback.includes("APPROVE") ||
        state.iterations > 2 // Max 2 retries to prevent infinite loops
      ) {
        return END;
      }

      return "planner";
    });

  const app = workflow.compile();

  // 4. Start Execution

  let contextPrompt = userPrompt;

  if (latitude && longitude) {
    contextPrompt += `\n\nContext: User location is Latitude ${latitude}, Longitude ${longitude}. Use these coordinates when checking the weather.`;
  }

  const initialState = {
    messages: [new HumanMessage(contextPrompt)],

    locale: locale,

    iterations: 0,

    feedback: null,
  };

  const stream = await app.stream(initialState, {
    streamMode: "updates",

    runName: "Bizcocho Marathon Agent Daily Routine",
  });

  let finalRoutine = null;

  for await (const update of stream) {
    const nodeName = Object.keys(update)[0];

    const data = update[nodeName];

    if (nodeName === "researcher") {
      const lastMsg = data.messages[data.messages.length - 1];

      if (lastMsg.tool_calls?.length > 0) {
        for (const toolCall of lastMsg.tool_calls) {
          const desc =
            toolMapping[toolCall.name] || `Consulting ${toolCall.name}...`;

          yield {
            type: "step",

            node: "tools",

            description: desc,
          };
        }
      }
    } else if (nodeName === "tools") {
      for (const msg of data.messages) {
        let content = msg.content;

        if (
          content.includes("Not connected") ||
          content.includes("not connected")
        ) {
          content = "I noticed your Google Calendar isn't connected yet.";
        } else if (
          content.includes("User's events") ||
          content.includes("Events for today")
        ) {
          content =
            "I've analyzed your schedule to find the best time for your routine.";
        } else if (content.includes("Sunny") || content.includes("Clear")) {
          content = "It's a clear day, great for any type of session!";
        } else if (
          content.includes("Rain") ||
          content.includes("Snow") ||
          content.includes("Storm")
        ) {
          content = "Weather looks challenging, I'll favor indoor exercises.";
        } else if (content.includes("temperature")) {
          content = "Factoring in the local temperature for your comfort.";
        }

        yield {
          type: "step",

          node: "tools",

          description: content,
        };
      }
    } else if (nodeName === "planner") {
      const lastMsg = data.messages[data.messages.length - 1];

      const content = lastMsg.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      // Temporarily store the routine, but don't emit "final" yet until Reviewer approves

      if (jsonMatch) {
        try {
          finalRoutine = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Partial or invalid JSON
        }
      }

      let reasoning = content

        .replace(/```json[\s\S]*```/g, "")

        .replace(/\{[\s\S]*\}/g, "")

        .trim();

      if (reasoning) {
        if (reasoning.length > 150) {
          reasoning = reasoning.substring(0, 150) + "...";
        }

        yield {
          type: "step",

          node: "planner",

          description: `Drafting Plan: ${reasoning}`,
        };
      } else {
        yield {
          type: "step",

          node: "planner",

          description: "Drafting the ideal exercise sequence for you...",
        };
      }
    } else if (nodeName === "reviewer") {
      const feedback = data.feedback;

      if (feedback && !feedback.includes("APPROVE")) {
        yield {
          type: "step",

          node: "reviewer",

          description: `Thinking Level 2 (Critique): ${feedback}`,
        };

        yield {
          type: "step",

          node: "reviewer",

          description: `Self-Correcting...`,
        };
      } else {
        yield {
          type: "step",

          node: "reviewer",

          description:
            "Thinking Level 2: Plan approved. Validating constraints...",
        };
      }
    }
  }

  // After the graph finishes, we emit the final routine

  if (finalRoutine) {
    yield { type: "final", data: finalRoutine };
  }
}
