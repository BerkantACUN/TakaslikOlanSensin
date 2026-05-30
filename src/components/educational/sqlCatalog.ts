/* -------------------------------------------------------------------
   SQL Eğitim Kataloğu — Oracle Database 23ai
   Her kullanıcı aksiyonunun arka planda çalıştırdığı gerçek Oracle SQL
   sorgularını adım adım gösteren öğretici şablonlar. CampusSwap'in
   node-oracledb + raw SQL repository katmanına birebir karşılık gelir.
   Bind değişkenleri Oracle stili `:param` ile gösterilir.
------------------------------------------------------------------- */

export interface SqlStep {
  title: string;
  description: string;
  sql: string;
  highlight?: string;
}

export interface SqlScenario {
  title: string;
  subtitle: string;
  tables: string[];
  steps: SqlStep[];
  target?: string;
}

export const SQL_CATALOG: Record<string, SqlScenario> = {
  /* -------------------- POST AÇMAK -------------------- */
  "post-open": {
    title: "İlan detayını görüntülemek",
    subtitle: "Tek post için sahip, kaynaklar ve favori durumu (Oracle JOIN)",
    tables: ["posts", "users", "departments", "resources", "favorites"],
    target: "post-card",
    steps: [
      {
        title: "1) İlanı, sahibini ve kaynakları tek sorguda çek",
        description:
          "posts → users → departments JOIN zinciri; offer ve request resources iki kez JOIN'lenir. Favori durumu skaler alt sorgu + CASE ile aynı sorguda gelir.",
        sql: `SELECT  p.id, p.title, p.description, p.status,
        u.id AS owner_id, u.username, u.avatar_name,
        d.name AS department,
        o.title AS offer_title,  o.type AS offer_type,
        r.title AS request_title, r.type AS request_type,
        CASE WHEN EXISTS (
          SELECT 1 FROM favorites f
          WHERE f.user_id = :meId AND f.post_id = p.id
        ) THEN 1 ELSE 0 END AS fav_flag
FROM    posts p
JOIN    users u           ON u.id = p.owner_id
LEFT JOIN departments d   ON d.id = u.department_id
JOIN    resources o       ON o.id = p.offer_id
JOIN    resources r       ON r.id = p.request_id
WHERE   p.id = :postId;`,
        highlight: "JOIN",
      },
      {
        title: "2) Sahibin ortalama puanı",
        description:
          "reviews tablosunda AVG ve COUNT — Oracle agregat fonksiyonları. Puan yoksa AVG NULL döner.",
        sql: `SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt
FROM   reviews
WHERE  reviewee_id = :ownerId;`,
        highlight: "AVG",
      },
    ],
  },

  /* -------------------- FAVORİLE -------------------- */
  favorite: {
    title: "İlanı favoriye eklemek",
    subtitle: "N:M ilişki — Oracle MERGE ile idempotent ekleme",
    tables: ["favorites"],
    target: "post-card",
    steps: [
      {
        title: "MERGE — yoksa ekle, varsa dokunma",
        description:
          "Oracle'da PostgreSQL'in `ON CONFLICT`'i yerine MERGE kullanılır. DUAL üstünden kaynak satır kurgulanıp eşleşme yoksa INSERT edilir.",
        sql: `MERGE INTO favorites f
USING (SELECT :meId AS user_id, :postId AS post_id FROM dual) src
   ON (f.user_id = src.user_id AND f.post_id = src.post_id)
WHEN NOT MATCHED THEN
  INSERT (user_id, post_id) VALUES (src.user_id, src.post_id);`,
        highlight: "MERGE",
      },
      {
        title: "Favorilerimi listele",
        description:
          "favorites → posts JOIN, added_at DESC sıralı. FETCH FIRST ile limit Oracle 12c+ sözdizimidir.",
        sql: `SELECT  p.*
FROM    favorites f
JOIN    posts p ON p.id = f.post_id
WHERE   f.user_id = :meId
ORDER BY f.added_at DESC;`,
      },
    ],
  },

  /* -------------------- FAVORİYİ KALDIR -------------------- */
  unfavorite: {
    title: "Favoriden çıkarmak",
    subtitle: "Kompozit anahtarla tek satır siler",
    tables: ["favorites"],
    target: "post-card",
    steps: [
      {
        title: "DELETE",
        description:
          "(user_id, post_id) kompozit primary key olduğu için silme tam bir satırı hedefler.",
        sql: `DELETE FROM favorites
WHERE  user_id = :meId
  AND  post_id = :postId;`,
        highlight: "DELETE",
      },
    ],
  },

  /* -------------------- PROFİL MESAJ AT -------------------- */
  "profile-message": {
    title: "Direkt mesajlaşma başlatmak",
    subtitle: "Kanonik anahtar (user_a_id < user_b_id) tek konuşma garantiler",
    tables: ["conversations", "direct_messages"],
    target: "profile-message",
    steps: [
      {
        title: "1) Kanonik çift halinde konuşma var mı?",
        description:
          "Uygulama iki id'yi sıralayıp küçüğü user_a, büyüğü user_b yapar. Böylece (a,b) ve (b,a) aynı satıra düşer; CHECK (user_a_id < user_b_id) bunu DB seviyesinde de zorlar.",
        sql: `SELECT id
FROM   conversations
WHERE  user_a_id = :userA   -- LEAST(:me, :other)
  AND  user_b_id = :userB;  -- GREATEST(:me, :other)`,
      },
      {
        title: "2) Yoksa oluştur",
        description:
          "id uygulama tarafında üretilen kısa cuid. UNIQUE(user_a_id, user_b_id) çakışmayı engeller.",
        sql: `INSERT INTO conversations (id, user_a_id, user_b_id)
VALUES (:cuid, :userA, :userB);`,
        highlight: "INSERT",
      },
      {
        title: "3) Mevcut mesajları yükle",
        description: "Konuşmaya ait DM'ler kronolojik sırada.",
        sql: `SELECT id, sender_id, content, created_at
FROM   direct_messages
WHERE  conversation_id = :convoId
ORDER BY created_at ASC;`,
      },
    ],
  },

  /* -------------------- DM GÖNDER -------------------- */
  "dm-send": {
    title: "Direkt mesaj göndermek",
    subtitle: "INSERT + konuşma zamanı güncelleme, tek transaction",
    tables: ["direct_messages", "conversations"],
    target: "dm-input",
    steps: [
      {
        title: "1) Mesajı kaydet",
        description: "sender_id JWT'den gelen oturum kullanıcısı; id kısa cuid.",
        sql: `INSERT INTO direct_messages (id, conversation_id, sender_id, content)
VALUES (:cuid, :convoId, :meId, :content);`,
        highlight: "INSERT",
      },
      {
        title: "2) Konuşmanın son mesaj zamanını güncelle",
        description:
          "Mesaj listesini last_message_at DESC ile sıraladığımız için bu alan tazelenir. SYSTIMESTAMP Oracle'ın anlık zaman damgasıdır.",
        sql: `UPDATE conversations
SET    last_message_at = SYSTIMESTAMP
WHERE  id = :convoId;`,
        highlight: "UPDATE",
      },
      {
        title: "3) İki ifade tek transaction",
        description:
          "node-oracledb autoCommit kapalı; her iki ifade conn.commit() ile birlikte kalıcı olur, hata olursa rollback edilir (atomic).",
        sql: `-- conn.autoCommit = false
INSERT INTO direct_messages ...;
UPDATE conversations SET last_message_at = SYSTIMESTAMP WHERE id = :convoId;
COMMIT;`,
        highlight: "COMMIT",
      },
    ],
  },

  /* -------------------- FEED -------------------- */
  feed: {
    title: "Akışı (feed) hazırlamak",
    subtitle: "Aktif ilanlar + sahip + kaynak + favori, tek sorgu",
    tables: ["posts", "users", "resources", "favorites"],
    target: "feed",
    steps: [
      {
        title: "Aktif ilanları sırala ve sınırla",
        description:
          "IX_POSTS_STATUS ve IX_POSTS_CREATED indeksleri devrede; FETCH FIRST n ROWS ONLY Oracle'ın LIMIT karşılığıdır.",
        sql: `SELECT  p.id, p.title, p.status, p.created_at,
        u.username, u.avatar_name,
        o.title AS offer_title, r.title AS request_title
FROM    posts p
JOIN    users u     ON u.id = p.owner_id
JOIN    resources o ON o.id = p.offer_id
JOIN    resources r ON r.id = p.request_id
WHERE   p.status = 'ACTIVE'
ORDER BY p.created_at DESC
FETCH FIRST 30 ROWS ONLY;`,
        highlight: "FETCH FIRST",
      },
      {
        title: "Popüler sıralama (alternatif)",
        description:
          "sort=popular iken teklif sayısına göre sıralanır — korelasyonlu alt sorgu.",
        sql: `ORDER BY (SELECT COUNT(*) FROM exchanges e
          WHERE e.post_id = p.id) DESC,
         p.created_at DESC`,
      },
    ],
  },

  /* -------------------- TAKAS TEKLİFİ -------------------- */
  "exchange-request": {
    title: "Takas teklifi göndermek",
    subtitle: "UNIQUE(post_id, requester_id) çift teklifi engeller",
    tables: ["exchanges", "posts"],
    target: "post-card",
    steps: [
      {
        title: "1) İlan sahibi kim?",
        description: "Kendi ilanına teklif engellemek için önce owner okunur.",
        sql: `SELECT owner_id, status
FROM   posts
WHERE  id = :postId;`,
      },
      {
        title: "2) Daha önce teklif vermiş miyim?",
        description:
          "UNIQUE(post_id, requester_id) constraint'ini ihlal etmemek için kontrol.",
        sql: `SELECT id, status
FROM   exchanges
WHERE  post_id = :postId
  AND  requester_id = :meId;`,
      },
      {
        title: "3) Yeni teklif oluştur",
        description: "Varsayılan status 'PENDING' (CHECK constraint ile sınırlı).",
        sql: `INSERT INTO exchanges (id, post_id, requester_id, status)
VALUES (:cuid, :postId, :meId, 'PENDING');`,
        highlight: "INSERT",
      },
    ],
  },

  /* -------------------- BÖLÜM DAĞILIMI (GROUP BY) -------------------- */
  "dept-stats": {
    title: "Bölüm dağılımı — GROUP BY agregasyonu",
    subtitle: "Her bölümün ilan ve kullanıcı sayısı, tek sorguda",
    tables: ["departments", "users", "posts"],
    target: "dept-stats",
    steps: [
      {
        title: "GROUP BY ile agregasyon",
        description:
          "departments ile users ve aktif posts LEFT JOIN'lenir, sonra her bölüm için DISTINCT post/user sayıları hesaplanır. Bölümleri post sayısına göre azalan sıralarız.",
        sql: `SELECT  d.id,
        d.name,
        d.faculty,
        COUNT(DISTINCT p.id) AS post_count,
        COUNT(DISTINCT u.id) AS user_count
FROM    departments d
LEFT JOIN users u ON u.department_id = d.id
LEFT JOIN posts p ON p.owner_id = u.id AND p.status = 'ACTIVE'
GROUP BY d.id, d.name, d.faculty
ORDER BY post_count DESC, user_count DESC
FETCH FIRST 6 ROWS ONLY;`,
        highlight: "GROUP BY",
      },
      {
        title: "Neden DISTINCT?",
        description:
          "Bir kullanıcı birden çok ilana sahipse, JOIN sonucu users tablosu o kullanıcının id'sini her ilan kadar tekrarlar. DISTINCT olmadan COUNT(u.id) gerçek sayıdan yüksek çıkar.",
        sql: `-- Yanlış (kullanıcılar tekrarlanır):
COUNT(u.id)

-- Doğru (her kullanıcı bir kez sayılır):
COUNT(DISTINCT u.id)`,
        highlight: "DISTINCT",
      },
    ],
  },

  /* -------------------- HESAP SİLME -------------------- */
  "delete-account": {
    title: "Hesabı kalıcı olarak silmek",
    subtitle: "Tek DELETE — FK cascade ile tüm bağlı veriler temizlenir",
    tables: ["users", "posts", "favorites", "exchanges", "direct_messages"],
    target: "delete-account",
    steps: [
      {
        title: "1) Kullanıcı kaydını sil",
        description:
          "Tek bir DELETE ifadesi yeterli. Şemadaki tüm FK'ler `ON DELETE CASCADE` ile tanımlandığı için Oracle otomatik olarak bu kullanıcıya bağlı tüm satırları temizler.",
        sql: `DELETE FROM users
WHERE  id = :meId;`,
        highlight: "DELETE",
      },
      {
        title: "2) Cascade ile silinen bağımlı kayıtlar",
        description:
          "Aşağıdaki FK'ler kullanıcı silindiğinde tetiklenir; bu satırlar manuel silinmez, Oracle constraint motoru yapar.",
        sql: `-- posts (owner_id)               -> CASCADE
-- favorites (user_id, post_id)  -> CASCADE
-- exchanges (requester_id)      -> CASCADE
-- exchange_messages (sender_id) -> CASCADE
-- direct_messages (sender_id)   -> CASCADE
-- conversations (user_a/b_id)   -> CASCADE
-- reviews (reviewer, reviewee)  -> CASCADE
-- user_skills (user_id)         -> CASCADE
-- reports (reporter_id)         -> CASCADE
-- reports (reported_user_id)    -> SET NULL`,
      },
      {
        title: "3) Oturumu sonlandır",
        description:
          "Uygulama katmanı httpOnly cookie'yi temizler; istemci tarafında ana sayfaya yönlenir.",
        sql: `-- SQL değil, Next.js: cookies().delete('campusswap_token')`,
      },
    ],
  },

  /* -------------------- TEKLİF KABUL -------------------- */
  "exchange-accept": {
    title: "Takas teklifini kabul etmek",
    subtitle: "Üç UPDATE tek transaction — diğer teklifler reddedilir",
    tables: ["exchanges", "posts"],
    target: "post-card",
    steps: [
      {
        title: "1) Teklifi onayla",
        description: "Sadece PENDING durumundaki teklif kabul edilebilir.",
        sql: `UPDATE exchanges
SET    status = 'ACCEPTED', updated_at = SYSTIMESTAMP
WHERE  id = :exchangeId;`,
        highlight: "UPDATE",
      },
      {
        title: "2) İlanı rezerve et",
        description: "Post artık başka teklif almasın diye RESERVED olur.",
        sql: `UPDATE posts
SET    status = 'RESERVED', updated_at = SYSTIMESTAMP
WHERE  id = :postId;`,
      },
      {
        title: "3) Aynı ilandaki diğer teklifleri reddet",
        description: "Tek takas kuralı — kalan PENDING teklifler topluca REJECTED.",
        sql: `UPDATE exchanges
SET    status = 'REJECTED', updated_at = SYSTIMESTAMP
WHERE  post_id = :postId
  AND  status = 'PENDING'
  AND  id <> :exchangeId;`,
        highlight: "UPDATE",
      },
    ],
  },
};
