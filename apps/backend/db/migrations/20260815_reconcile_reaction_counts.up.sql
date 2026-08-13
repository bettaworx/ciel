-- Account deletion used to leave post_reaction_counts untouched: the events
-- cascaded away with the user, the totals did not. Rebuild every counter from
-- the events that actually remain.

UPDATE post_reaction_counts c
SET count = e.n
FROM (
	SELECT post_id, emoji, count(*)::int AS n
	FROM post_reaction_events
	GROUP BY post_id, emoji
) e
WHERE c.post_id = e.post_id AND c.emoji = e.emoji AND c.count <> e.n;

DELETE FROM post_reaction_counts c
WHERE NOT EXISTS (
	SELECT 1 FROM post_reaction_events e
	WHERE e.post_id = c.post_id AND e.emoji = c.emoji
);
