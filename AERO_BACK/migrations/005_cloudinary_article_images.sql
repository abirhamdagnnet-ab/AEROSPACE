ALTER TABLE posts
  ADD COLUMN cover_image_public_id TEXT
    CHECK (
      cover_image_public_id IS NULL
      OR cover_image_public_id ~ '^aerocampus/articles/[A-Za-z0-9_-]+$'
    );
