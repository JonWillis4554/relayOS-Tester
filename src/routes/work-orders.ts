import type { FastifyInstance } from 'fastify';
import { pool } from '../db';

interface CreateWorkOrderEntry {
  description?: unknown;
  light_ids?: unknown;
}

type CreateWorkOrderBody = CreateWorkOrderEntry | CreateWorkOrderEntry[];

interface ValidatedEntry {
  description: string;
  light_ids: number[];
}

function validateEntry(
  entry: unknown,
  prefix: string,
): { ok: true; value: ValidatedEntry } | { ok: false; error: string } {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return { ok: false, error: `${prefix}entry must be an object` };
  }
  const { description, light_ids } = entry as CreateWorkOrderEntry;

  if (typeof description !== 'string' || description.trim() === '') {
    return { ok: false, error: `${prefix}description must be a non-empty string` };
  }

  if (
    !Array.isArray(light_ids) ||
    light_ids.length === 0 ||
    !light_ids.every((id) => Number.isInteger(id))
  ) {
    return { ok: false, error: `${prefix}light_ids must be a non-empty array of integers` };
  }

  return {
    ok: true,
    value: { description: description.trim(), light_ids: light_ids as number[] },
  };
}

export async function workOrdersRoutes(app: FastifyInstance) {
  app.get('/work-orders', async () => {
    const result = await pool.query(`
      SELECT
        wo.*,
        COALESCE(
          json_agg(wol.streetlight_id ORDER BY wol.streetlight_id)
            FILTER (WHERE wol.streetlight_id IS NOT NULL),
          '[]'::json
        ) AS light_ids
      FROM work_orders wo
      LEFT JOIN work_order_lights wol ON wol.work_order_id = wo.id
      GROUP BY wo.id
      ORDER BY wo.id
    `);
    return result.rows;
  });

  app.get<{ Params: { id: string } }>('/work-orders/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.code(400).send({ error: 'id must be an integer' });
    }

    const result = await pool.query(
      `
      SELECT
        wo.id,
        wo.description,
        wo.status,
        wo.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'latitude', s.latitude,
              'longitude', s.longitude,
              'status', s.status,
              'last_seen', s.last_seen
            ) ORDER BY s.id
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS lights
      FROM work_orders wo
      LEFT JOIN work_order_lights wol ON wol.work_order_id = wo.id
      LEFT JOIN streetlights s ON s.id = wol.streetlight_id
      WHERE wo.id = $1
      GROUP BY wo.id
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: `Work order ${id} not found` });
    }

    return result.rows[0];
  });

  app.post<{ Body: CreateWorkOrderBody }>('/work-orders', async (request, reply) => {
    const body = request.body as unknown;
    const isArray = Array.isArray(body);

    if (!isArray && (typeof body !== 'object' || body === null)) {
      return reply.code(400).send({ error: 'request body must be an object or array of objects' });
    }

    if (isArray && (body as unknown[]).length === 0) {
      return reply.code(400).send({ error: 'array body must not be empty' });
    }

    const rawEntries: unknown[] = isArray ? (body as unknown[]) : [body];
    const validated: ValidatedEntry[] = [];
    for (let i = 0; i < rawEntries.length; i++) {
      const prefix = isArray ? `entries[${i}]: ` : '';
      const result = validateEntry(rawEntries[i], prefix);
      if (!result.ok) {
        return reply.code(400).send({ error: result.error });
      }
      validated.push(result.value);
    }

    if (isArray) {
      const seen = new Set<number>();
      const dups = new Set<number>();
      for (const entry of validated) {
        for (const id of entry.light_ids) {
          if (seen.has(id)) dups.add(id);
          seen.add(id);
        }
      }
      if (dups.size > 0) {
        const list = [...dups].sort((a, b) => a - b).join(', ');
        return reply.code(400).send({
          error: `Duplicate streetlight IDs across entries: ${list}`,
        });
      }
    }

    const allLightIds: number[] = [];
    for (const entry of validated) allLightIds.push(...entry.light_ids);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingResult = await client.query<{ id: number }>(
        'SELECT id FROM streetlights WHERE id = ANY($1)',
        [allLightIds],
      );
      const existingIds = new Set(existingResult.rows.map((r) => r.id));
      // For single-object requests, preserve original behavior verbatim (no dedup).
      // For array requests, dedup the missing list — the message spans entries.
      const missingIds = isArray
        ? [...new Set(allLightIds.filter((id) => !existingIds.has(id)))]
        : allLightIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        await client.query('ROLLBACK');
        return reply
          .code(400)
          .send({ error: `Streetlight IDs not found: ${missingIds.join(', ')}` });
      }

      const created: Array<Record<string, unknown>> = [];
      for (const entry of validated) {
        const woResult = await client.query(
          'INSERT INTO work_orders (description) VALUES ($1) RETURNING *',
          [entry.description],
        );
        const workOrder = woResult.rows[0] as Record<string, unknown>;

        for (const lightId of entry.light_ids) {
          await client.query(
            'INSERT INTO work_order_lights (work_order_id, streetlight_id) VALUES ($1, $2)',
            [workOrder.id, lightId],
          );
        }

        await client.query('UPDATE streetlights SET status = $1 WHERE id = ANY($2)', [
          'assigned',
          entry.light_ids,
        ]);

        const lightsResult = await client.query(
          'SELECT * FROM streetlights WHERE id = ANY($1) ORDER BY id',
          [entry.light_ids],
        );

        created.push({
          ...workOrder,
          light_ids: entry.light_ids,
          lights: lightsResult.rows,
        });
      }

      await client.query('COMMIT');

      return reply.code(201).send(isArray ? created : created[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}
