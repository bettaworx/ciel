-- Bot accounts. A purely declarative flag: it changes nothing about what the
-- account may do, only how clients label it. The badge sits beside the display
-- name in the same places as the private lock, so that readers can tell an
-- automated poster from a person without reading the bio.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;
