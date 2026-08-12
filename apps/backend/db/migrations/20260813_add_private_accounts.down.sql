DROP FUNCTION IF EXISTS can_view_user(uuid, uuid);
DROP INDEX IF EXISTS idx_follows_pending;

-- Pending requests have no meaning once privacy is gone. Drop them rather than
-- letting the column vanish and silently promote them to real follows.
DELETE FROM follows WHERE accepted_at IS NULL;

ALTER TABLE follows DROP COLUMN IF EXISTS accepted_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_private;
