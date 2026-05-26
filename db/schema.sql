CREATE TABLE IF NOT EXISTS streetlights (
  id        SERIAL PRIMARY KEY,
  latitude  DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status    TEXT             NOT NULL DEFAULT 'ok'
              CHECK (status IN ('ok', 'fault', 'assigned')),
  last_seen TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id          SERIAL PRIMARY KEY,
  description TEXT        NOT NULL CHECK (description <> ''),
  status      TEXT        NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_lights (
  work_order_id  INTEGER NOT NULL REFERENCES work_orders(id),
  streetlight_id INTEGER NOT NULL REFERENCES streetlights(id),
  PRIMARY KEY (work_order_id, streetlight_id)
);
