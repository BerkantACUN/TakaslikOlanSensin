-- =====================================================================
-- CampusSwap — PostgreSQL DDL (Supabase uyumlu)
-- Oracle DDL'in Postgres karşılığı: VARCHAR2 -> VARCHAR,
-- NUMBER -> INT, SYSTIMESTAMP -> NOW(), TIMESTAMP -> TIMESTAMPTZ.
-- =====================================================================

-- Tüm tabloları temizle (idempotent)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename IN ('direct_messages','conversations','reports',
        'favorites','reviews','exchange_messages','exchanges','posts',
        'resources','user_skills','users','departments')
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;

-- =====================================================================
-- DEPARTMENTS
-- =====================================================================
CREATE TABLE departments (
  id          VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL UNIQUE,
  faculty     VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- USERS
-- =====================================================================
CREATE TABLE users (
  id            VARCHAR(32) PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  email         VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(120) NOT NULL,
  avatar_name   VARCHAR(120),
  bio           VARCHAR(2000),
  department_id VARCHAR(32) REFERENCES departments(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_users_dept ON users(department_id);

CREATE TABLE user_skills (
  user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill   VARCHAR(60) NOT NULL,
  PRIMARY KEY (user_id, skill)
);

-- =====================================================================
-- RESOURCES
-- =====================================================================
CREATE TABLE resources (
  id            VARCHAR(32) PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  type          VARCHAR(20)  NOT NULL CHECK (type IN
    ('BOOK','PDF','NOTES','SLIDES','EXAM','PROJECT','OTHER')),
  description   VARCHAR(1000),
  department_id VARCHAR(32) REFERENCES departments(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_resources_dept ON resources(department_id);
CREATE INDEX ix_resources_type ON resources(type);

-- =====================================================================
-- POSTS
-- =====================================================================
CREATE TABLE posts (
  id          VARCHAR(32) PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description VARCHAR(4000),
  status      VARCHAR(16) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN
    ('ACTIVE','RESERVED','COMPLETED','CANCELLED')),
  owner_id    VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id    VARCHAR(32) NOT NULL REFERENCES resources(id),
  request_id  VARCHAR(32) NOT NULL REFERENCES resources(id),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_posts_owner   ON posts(owner_id);
CREATE INDEX ix_posts_status  ON posts(status);
CREATE INDEX ix_posts_created ON posts(created_at DESC);

-- =====================================================================
-- EXCHANGES
-- =====================================================================
CREATE TABLE exchanges (
  id           VARCHAR(32) PRIMARY KEY,
  post_id      VARCHAR(32) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  requester_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(16) DEFAULT 'PENDING' NOT NULL CHECK (status IN
    ('PENDING','ACCEPTED','REJECTED','COMPLETED','CANCELLED')),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (post_id, requester_id)
);
CREATE INDEX ix_exchanges_req ON exchanges(requester_id);

-- =====================================================================
-- EXCHANGE_MESSAGES (zayıf varlık)
-- =====================================================================
CREATE TABLE exchange_messages (
  exchange_id VARCHAR(32) NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  message_no  INTEGER     NOT NULL,
  sender_id   VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     VARCHAR(2000) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (exchange_id, message_no)
);

-- =====================================================================
-- REVIEWS
-- =====================================================================
CREATE TABLE reviews (
  id           VARCHAR(32) PRIMARY KEY,
  exchange_id  VARCHAR(32) NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  reviewer_id  VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id  VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment_text VARCHAR(2000),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (exchange_id, reviewer_id)
);
CREATE INDEX ix_reviews_reviewee ON reviews(reviewee_id);

-- =====================================================================
-- FAVORITES (N:M)
-- =====================================================================
CREATE TABLE favorites (
  user_id  VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id  VARCHAR(32) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

-- =====================================================================
-- REPORTS
-- =====================================================================
CREATE TABLE reports (
  id                VARCHAR(32) PRIMARY KEY,
  reporter_id       VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id  VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  target_type       VARCHAR(20) NOT NULL,
  target_id         VARCHAR(32) NOT NULL,
  reason            VARCHAR(20) NOT NULL CHECK (reason IN
    ('SPAM','INAPPROPRIATE','FRAUD','HARASSMENT','OTHER')),
  details           VARCHAR(1000),
  status            VARCHAR(16) DEFAULT 'OPEN' NOT NULL CHECK (status IN
    ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_reports_status ON reports(status);

-- =====================================================================
-- CONVERSATIONS
-- =====================================================================
CREATE TABLE conversations (
  id              VARCHAR(32) PRIMARY KEY,
  user_a_id       VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id       VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);
CREATE INDEX ix_convo_a    ON conversations(user_a_id);
CREATE INDEX ix_convo_b    ON conversations(user_b_id);
CREATE INDEX ix_convo_last ON conversations(last_message_at DESC);

-- =====================================================================
-- DIRECT_MESSAGES
-- =====================================================================
CREATE TABLE direct_messages (
  id              VARCHAR(32) PRIMARY KEY,
  conversation_id VARCHAR(32) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         VARCHAR(2000) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_dm_convo ON direct_messages(conversation_id, created_at);
