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
  const { prompt } = request.body;
  const result = await generateRoutineFromPrompt(prompt);
  return result;
});

const start = async () => {
  try {
    await fastify.listen({ port: 4200, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
