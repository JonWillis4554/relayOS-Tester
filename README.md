# relayos-test-target

Synthetic customer system for testing [RelayOS](https://relayos.ai) tool connectivity. This repo is a self-contained Postgres database plus a small HTTP API service that plays the role of "the customer's system" during RelayOS integration tests. It is **not** part of the RelayOS monorepo and shares no code or packages with it — the only contract between the two is a connection string, a base URL, and API credentials, exactly as with any real customer system.

---

## Quick start

```sh
cp .env.example .env

# Generate an API key and paste it into .env as TEST_TARGET_API_KEY:
openssl rand -hex 16

docker compose up
```

The API will be available at `http://localhost:3000` and Postgres at `localhost:5432`.

On first start, `docker-entrypoint-initdb.d` runs `schema.sql` then `seed.sql`, seeding 12 streetlights and 2 open work orders.

---

## Wiring into RelayOS

Configure two tool instances in the RelayOS admin UI once the stack is running.

### SQL tool instance

| Field | Value |
|---|---|
| **Connection string** | `postgres://relayos:relayos@<host>:5432/relayos_test` |
| **Schema** | `public` |

> **Network note:** Replace `<host>` with a host reachable from the RelayOS worker. If RelayOS runs in its own Docker network or on a separate machine, `localhost` will not work. On macOS/Windows with Docker Desktop, use the host machine's LAN IP or `host.docker.internal`. On Linux with separate compose stacks, use the host LAN IP or set up a shared Docker network.

### HTTP tool instance

| Field | Value |
|---|---|
| **Base URL** | `http://localhost:3000` |
| **Auth type** | `bearer` |
| **API key** | _(value of `TEST_TARGET_API_KEY` from your `.env`)_ |
| **OpenAPI spec** | Upload `openapi.json` from this repo (JSON, no `$ref`) |

> **Network note:** Same caveat as above — replace `localhost` with a host reachable from the RelayOS worker if they run on separate networks.

---

## Domain model

Three tables in the `public` schema:

- **`streetlights`** — fixtures with `latitude`, `longitude`, and `status` (`ok`, `fault`, `assigned`).
- **`work_orders`** — maintenance tasks with a `description` and `status` (`open`, `closed`).
- **`work_order_lights`** — join table linking work orders to streetlights (composite PK).

`POST /work-orders` atomically inserts the work order, links the lights, and flips those lights' `status` to `assigned`. A follow-up SQL `SELECT * FROM streetlights` via the SQL tool will immediately show the updated status, verifying cross-surface write consistency.

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | none | Liveness probe |
| `GET` | `/streetlights` | bearer | List lights; optional `?status=fault` filter |
| `PATCH` | `/streetlights/:id` | bearer | Update a light's status (test-data reset) |
| `GET` | `/work-orders` | bearer | List work orders with assigned `light_ids` |
| `POST` | `/work-orders` | bearer | Create work order (atomic) |

See `openapi.json` for full request/response schemas.

---

## Web UI

A React observation window branded as **Operational Bank** — the fictional customer this system represents. Served by the `web` compose service.

**URL:** `http://localhost:5173` (configurable via `WEB_PORT`)

**Login password:** the value of `TEST_TARGET_API_KEY` from your `.env`. The web UI reuses the API key as the shared password — set one and both are satisfied.

**Layout:** persistent sidebar + top bar. Navigation is grouped; adding a new section means adding one object to `web/src/layout/nav-config.ts`.

**Navigation:**
- **City Ops › Streetlights** — shows all 12 lights with id, coordinates (lat/long), status, and last-seen time. Each row has an inline status dropdown for calling `PATCH /streetlights/:id`. Use this to put lights back into `fault` state between RelayOS test runs. A **Refresh** button reloads the list after a RelayOS run to see lights flip to `assigned`.
- **City Ops › Work Orders** — read-only list of work orders with their assigned light IDs. Work orders are created through RelayOS, not this UI. Use **Refresh** to see new work orders appear after a RelayOS agent run.

The UI uses a deep indigo accent (`#4f46e5`) and dark indigo sidebar (`#1e1b4b`), visually distinct from RelayOS. The browser tab and header both read "Operational Bank" so it cannot be mistaken for a RelayOS screen in demos or recordings.

---

## Environment variables

| Variable | Description |
|---|---|
| `TEST_TARGET_API_KEY` | Static bearer token. Generate: `openssl rand -hex 16` |
| `DATABASE_URL` | Postgres connection string |
| `PORT` | HTTP port for the API service (default `3000`) |
| `WEB_PORT` | HTTP port for the web UI (default `5173`) |

---

## Security note

Authentication is a single static bearer token. This service is intentionally minimal — a test instrument, never a production system. Do not expose it to untrusted networks.
