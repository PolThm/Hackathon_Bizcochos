import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: '*',
  methods: ['GET']
});

const routineData = {
  "id": "example",
  "name": "Example",
  "breakDuration": 5,
  "preparationDuration": 5,
  "exercises": [
    {
      "id": 15356,
      "name": "Stretchingg",
      "duration": 20
    },
    {
      "id": 27543,
      "name": "Squats",
      "duration": 45
    },
    {
      "id": 376453,
      "name": "Push-ups",
      "duration": 30
    },
    {
      "id": 446654,
      "name": "Abdominales",
      "duration": 40
    },
    {
      "id": 54356345,
      "name": "Final stretching",
      "duration": 20
    }
  ]
};

fastify.get('/api/routine', async (request, reply) => {
  return routineData;
});

const routinesData = [
  {
    "id": "example",
    "name": "Routine di Esempio",
    "breakDuration": 5,
    "preparationDuration": 5,
    "exercises": [
      {
        "id": 1,
        "name": "Stretching",
        "duration": 30,
        "isPaused": false
      },
      {
        "id": 2,
        "name": "Push-ups",
        "duration": 45
      }
    ]
  },
  {
    "id": "basic",
    "name": "Basic Routine",
    "breakDuration": 10,
    "preparationDuration": 5,
    "exercises": [
      {
        "id": 101,
        "name": "Plank",
        "duration": 60
      }
    ]
  }
];

fastify.get('/api/routines', async (request, reply) => {
  return routinesData;
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
