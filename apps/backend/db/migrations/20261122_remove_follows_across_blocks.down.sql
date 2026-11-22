-- No down: this migration only deletes follows that a block should already
-- have removed. Restoring them is not something anyone wants.
SELECT 1;
