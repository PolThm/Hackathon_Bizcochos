import Fastify from "fastify";
import cors from "@fastify/cors";
import { generateRoutineFromPrompt } from "./services/routineGeneratorService.js";
import { generateAgenticRoutine } from "./services/langgraphService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: ["https://routines-ai.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.post("/api/generateRoutine", async (request) => {
  const { prompt, locale } = request.body;
  const result = await generateRoutineFromPrompt(prompt, locale);
  return result;
});

fastify.post("/api/generateDailyRoutine", async (request) => {
  const { locale } = request.body;

  try {
    const prompt =
      "Please generate my routine for today based on my context (weather, calendar, strava, emails).";
    const routine = await generateAgenticRoutine(prompt, locale);

    // Map translated names (similar to routineGeneratorService.js)
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

    return {
      status: "ok",
      data: routine,
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      status: "error",
      message: error.message,
    };
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
