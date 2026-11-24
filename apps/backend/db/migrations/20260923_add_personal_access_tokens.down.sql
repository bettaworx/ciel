DROP INDEX IF EXISTS idx_oauth_tokens_personal;

-- Personal tokens cannot survive the column going back to NOT NULL, and there
-- is no client to attribute them to. Drop them rather than invent one: they are
-- credentials, so losing them means re-issuing, not corrupting anything.
DELETE FROM oauth_tokens WHERE client_id IS NULL;

ALTER TABLE oauth_tokens DROP COLUMN IF EXISTS name;
ALTER TABLE oauth_tokens ALTER COLUMN client_id SET NOT NULL;
