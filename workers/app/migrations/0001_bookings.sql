-- Bookings, as described in src/schema.ts.
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  org_id TEXT NOT NULL,
  coach TEXT NOT NULL,
  amount REAL NOT NULL,
  booked_at INTEGER NOT NULL
);
CREATE INDEX bookings_org_booked_at ON bookings (org_id, booked_at);

-- Fixed rows the checks in check.ts expect: org-a has 4 bookings worth 1800 from 1 Oct 2026; org-b must never show up for org-a.
INSERT INTO bookings VALUES
  (1, 'org-a', 'Remy', 500, 1790812800),
  (2, 'org-a', 'Remy', 700, 1790899200),
  (3, 'org-a', 'Nok', 300, 1790985600),
  (4, 'org-a', 'Nok', 300, 1791590400),
  (5, 'org-b', 'Other', 9999, 1790812800);

-- 400 demo bookings for org remy, spread over 180 days from 25 Apr 2026. Deterministic, so every reset gives the same data.
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 400)
INSERT INTO bookings (id, org_id, coach, amount, booked_at)
SELECT 1000 + i, 'remy',
  CASE i % 4 WHEN 0 THEN 'Remy' WHEN 1 THEN 'Nok' WHEN 2 THEN 'Ploy' ELSE 'Ben' END,
  (i * 37 % 9 + 3) * 100,
  1777075200 + (i * 7919 % 180) * 86400 + (i % 12 + 7) * 3600
FROM n;
