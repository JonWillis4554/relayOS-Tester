-- 12 streetlights clustered in central Austin, TX (~3 km radius).
-- IDs 1-7 ok, 8/9/11 fault, 10/12 assigned (pre-linked to work orders below).
INSERT INTO streetlights (latitude, longitude, status, last_seen) VALUES
  ( 30.26723, -97.74312, 'ok',       NOW()),
  ( 30.26891, -97.73918, 'ok',       NOW()),
  ( 30.26758, -97.74556, 'ok',       NOW()),
  ( 30.27012, -97.74851, 'ok',       NOW()),
  ( 30.26231, -97.74087, 'ok',       NOW()),
  ( 30.27234, -97.73672, 'ok',       NOW()),
  ( 30.26512, -97.75013, 'ok',       NOW()),
  ( 30.26601, -97.73801, 'fault',    NOW() - INTERVAL '3 days'),
  ( 30.27543, -97.74623, 'fault',    NOW() - INTERVAL '2 days'),
  ( 30.25982, -97.74891, 'assigned', NOW() - INTERVAL '5 days'),
  ( 30.27811, -97.73952, 'fault',    NOW() - INTERVAL '1 day'),
  ( 30.26034, -97.75234, 'assigned', NOW() - INTERVAL '12 hours');

-- 2 open work orders already in flight
INSERT INTO work_orders (description, status) VALUES
  ('Inspect and repair failed unit at 30.25982, -97.74891', 'open'),
  ('Replace lamp at 30.26034, -97.75234 — repeated outage', 'open');

-- Assign lights to work orders (IDs match insert order above)
INSERT INTO work_order_lights (work_order_id, streetlight_id) VALUES
  (1, 10),
  (2, 12);
