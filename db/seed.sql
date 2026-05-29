-- ---------------------------------------------------------------------
-- CampusSwap — Oracle seed data
-- Demo bölümler, kullanıcılar, kaynaklar ve ilanlar.
-- password_hash: bcrypt 'test1234' hash'i (10 round)
-- Bu dosya idempotent değil; çalıştırmadan önce schema.sql ile temizlik
-- gerekir.
-- ---------------------------------------------------------------------

SET DEFINE OFF;

-- Departments ------------------------------------------------------
INSERT INTO departments (id, name, faculty) VALUES ('dept_cs01', 'Bilgisayar Mühendisliği', 'Mühendislik');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ee01', 'Elektrik-Elektronik Mühendisliği', 'Mühendislik');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ie01', 'Endüstri Mühendisliği', 'Mühendislik');
INSERT INTO departments (id, name, faculty) VALUES ('dept_me01', 'Makine Mühendisliği', 'Mühendislik');
INSERT INTO departments (id, name, faculty) VALUES ('dept_bu01', 'İşletme', 'İktisadi ve İdari Bilimler');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ec01', 'Ekonomi', 'İktisadi ve İdari Bilimler');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ps01', 'Psikoloji', 'Edebiyat');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ma01', 'Matematik', 'Fen');
INSERT INTO departments (id, name, faculty) VALUES ('dept_ph01', 'Fizik', 'Fen');
INSERT INTO departments (id, name, faculty) VALUES ('dept_en01', 'İngiliz Dili ve Edebiyatı', 'Edebiyat');

-- Users ------------------------------------------------------------
-- password_hash sahası: bcrypt(test1234, 10 rounds)
INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id) VALUES
  ('user_elif01', 'elif@example.com',    'elif_doga', '$2a$10$5Bma6f9bSBnDjGqMzPg3DOhUKBwSFXSvRR9z1WgGq7l/8Sg/3VqIK',
   'Elif Doğa', 'Calculus II ve Linear Algebra notlarım var, takasa açığım.', 'dept_cs01');

INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id) VALUES
  ('user_berk01', 'berkant@example.com', 'berkant',   '$2a$10$5Bma6f9bSBnDjGqMzPg3DOhUKBwSFXSvRR9z1WgGq7l/8Sg/3VqIK',
   'Berkant Acun', 'Yazılım Mühendisliği — algoritma kitaplarımı paylaşmaktan keyif alıyorum.', 'dept_cs01');

INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id) VALUES
  ('user_ugur01', 'ugur@example.com',    'ugur_p',    '$2a$10$5Bma6f9bSBnDjGqMzPg3DOhUKBwSFXSvRR9z1WgGq7l/8Sg/3VqIK',
   'Uğur Pehlivan', 'EE öğrencisiyim, devre ve sinyal işleme kaynaklarım var.', 'dept_ee01');

-- User skills (multivalued) ----------------------------------------
INSERT INTO user_skills (user_id, skill) VALUES ('user_elif01', 'Python');
INSERT INTO user_skills (user_id, skill) VALUES ('user_elif01', 'Matematik');
INSERT INTO user_skills (user_id, skill) VALUES ('user_berk01', 'React');
INSERT INTO user_skills (user_id, skill) VALUES ('user_berk01', 'Algoritma');
INSERT INTO user_skills (user_id, skill) VALUES ('user_ugur01', 'MATLAB');
INSERT INTO user_skills (user_id, skill) VALUES ('user_ugur01', 'Sinyal İşleme');

-- Resources --------------------------------------------------------
INSERT INTO resources (id, title, type, description, department_id) VALUES
  ('res_stewart', 'Stewart Calculus 8. Baskı', 'BOOK', 'Hemen hemen sıfır, çok az altı çizilmiş.', 'dept_cs01');
INSERT INTO resources (id, title, type, description, department_id) VALUES
  ('res_linalg',  'Linear Algebra Ders Notları (PDF)', 'NOTES', 'Hafta hafta el yazısı, taranmış net PDF.', 'dept_cs01');
INSERT INTO resources (id, title, type, description, department_id) VALUES
  ('res_signals', 'Signals & Systems — Oppenheim', 'BOOK', '2. el, hafif yıpranmış ama tertemiz.', 'dept_ee01');
INSERT INTO resources (id, title, type, description, department_id) VALUES
  ('res_algoex',  'Algoritma Vize Çıkmış Sorular', 'EXAM', 'Son 5 yılın çözümlü vize soruları.', 'dept_cs01');

-- Posts ------------------------------------------------------------
INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id) VALUES
  ('post_elif_01',
   'Calculus kitabımı, Algoritma notlarıyla takas ediyorum',
   'Kitap çok temiz. Algoritma final notları ya da çıkmış soru paketi olan biriyle takaslaşmak isterim.',
   'ACTIVE', 'user_elif01', 'res_stewart', 'res_algoex');

INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id) VALUES
  ('post_berk_01',
   'Lineer Cebir PDF''i takas — herhangi bir EE kitabı',
   'PDF tamamen taranmış halde, mail ile paylaşırım. Karşılığında EE temel kitaplarından birini arıyorum.',
   'ACTIVE', 'user_berk01', 'res_linalg', 'res_signals');

INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id) VALUES
  ('post_ugur_01',
   'Signals & Systems vs Calculus',
   'EE 2. sınıfım, Stewart Calculus arıyorum.',
   'ACTIVE', 'user_ugur01', 'res_signals', 'res_stewart');

COMMIT;
