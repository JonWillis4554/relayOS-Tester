import Fastify from 'fastify';
import { streetlightsRoutes } from './routes/streetlights';
import { workOrdersRoutes } from './routes/work-orders';

const API_KEY = process.env.TEST_TARGET_API_KEY;
if (!API_KEY) {
  throw new Error('TEST_TARGET_API_KEY is required');
}

const app = Fastify({
  logger: {
    // Prevent the bearer token from appearing in logs
    redact: ['req.headers.authorization'],
    level: 'info',
  },
});

app.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health') return;

  const auth = request.headers.authorization;
  if (!auth || auth !== `Bearer ${API_KEY}`) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

app.get('/health', async () => ({ status: 'ok' }));

app.register(streetlightsRoutes);
app.register(workOrdersRoutes);

const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
