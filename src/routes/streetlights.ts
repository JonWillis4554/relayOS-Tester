import type { FastifyInstance } from 'fastify';
import { pool } from '../db';

const VALID_STATUSES = ['ok', 'fault', 'assigned'] as const;

interface StreetlightsQuery {
  status?: string;
}

interface PatchStreetlightParams {
  id: string;
}

interface PatchStreetlightBody {
  status?: unknown;
}

export async function streetlightsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: StreetlightsQuery }>('/streetlights', async (request) => {
    const { status } = request.query;

    if (status) {
      const result = await pool.query(
        'SELECT * FROM streetlights WHERE status = $1 ORDER BY id',
        [status],
      );
      return result.rows;
    }

    const result = await pool.query('SELECT * FROM streetlights ORDER BY id');
    return result.rows;
  });

  app.patch<{ Params: PatchStreetlightParams; Body: PatchStreetlightBody }>(
    '/streetlights/:id',
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: 'id must be an integer' });
      }

      const { status } = request.body;
      if (typeof status !== 'string' || !(VALID_STATUSES as readonly string[]).includes(status)) {
        return reply
          .code(400)
          .send({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      const result = await pool.query(
        'UPDATE streetlights SET status = $1 WHERE id = $2 RETURNING *',
        [status, id],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: `Streetlight ${id} not found` });
      }

      return result.rows[0];
    },
  );
}
