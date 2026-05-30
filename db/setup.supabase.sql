-- =====================================================================
-- CampusSwap — Supabase tek seferlik kurulum
-- Schema + Seed bir arada. Supabase Dashboard → SQL Editor'a yapıştır,
-- "Run" butonuna bas. 1-2 saniyede tamamlanır.
--
-- Tüm kullanıcıların şifresi: test1234
-- =====================================================================

-- ------------------------------ TEMİZLE ------------------------------
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

-- ------------------------------ ŞEMA ------------------------------
CREATE TABLE departments (
  id          VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(200) NOT NULL UNIQUE,
  faculty     VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

CREATE TABLE exchange_messages (
  exchange_id VARCHAR(32) NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  message_no  INTEGER     NOT NULL,
  sender_id   VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     VARCHAR(2000) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (exchange_id, message_no)
);

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

CREATE TABLE favorites (
  user_id  VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id  VARCHAR(32) NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

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

CREATE TABLE direct_messages (
  id              VARCHAR(32) PRIMARY KEY,
  conversation_id VARCHAR(32) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         VARCHAR(2000) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_dm_convo ON direct_messages(conversation_id, created_at);

-- ------------------------------ SEED ------------------------------

-- Departmanlar
INSERT INTO departments (id, name, faculty) VALUES
  ('dept_cs01', 'Bilgisayar Mühendisliği', 'Mühendislik'),
  ('dept_ee01', 'Elektrik-Elektronik Mühendisliği', 'Mühendislik'),
  ('dept_ie01', 'Endüstri Mühendisliği', 'Mühendislik'),
  ('dept_me01', 'Makine Mühendisliği', 'Mühendislik'),
  ('dept_bu01', 'İşletme', 'İktisadi ve İdari Bilimler'),
  ('dept_ec01', 'Ekonomi', 'İktisadi ve İdari Bilimler'),
  ('dept_ps01', 'Psikoloji', 'Edebiyat'),
  ('dept_ma01', 'Matematik', 'Fen'),
  ('dept_ph01', 'Fizik', 'Fen'),
  ('dept_en01', 'İngiliz Dili ve Edebiyatı', 'Edebiyat');

-- Kullanıcılar (password = test1234, bcrypt 10 round)
INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id) VALUES
  ('user_elif01', 'elif@example.com', 'elif_doga',
   '$2a$10$JtSPtytM/Zrs4GnPmIHJueTFbWetGZuo7SzpN25ttSNj8RpqiR.8e',
   'Elif Doğa',
   'Calculus II ve Linear Algebra notlarım var, takasa açığım.',
   'dept_cs01'),
  ('user_berk01', 'berkant@example.com', 'berkant_acun',
   '$2a$10$JtSPtytM/Zrs4GnPmIHJueTFbWetGZuo7SzpN25ttSNj8RpqiR.8e',
   'Berkant Acun',
   'Yazılım Mühendisliği — algoritma kitaplarımı paylaşmaktan keyif alıyorum.',
   'dept_cs01');

-- Yetkinlikler
INSERT INTO user_skills (user_id, skill) VALUES
  ('user_elif01', 'Python'),
  ('user_elif01', 'Matematik'),
  ('user_berk01', 'React'),
  ('user_berk01', 'Algoritma'),
  ('user_berk01', 'Next.js');

-- Kaynaklar
INSERT INTO resources (id, title, type, description, department_id) VALUES
  ('res_stewart', 'Stewart Calculus 8. Baskı', 'BOOK',
   'Hemen hemen sıfır, çok az altı çizilmiş.', 'dept_cs01'),
  ('res_linalg',  'Linear Algebra Ders Notları (PDF)', 'NOTES',
   'Hafta hafta el yazısı, taranmış net PDF.', 'dept_cs01'),
  ('res_signals', 'Signals & Systems — Oppenheim', 'BOOK',
   '2. el, hafif yıpranmış ama tertemiz.', 'dept_ee01'),
  ('res_algoex',  'Algoritma Vize Çıkmış Sorular', 'EXAM',
   'Son 5 yılın çözümlü vize soruları.', 'dept_cs01');

-- İlanlar
INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id) VALUES
  ('post_elif_01',
   'Calculus kitabımı, Algoritma notlarıyla takas ediyorum',
   'Kitap çok temiz. Algoritma final notları ya da çıkmış soru paketi olan biriyle takaslaşmak isterim.',
   'ACTIVE', 'user_elif01', 'res_stewart', 'res_algoex'),
  ('post_berk_01',
   'Lineer Cebir PDF''i takas — Signals & Systems karşılığında',
   'PDF tamamen taranmış halde, mail ile paylaşırım. Karşılığında Oppenheim Signals & Systems kitabını arıyorum.',
   'ACTIVE', 'user_berk01', 'res_linalg', 'res_signals'),
  ('post_berk_02',
   'Algoritma vize sorularımı, Calculus kitabıyla takas ederim',
   'Son 5 yılın çözümlü vize sorularımı paylaşırım. Karşılığında Stewart Calculus 8. baskısı arıyorum.',
   'ACTIVE', 'user_berk01', 'res_algoex', 'res_stewart');
