-- =====================================================================
-- CampusSwap — Akademik Kaynak Takas Sistemi
-- Oracle Database 23ai DDL
--
-- Tasarım kararları:
--   • Primary key olarak VARCHAR2(32) (CUID benzeri kısa anahtar) kullandık
--     SYS_GUID()'in 32 karakterlik hex hali alternatif olabilirdi ama
--     uygulama tarafında cuid üretip taşımak daha okunaklı.
--   • Boolean yerine NUMBER(1) + CHECK constraint.
--   • Enum yerine VARCHAR2 + CHECK constraint.
--   • Tüm tablolarda CREATED_AT default SYSTIMESTAMP.
--   • Cascade silmeler yerinde — onDelete: Cascade davranışı.
--
-- Çalıştırma: campus user ile bağlanıp tek seferde uygula.
-- =====================================================================

-- 0) Mevcut tabloları temizle (idempotent)
BEGIN
  FOR t IN (SELECT table_name FROM user_tables) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- =====================================================================
-- DEPARTMENTS
-- =====================================================================
CREATE TABLE departments (
  id          VARCHAR2(32) PRIMARY KEY,
  name        VARCHAR2(200) NOT NULL UNIQUE,
  faculty     VARCHAR2(200) NOT NULL,
  created_at  TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);

-- =====================================================================
-- USERS (skills çoklu değerli özellik ayrı tabloda)
-- =====================================================================
CREATE TABLE users (
  id            VARCHAR2(32) PRIMARY KEY,
  username      VARCHAR2(60)  NOT NULL UNIQUE,
  email         VARCHAR2(180) NOT NULL UNIQUE,
  password_hash VARCHAR2(120) NOT NULL,
  avatar_name   VARCHAR2(120),
  bio           VARCHAR2(2000),
  department_id VARCHAR2(32),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL
);
CREATE INDEX ix_users_dept ON users(department_id);

-- Skills — multivalued attribute
CREATE TABLE user_skills (
  user_id VARCHAR2(32) NOT NULL,
  skill   VARCHAR2(60) NOT NULL,
  CONSTRAINT pk_user_skills PRIMARY KEY (user_id, skill),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================================
-- RESOURCES
-- type: BOOK | PDF | NOTES | SLIDES | EXAM | PROJECT | OTHER
-- =====================================================================
CREATE TABLE resources (
  id            VARCHAR2(32) PRIMARY KEY,
  title         VARCHAR2(200) NOT NULL,
  type          VARCHAR2(20)  NOT NULL,
  description   VARCHAR2(1000),
  department_id VARCHAR2(32),
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ck_resources_type CHECK (type IN
    ('BOOK','PDF','NOTES','SLIDES','EXAM','PROJECT','OTHER')),
  CONSTRAINT fk_resources_dept FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE SET NULL
);
CREATE INDEX ix_resources_dept ON resources(department_id);
CREATE INDEX ix_resources_type ON resources(type);

-- =====================================================================
-- POSTS
-- status: ACTIVE | RESERVED | COMPLETED | CANCELLED
-- =====================================================================
CREATE TABLE posts (
  id          VARCHAR2(32) PRIMARY KEY,
  title       VARCHAR2(200) NOT NULL,
  description VARCHAR2(4000),
  status      VARCHAR2(16) DEFAULT 'ACTIVE' NOT NULL,
  owner_id    VARCHAR2(32) NOT NULL,
  offer_id    VARCHAR2(32) NOT NULL,
  request_id  VARCHAR2(32) NOT NULL,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ck_posts_status CHECK (status IN
    ('ACTIVE','RESERVED','COMPLETED','CANCELLED')),
  CONSTRAINT fk_posts_owner   FOREIGN KEY (owner_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_offer   FOREIGN KEY (offer_id)
    REFERENCES resources(id),
  CONSTRAINT fk_posts_request FOREIGN KEY (request_id)
    REFERENCES resources(id)
);
CREATE INDEX ix_posts_owner  ON posts(owner_id);
CREATE INDEX ix_posts_status ON posts(status);
CREATE INDEX ix_posts_created ON posts(created_at DESC);

-- =====================================================================
-- EXCHANGES
-- status: PENDING | ACCEPTED | REJECTED | COMPLETED | CANCELLED
-- =====================================================================
CREATE TABLE exchanges (
  id           VARCHAR2(32) PRIMARY KEY,
  post_id      VARCHAR2(32) NOT NULL,
  requester_id VARCHAR2(32) NOT NULL,
  status       VARCHAR2(16) DEFAULT 'PENDING' NOT NULL,
  created_at   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ck_exchanges_status CHECK (status IN
    ('PENDING','ACCEPTED','REJECTED','COMPLETED','CANCELLED')),
  CONSTRAINT uq_exchanges_post_req UNIQUE (post_id, requester_id),
  CONSTRAINT fk_exchanges_post FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_exchanges_req  FOREIGN KEY (requester_id)
    REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_exchanges_req ON exchanges(requester_id);

-- =====================================================================
-- EXCHANGE_MESSAGES — zayıf varlık (exchange'e bağımlı)
-- =====================================================================
CREATE TABLE exchange_messages (
  exchange_id VARCHAR2(32) NOT NULL,
  message_no  NUMBER(10)   NOT NULL,
  sender_id   VARCHAR2(32) NOT NULL,
  content     VARCHAR2(2000) NOT NULL,
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT pk_xmsg PRIMARY KEY (exchange_id, message_no),
  CONSTRAINT fk_xmsg_exchange FOREIGN KEY (exchange_id)
    REFERENCES exchanges(id) ON DELETE CASCADE,
  CONSTRAINT fk_xmsg_sender   FOREIGN KEY (sender_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================================
-- REVIEWS
-- =====================================================================
CREATE TABLE reviews (
  id          VARCHAR2(32) PRIMARY KEY,
  exchange_id VARCHAR2(32) NOT NULL,
  reviewer_id VARCHAR2(32) NOT NULL,
  reviewee_id VARCHAR2(32) NOT NULL,
  rating      NUMBER(1) NOT NULL,
  comment_text VARCHAR2(2000),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_reviews_per_exch UNIQUE (exchange_id, reviewer_id),
  CONSTRAINT fk_reviews_exch    FOREIGN KEY (exchange_id)
    REFERENCES exchanges(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id)
    REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_reviews_reviewee ON reviews(reviewee_id);

-- =====================================================================
-- FAVORITES — N:M (user <-> post)
-- =====================================================================
CREATE TABLE favorites (
  user_id  VARCHAR2(32) NOT NULL,
  post_id  VARCHAR2(32) NOT NULL,
  added_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT pk_favorites PRIMARY KEY (user_id, post_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_post FOREIGN KEY (post_id)
    REFERENCES posts(id) ON DELETE CASCADE
);

-- =====================================================================
-- REPORTS
-- reason: SPAM | INAPPROPRIATE | FRAUD | HARASSMENT | OTHER
-- status: OPEN | REVIEWING | RESOLVED | DISMISSED
-- =====================================================================
CREATE TABLE reports (
  id                VARCHAR2(32) PRIMARY KEY,
  reporter_id       VARCHAR2(32) NOT NULL,
  reported_user_id  VARCHAR2(32),
  target_type       VARCHAR2(20) NOT NULL,
  target_id         VARCHAR2(32) NOT NULL,
  reason            VARCHAR2(20) NOT NULL,
  details           VARCHAR2(1000),
  status            VARCHAR2(16) DEFAULT 'OPEN' NOT NULL,
  created_at        TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT ck_reports_reason CHECK (reason IN
    ('SPAM','INAPPROPRIATE','FRAUD','HARASSMENT','OTHER')),
  CONSTRAINT ck_reports_status CHECK (status IN
    ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reported FOREIGN KEY (reported_user_id)
    REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX ix_reports_status ON reports(status);

-- =====================================================================
-- CONVERSATIONS — kanonik (user_a_id < user_b_id) anahtar
-- =====================================================================
CREATE TABLE conversations (
  id              VARCHAR2(32) PRIMARY KEY,
  user_a_id       VARCHAR2(32) NOT NULL,
  user_b_id       VARCHAR2(32) NOT NULL,
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  last_message_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT uq_convo_pair UNIQUE (user_a_id, user_b_id),
  CONSTRAINT ck_convo_order CHECK (user_a_id < user_b_id),
  CONSTRAINT fk_convo_a FOREIGN KEY (user_a_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_convo_b FOREIGN KEY (user_b_id)
    REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_convo_a    ON conversations(user_a_id);
CREATE INDEX ix_convo_b    ON conversations(user_b_id);
CREATE INDEX ix_convo_last ON conversations(last_message_at DESC);

-- =====================================================================
-- DIRECT_MESSAGES
-- =====================================================================
CREATE TABLE direct_messages (
  id              VARCHAR2(32) PRIMARY KEY,
  conversation_id VARCHAR2(32) NOT NULL,
  sender_id       VARCHAR2(32) NOT NULL,
  content         VARCHAR2(2000) NOT NULL,
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_dm_convo  FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_dm_sender FOREIGN KEY (sender_id)
    REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_dm_convo ON direct_messages(conversation_id, created_at);
