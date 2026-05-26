# CLAUDE.md — RelayOS Test Target

Operational primer for Claude Code sessions in this repo. Re-read after any
`/clear` or compaction. This file is the working contract.

---

## What this repo is

`relayos-test-target` — a synthetic customer system that stands in for "the
tenant's system" so RelayOS tool connectivity can be exercised over a real
cross-network path without pointing RelayOS at a real customer. It is a test
instrument, deliberately minimal — NOT a product.

**Separate root.** This is its own repo, not part of the RelayOS monorepo.
Never import from, reference, or modify the RelayOS monorepo from here, and
vice versa. The only contract between the two is: a connection string, a
base URL, and credentials. Nothing more.

---

## Domain

A small streetlight-operations model. Three Postgres tables:
- `streetlights` — `id`, `location`, `status` (`ok` | `fault` | `assigned`,
  default `ok`), `last_seen`.
- `work_orders` — `id`, `description`, `status` (`open` | `closed`,
  default `open`), `created_at`.
- `work_order_lights` — join table, composite PK `(work_order_id,
  streetlight_id)`.

Seed: 12 streetlights (7 ok, 3 fault, 2 assigned), 2 open work orders. The 2
`assigned` lights are exactly the lights the 2 seeded work orders link to —
the seed is internally coherent.

---

## Repo structure

```
README.md             quick start + "Wiring into RelayOS" guide
docker-compose.yml    postgres (healthchecked) + test-target API + web UI
.env.example          TEST_TARGET_API_KEY, DATABASE_URL, PORT
Dockerfile / .dockerignore
package.json          fastify ^4, pg ^8; tsx + typescript devDeps
tsconfig.json
openapi.json          OpenAPI 3.0.3, no $ref, bearer scheme
src/
  server.ts           Fastify app, onRequest auth hook, logger.redact on auth header
  db.ts               pg Pool from DATABASE_URL
  routes/
    streetlights.ts   GET /streetlights + PATCH /streetlights/:id
    work-orders.ts    GET /work-orders + POST /work-orders (transactional)
db/
  schema.sql          CREATE TABLE IF NOT EXISTS (all 3 tables)
  seed.sql            12 lights, 2 work orders, internally coherent
web/
  Dockerfile, package.json, tsconfig.json, vite.config.ts, index.html
  .env.example, .dockerignore
  src/
    main.tsx, App.tsx, api.ts, auth.ts, vite-env.d.ts, styles.css
    pages/      Login.tsx, Streetlights.tsx, WorkOrders.tsx
    components/ Header.tsx, StatusPill.tsx
```

Run locally: `docker compose up`. Postgres runs schema then seed on first
start. Web UI at `http://localhost:5175` (login password = the
`TEST_TARGET_API_KEY` value).

---

## HTTP API surface

All endpoints except `/health` require a static bearer token
(`TEST_TARGET_API_KEY`).
- `GET /health` — no auth, healthcheck probe.
- `GET /streetlights` — all lights; optional `?status=` filter.
- `PATCH /streetlights/:id` — update one light's status. 400 on bad
  int-parse or invalid status; 404 on no matching row. Exists as a
  test-data reset affordance.
- `GET /work-orders` — all work orders, each with assigned light IDs.
- `POST /work-orders` — primary endpoint under test. Body
  `{ description, light_ids[] }`. Validates description non-empty and every
  light ID exists (400 naming missing IDs otherwise), then in a SINGLE
  ATOMIC TRANSACTION creates the work order, the join rows, and flips each
  assigned light to `assigned`.

---

## Hard constraints — NEVER violate

1. **Separate root.** No imports, references, or edits across the
   repo boundary in either direction. Contract = connection string + URL +
   credentials only.
2. **Visually distinct from RelayOS.** Any UI work keeps the test target
   looking like its own plain, municipal system. System fonts, `#2563eb`
   blue, dark slate header, "Streetlight Operations — Test Target" badge.
   NEVER the Mint Light theme, NEVER General Sans — a screenshot of this
   must never be mistaken for RelayOS.
3. **Minimal dependencies.** Fastify, `pg`, React, React Router, Vite,
   TypeScript. Resist adding more — this is a test instrument.
5. **Idempotent schema.** `schema.sql` uses `CREATE TABLE IF NOT EXISTS` so
   it survives re-application after a dev DB reset.
6. **Seed coherence.** Any change to seed data keeps it internally
   consistent — `assigned` lights are exactly the lights the seeded work
   orders link to.
7. **One file per prompt.** Each scoped prompt changes exactly one file
   unless explicitly told otherwise. Flag, don't expand.

---

## Known accepted shortcut (do not "fix")

`VITE_APP_PASSWORD = TEST_TARGET_API_KEY`, so a UI login holds the raw
bearer token (`sessionStorage`). Acceptable for a disposable test fixture.
Do NOT carry this pattern into RelayOS proper — but do not change it here.

---

## Verification — every prompt ends with this

1. Only the in-scope file changed (`git diff --stat`).
2. `docker compose up` still brings the stack up; `/health` responds.
3. For the `POST /work-orders` path: a mixed valid/invalid `light_ids`
   request returns 400 and writes NOTHING (row counts unchanged); the
   success path flips assigned lights to `assigned`, visible via a
   follow-up `GET /streetlights`.
4. Schema changes remain idempotent; seed remains internally coherent.
5. UI changes keep the municipal identity — no Mint Light, no General Sans.

If verification fails, fix within scope or report — do not claim done.

---

## When context is lost

After `/clear` or compaction this file reloads automatically. It is the
durable contract. For wiring-into-RelayOS detail, see this repo's README
and `relayos-test-target.md` in the chat-side project. Note: the
`seed-test-target.ts` script that registers tool instances lives inside the
RELAYOS repo, not here — that work belongs in the platform session.
