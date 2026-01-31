import Fastify from "fastify";
import cors from "@fastify/cors";
import { generateRoutineFromPrompt } from "./services/routineGeneratorService.js";

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
