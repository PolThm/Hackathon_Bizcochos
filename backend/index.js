import Fastify from 'fastify';
import cors from '@fastify/cors';
import { generateRoutineFromPrompt } from './services/routineGeneratorService.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: ['https://routines-ai.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

fastify.post('/api/generateRoutine', async (request, reply) => {
  const { prompt } = request.body;
  const result = await generateRoutineFromPrompt(prompt);
  return result;
});

fastify.get('/api/health', async (request, reply) => {
  try {
    // Basic connectivity check: try to fetch 1 row from 'exercises' (assuming it exists)
    // or just perform a simple select.
    const { data, error } = await supabase.from('exercises').select('id').limit(1);

    if (error) {
      return reply.status(503).send({
        status: 'error',
        database: 'disconnected',
        message: error.message
      });
    }

    return {
      status: 'ok',
      database: 'connected'
    };
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 4200, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
