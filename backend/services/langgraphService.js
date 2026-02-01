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
    // Mocked response
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
1. Use the "id" exactly as provided in the list for each exercise (do not include "name" in exercises, we will add it server-side).
2. Find and set a short and catchy name for the routine based on the request (30 characters maximum).
3. Find and set a short and catchy description for the routine that will explain why this routine is tailored to the request (150 characters maximum).
4. Estimate a realistic "duration" in seconds for each exercise based on its nature.
5. The output MUST be a valid JSON object.
6. Do not include any text before or after the JSON.

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

/**
 * Execute the agentic workflow to generate a routine.
 */
export const generateAgenticRoutine = async (userPrompt, locale = "en") => {
  const initialState = {
    messages: [new HumanMessage(userPrompt)],
    locale: locale,
  };

  const finalState = await app.invoke(initialState);
  const lastMessage = finalState.messages[finalState.messages.length - 1];

  try {
    const content = lastMessage.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const routine = JSON.parse(content);
    return routine;
  } catch (e) {
    console.error("Failed to parse agentic routine:", e);
    throw new Error("Invalid agentic output");
  }
};
