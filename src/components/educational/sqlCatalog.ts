/* -------------------------------------------------------------------
   SQL Eğitim Kataloğu
   Her kullanıcı aksiyonunun arka planda hangi SQL sorgusunu çalıştırdığını
   adım adım gösteren öğretici şablonlar. CampusSwap'in Prisma + SQLite
   karşılıklarıdır; Postgres'te de aynı sorgular geçerlidir.
------------------------------------------------------------------- */

export type SqlStep = {
  title: string;
  description: string;
  sql: string;
  highlight?: string;
};

export type SqlScenario = {
  /** Sahne başlığı */
  title: string;
  /** Hikaye tek satır özet */
  subtitle: string;
  /** Veritabanı resmi (hangi tablolar konuşuyor) */
  tables: string[];
  /** Adım adım sorgular */
  steps: SqlStep[];
  /** Hangi DOM kancasını oka tutalım — data-edu attribute değeri */
  target?: string;
};

export const SQL_CATALOG: Record<string, SqlScenario> = {
  /* -------------------- POST AÇMAK -------------------- */
  "post-open": {
    title: "İlan detayını görüntülemek",
    subtitle: "Tek bir post için sahibi, kaynakları ve favori durumu",
    tables: ["posts", "users", "resources", "favorites"],
    target: "post-card",
    steps: [
      {
        title: "1) İlanı, sahibini ve kaynakları çek",
        description:
          "Bir JOIN zinciri: post → owner (User) → department; ayrıca offer ve request kaynakları.",
        sql: `SELECT  p.id, p.title, p.description, p.status,
        u.id AS owner_id, u.username, u.avatar_name,
        d.name AS department,
        ofr.title AS offer_title,  ofr.type AS offer_type,
        req.title AS request_title, req.type AS request_type
FROM    posts p
JOIN    users u           ON u.id  = p.owner_id
LEFT JOIN departments d   ON d.id  = u.department_id
JOIN    resources ofr     ON ofr.id = p.offer_id
JOIN    resources req     ON req.id = p.request_id
WHERE   p.id = :postId;`,
        highlight: "JOIN",
      },
      {
        title: "2) Bu ilanı favorilemiş miyim?",
        description:
          "Login'liyim diye favoriler tablosunda kompozit anahtar (userId, postId) ile arıyorum.",
        sql: `SELECT 1
FROM   favorites
WHERE  user_id = :meId
  AND  post_id = :postId;`,
        highlight: "favorites",
      },
    ],
  },

  /* -------------------- FAVORİLE -------------------- */
  favorite: {
    title: "İlanı favoriye eklemek",
    subtitle: "N:M ilişki — user_id + post_id kompozit anahtarı",
    tables: ["favorites"],
    target: "post-card",
    steps: [
      {
        title: "Yoksa ekle, varsa dokunma (upsert)",
        description:
          "Prisma `favorite.upsert()` çağrısı; SQLite/Postgres'te `INSERT ... ON CONFLICT DO NOTHING` olarak çalışır.",
        sql: `INSERT INTO favorites (user_id, post_id, added_at)
VALUES (:meId, :postId, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, post_id) DO NOTHING;`,
        highlight: "ON CONFLICT",
      },
      {
        title: "Favorilerimi listele (sonradan)",
        description:
          "Sıralama added_at DESC. Post tablosu ile JOIN yapıp ilan bilgilerini de çekiyoruz.",
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
    subtitle: "Tek bir kayıt siliyoruz, kompozit anahtarla",
    tables: ["favorites"],
    target: "post-card",
    steps: [
      {
        title: "DELETE",
        description: "İki sütunlu primary key olduğu için silme tek satırı etkiler.",
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
    subtitle: "Kanonik anahtar (userA < userB) ile aynı çiftin tek konuşması olur",
    tables: ["conversations", "direct_messages"],
    target: "profile-message",
    steps: [
      {
        title: "1) İki kullanıcı arasında konuşma var mı?",
        description:
          "userAId < userBId garantisi sayesinde tek bir kanonik kayıt aranıyor.",
        sql: `SELECT id
FROM   conversations
WHERE  user_a_id = MIN(:meId, :otherId)
  AND  user_b_id = MAX(:meId, :otherId);`,
      },
      {
        title: "2) Yoksa oluştur (upsert)",
        description:
          "Prisma tarafında `conversation.upsert()`. SQL'de eşdeğeri:",
        sql: `INSERT INTO conversations (id, user_a_id, user_b_id, created_at, last_message_at)
VALUES (:cuid, :userA, :userB, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;`,
        highlight: "ON CONFLICT",
      },
      {
        title: "3) Mevcut mesajları getir",
        description: "Konuşmaya ait tüm DM'ler tarih sırasıyla.",
        sql: `SELECT *
FROM   direct_messages
WHERE  conversation_id = :convoId
ORDER BY created_at ASC;`,
      },
    ],
  },

  /* -------------------- DM GÖNDER -------------------- */
  "dm-send": {
    title: "Direkt mesaj göndermek",
    subtitle: "Tek bir INSERT + konuşmanın son güncel zamanı",
    tables: ["direct_messages", "conversations"],
    target: "dm-input",
    steps: [
      {
        title: "1) Mesajı kaydet",
        description: "Her mesaj kendi cuid'sini alır, sender_id auth'tan gelir.",
        sql: `INSERT INTO direct_messages (id, conversation_id, sender_id, content, created_at)
VALUES (:cuid, :convoId, :meId, :content, CURRENT_TIMESTAMP);`,
        highlight: "INSERT",
      },
      {
        title: "2) Konuşmanın son mesaj zamanını güncelle",
        description:
          "Mesaj listemizi `lastMessageAt DESC` ile sıraladığımız için bu alanı taze tutmamız gerek.",
        sql: `UPDATE conversations
SET    last_message_at = CURRENT_TIMESTAMP
WHERE  id = :convoId;`,
        highlight: "UPDATE",
      },
      {
        title: "3) İki sorgu tek transaction içinde",
        description:
          "Prisma `$transaction([..., ...])` — biri başarısız olursa diğeri de geri alınır (ATOMIC).",
        sql: `BEGIN;
  INSERT INTO direct_messages ...;
  UPDATE conversations SET last_message_at = ... WHERE id = ...;
COMMIT;`,
        highlight: "BEGIN/COMMIT",
      },
    ],
  },

  /* -------------------- FEED -------------------- */
  feed: {
    title: "Akışı (feed) hazırlamak",
    subtitle: "Aktif ilanlar, sahip + kaynak + favori durumu tek sorguda",
    tables: ["posts", "users", "resources", "favorites"],
    target: "feed",
    steps: [
      {
        title: "Tüm aktif ilanları sırala",
        description:
          "INDEX(status) ve INDEX(owner_id) seed'de tanımlı; sıralama created_at DESC.",
        sql: `SELECT  p.*, u.username, u.avatar_name,
        ofr.title AS offer_title, req.title AS request_title
FROM    posts p
JOIN    users u       ON u.id  = p.owner_id
JOIN    resources ofr ON ofr.id = p.offer_id
JOIN    resources req ON req.id = p.request_id
WHERE   p.status = 'ACTIVE'
ORDER BY p.created_at DESC
LIMIT 60;`,
        highlight: "ORDER BY",
      },
      {
        title: "Hangileri benim favorimde?",
        description:
          "Prisma'da `favorites: { where: { userId: me.id } }` ile aynı sorguda toplu çekiliyor.",
        sql: `SELECT post_id
FROM   favorites
WHERE  user_id = :meId
  AND  post_id IN (:postIdList);`,
      },
    ],
  },

  /* -------------------- TAKAS TEKLİFİ -------------------- */
  "exchange-request": {
    title: "Takas teklifi göndermek",
    subtitle: "Aynı kişi aynı posta birden fazla teklif gönderemez (unique)",
    tables: ["exchanges", "posts"],
    target: "post-card",
    steps: [
      {
        title: "1) İlan benim mi? (kendi ilanına teklif yasak)",
        description: "İlk olarak sahibi kontrol ediyoruz.",
        sql: `SELECT owner_id
FROM   posts
WHERE  id = :postId;`,
      },
      {
        title: "2) Mevcut teklif var mı?",
        description: "UNIQUE(post_id, requester_id) constraint'i ihlal etmemek için.",
        sql: `SELECT id, status
FROM   exchanges
WHERE  post_id = :postId
  AND  requester_id = :meId;`,
      },
      {
        title: "3) Yeni teklifi oluştur",
        description: "Default status = 'PENDING'.",
        sql: `INSERT INTO exchanges
  (id, post_id, requester_id, status, created_at, updated_at)
VALUES
  (:cuid, :postId, :meId, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
        highlight: "INSERT",
      },
    ],
  },
};
