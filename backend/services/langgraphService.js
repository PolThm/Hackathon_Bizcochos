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

// --- 1. Define Tools ---

const getWeather = new DynamicStructuredTool({
  name: "get_weather",
  description: "Get the current weather for a location",
  schema: z.object({
    location: z
      .string()
      .describe("The city or location to get the weather for"),
  }),
  func: async ({ location }) => {
    console.log(`Tool: Fetching weather for ${location}...`);
    return `The weather in ${location} is sunny with 22°C. Perfect for outdoor activity!`;
  },
});

const getCalendarEvents = new DynamicStructuredTool({
  name: "get_calendar_events",
  description: "Get the calendar events for today",
  schema: z.object({}),
  func: async () => {
    console.log("Tool: Fetching calendar events...");
    return "Today you have: 10:00 AM Team Meeting, 2:00 PM Deep Work, 5:00 PM Physiotherapy session for shoulder pain.";
  },
});

const getStravaStats = new DynamicStructuredTool({
  name: "get_strava_stats",
  description: "Get recent activity stats from Strava",
  schema: z.object({}),
  func: async () => {
    console.log("Tool: Fetching Strava stats...");
    return "Yesterday you ran 10km. Your legs might be stiff. Average heart rate was 155 bpm.";
  },
});

const getEmails = new DynamicStructuredTool({
  name: "get_emails",
  description: "Get relevant recent emails",
  schema: z.object({}),
  func: async () => {
    console.log("Tool: Fetching emails...");
    return "Email from Coach: 'Focus on hip mobility this week to improve your running form'.";
  },
});

const tools = [getWeather, getCalendarEvents, getStravaStats, getEmails];
const toolNode = new ToolNode(tools);

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
});

// --- 3. Define Nodes ---

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
  const { messages } = state;

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

  const systemPrompt = `
You are a world-class fitness and mobility expert. Your task is to generate a professional workout routine based ONLY on the exercises provided in the list below.

Available exercises:
${JSON.stringify(simplifiedExercises, null, 2)}

Rules:
1. Provide a brief, natural language summary (1-2 sentences) of your reasoning BEFORE the JSON. Explain how you adapted the routine to the user's context (e.g., "Creating a routine after aerobic workout, adapting for your doctor appointment...").
2. Use the "id" exactly as provided in the list for each exercise.
3. Find and set a short and catchy name for the routine (30 characters maximum).
4. Find and set a short and catchy description explaining why this is tailored to the request (150 characters maximum).
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

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  return { messages: [response] };
};

// --- 4. Define Graph ---

const workflow = new StateGraph(GraphState)
  .addNode("researcher", researcher)
  .addNode("tools", (state) => toolNode.invoke(state))
  .addNode("planner", planner)
  .addEdge(START, "researcher")
  .addConditionalEdges("researcher", (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls?.length > 0) {
      return "tools";
    }
    return "planner";
  })
  .addEdge("tools", "researcher")
  .addEdge("planner", END);

export const app = workflow.compile();

const toolMapping = {
  get_weather: "Checking the weather...",

  get_calendar_events: "Consulting your calendar...",

  get_strava_stats: "Reading your latest workouts on Strava...",

  get_emails: "Checking for relevant recent emails...",
};

/**

 * Stream the agentic workflow events.

 */

export async function* streamAgenticRoutine(userPrompt, locale = "en") {
  const initialState = {
    messages: [new HumanMessage(userPrompt)],

    locale: locale,
  };

  const stream = await app.stream(initialState, {
    streamMode: "updates",
  });

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

        // Transform mocked data into natural language

        if (content.includes("10km")) {
          content =
            "I see you ran 10km yesterday, your legs might feel a bit heavy.";
        } else if (content.includes("sunny")) {
          content = "It looks like a sunny day, perfect for some stretching!";
        } else if (content.includes("Physiotherapy")) {
          content =
            "I'm considering your physiotherapy session for your shoulder today.";
        } else if (content.includes("hip mobility")) {
          content = "Your coach suggests focusing on hip mobility this week.";
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

      // Extract reasoning and make it natural

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

          description: reasoning,
        };
      } else {
        yield {
          type: "step",

          node: "planner",

          description: "Crafting the ideal exercise sequence for you...",
        };
      }

      if (jsonMatch) {
        try {
          const routine = JSON.parse(jsonMatch[0]);

          yield { type: "final", data: routine };
        } catch (e) {
          // Partial or invalid JSON
        }
      }
    }
  }
}
