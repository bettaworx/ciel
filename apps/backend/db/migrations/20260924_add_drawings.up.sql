CREATE TABLE drawings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format_version SMALLINT NOT NULL,
    background_color CHAR(7) NOT NULL,
    width SMALLINT NOT NULL,
    height SMALLINT NOT NULL,
    data_bytes INT NOT NULL,
    preview_bytes INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, user_id),
    CHECK (format_version = 1),
    CHECK (background_color ~ '^#[0-9A-F]{6}$'),
    CHECK (width = 1200 AND height = 800),
    CHECK (data_bytes BETWEEN 1 AND 4194304),
    CHECK (preview_bytes BETWEEN 1 AND 2097152)
);

ALTER TABLE posts ADD COLUMN drawing_id UUID;
ALTER TABLE posts ADD CONSTRAINT posts_drawing_owner_fk
    FOREIGN KEY (drawing_id, user_id) REFERENCES drawings(id, user_id);
ALTER TABLE posts ADD CONSTRAINT posts_drawing_unique UNIQUE (drawing_id);
ALTER TABLE posts ADD CONSTRAINT posts_drawing_content_empty
    CHECK (drawing_id IS NULL OR content = '');

CREATE OR REPLACE FUNCTION reject_drawing_post_media()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM posts WHERE id = NEW.post_id AND drawing_id IS NOT NULL) THEN
        RAISE EXCEPTION 'drawing posts cannot have media' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER post_media_reject_drawing
BEFORE INSERT OR UPDATE ON post_media
FOR EACH ROW EXECUTE FUNCTION reject_drawing_post_media();

CREATE OR REPLACE FUNCTION reject_drawing_on_post_with_media()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.drawing_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM post_media WHERE post_id = NEW.id) THEN
        RAISE EXCEPTION 'posts with media cannot have a drawing' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER posts_reject_drawing_with_media
BEFORE INSERT OR UPDATE OF drawing_id ON posts
FOR EACH ROW EXECUTE FUNCTION reject_drawing_on_post_with_media();

DROP INDEX IF EXISTS idx_posts_unique_pure_boost;
CREATE UNIQUE INDEX idx_posts_unique_pure_boost
    ON posts(user_id, reference_id)
    WHERE reference_id IS NOT NULL AND content = '' AND drawing_id IS NULL AND deleted_at IS NULL;

