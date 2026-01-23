import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabase } from './supabase.js';
import { getRoutine } from './services/routineService.js';
import { getExercises, getExerciseById } from './services/exerciseService.js';
import { getRoutines } from './services/routinesService.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: '*',
  methods: ['GET']
});

fastify.get('/api/routine', async (request, reply) => {
  return getRoutine();
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

fastify.get('/api/routines', async (request, reply) => {
  return getRoutines();
});

fastify.get('/api/exercises', async (request, reply) => {
  try {
    const exercises = await getExercises();
    return exercises;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.message || 'Internal Server Error' });
  }
});

fastify.get('/api/exercises/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const exercise = await getExerciseById(id);
    if (!exercise) {
      return reply.status(404).send({ error: 'Exercise not found' });
    }
    return exercise;
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.message || 'Internal Server Error' });
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
