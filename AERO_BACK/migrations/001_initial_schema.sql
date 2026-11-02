CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 2),
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'author'
    CHECK (role IN ('admin', 'editor', 'author')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(60) NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug VARCHAR(80) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description VARCHAR(240) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(180) NOT NULL CHECK (char_length(trim(title)) >= 5),
  slug VARCHAR(200) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt VARCHAR(320) NOT NULL CHECK (char_length(trim(excerpt)) >= 20),
  content TEXT NOT NULL CHECK (char_length(trim(content)) >= 40),
  cover_image_url TEXT NOT NULL DEFAULT ''
    CHECK (cover_image_url = '' OR cover_image_url ~ '^https?://'),
  author_id BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE contact_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) >= 2),
  email VARCHAR(254) NOT NULL
    CHECK (email = lower(trim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  subject VARCHAR(160) NOT NULL DEFAULT '',
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 10 AND 5000),
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX posts_public_published_idx
  ON posts (published_at DESC, id DESC)
  WHERE status = 'published';

CREATE INDEX posts_category_public_published_idx
  ON posts (category_id, published_at DESC, id DESC)
  WHERE status = 'published';

CREATE INDEX posts_author_idx ON posts (author_id);
CREATE INDEX posts_search_idx
  ON posts USING GIN (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
  );
CREATE INDEX contact_messages_status_created_idx ON contact_messages (status, created_at DESC);

CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
