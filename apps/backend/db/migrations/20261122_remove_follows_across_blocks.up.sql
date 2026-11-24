-- Follow and Block could interleave so that a follow (or pending request)
-- was inserted after the block had deleted the pair's follows. The code now
-- serializes the two; this removes any rows that slipped through before.
DELETE FROM follows f
WHERE EXISTS (
	SELECT 1 FROM account_blocks b
	WHERE (b.blocker_id = f.follower_id AND b.blocked_id = f.followee_id)
		OR (b.blocker_id = f.followee_id AND b.blocked_id = f.follower_id)
);
