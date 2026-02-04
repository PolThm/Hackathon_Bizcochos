import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { generateRoutineFromPrompt } from "./services/routineGeneratorService.js";
import { streamAgenticRoutine } from "./services/langgraphService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: ["https://routines-ai.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

fastify.post("/api/generateRoutine", async (request) => {
  const { prompt, locale } = request.body;
  const result = await generateRoutineFromPrompt(prompt, locale);
  return result;
});

fastify.post("/api/generateDailyRoutine", async (request, reply) => {
  const {
    locale,
    latitude,
    longitude,
    prompt,
    googleToken,
    userProfile,
    timeZone,
    stravaToken,
  } = request.body;

  const stream = new Readable({
    read() {},
  });

  reply.type("application/x-ndjson").send(stream);

  try {
    const finalPrompt =
      prompt ||
      "Please generate my routine for today based on my context (weather, calendar, strava, emails).";
    const agentStream = streamAgenticRoutine(
      finalPrompt,
      locale,
      latitude,
      longitude,
      googleToken,
      userProfile,
      timeZone,
      stravaToken,
    );

    for await (const chunk of agentStream) {
      if (chunk.type === "final") {
        const routine = chunk.data;
        const safeLocale = ["en", "fr", "es"].includes(locale) ? locale : "en";
        const localePath = path.join(
          __dirname,
          "common",
          `all-exercises-${safeLocale}.json`,
        );
        const localeContent = await fs.readFile(localePath, "utf-8");
        const localeExercises = JSON.parse(localeContent);
        const idToName = Object.fromEntries(
          localeExercises.map((ex) => [ex.id, ex.name]),
        );

        routine.exercises = (routine.exercises || []).map((ex) => ({
          id: ex.id,
          name: idToName[ex.id] ?? ex.name ?? "Unknown",
          duration: ex.duration,
        }));

        routine.breakDuration = 5;
        routine.preparationDuration = 5;

        stream.push(JSON.stringify({ type: "data", data: routine }) + "\n");
      } else {
        stream.push(JSON.stringify(chunk) + "\n");
      }
    }
    stream.push(null);
  } catch (error) {
    fastify.log.error(error);
    stream.push(
      JSON.stringify({ type: "error", message: error.message }) + "\n",
    );
    stream.push(null);
  }
});

fastify.post("/api/auth/strava", async (request, reply) => {
  const { code } = request.body;
  if (!code) {
    return reply.status(400).send({ error: "Missing code" });
  }

  try {
    const params = new URLSearchParams();
    params.append("client_id", process.env.STRAVA_CLIENT_ID);
    params.append("client_secret", process.env.STRAVA_CLIENT_SECRET);
    params.append("code", code);
    params.append("grant_type", "authorization_code");

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to exchange token");
    }

    return data;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Auth failed" });
  }
});

fastify.get("/api/health", async () => {
  // Basic connectivity check: try to fetch 1 row from 'exercises' (assuming it exists)
  // or just perform a simple select.
  // const { data, error } = await supabase.from('exercises').select('id').limit(1);

  // if (error) {
  //   return reply.status(503).send({
  //     status: 'error',
  //     database: 'disconnected',
  //     message: error.message
  //   });
  // }

  return {
    status: "ok",
    database: "connected (mocked)", // supabase logic commented out due to missing dependency
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 4200, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
