# CampusSwap

> Üniversite öğrencileri için akademik kaynak takas platformu.
> Kitap, ders notu, çıkmış sınav ve proje kaynaklarını kampüs içinde
> güvenle değiş tokuş et.

Bu proje Grup 13'ün **Veritabanı Yönetim Sistemleri** dersi
projesidir. ER diyagramında modellenen CampusSwap sistemini
Next.js + **Oracle Database 23ai** + raw SQL ile uçtan uca uygular.

## Özellikler

- **Kullanıcı yönetimi** — kayıt, giriş, JWT + httpOnly cookie auth
- **Profil** — bölüm, yetkinlikler (çoklu değerli), biyografi
- **İlanlar** — kaynak sunma + karşılığında istenen kaynağı belirtme
- **Filtreleme** — bölüme, kaynak türüne, anahtar kelimeye göre
- **Favoriler** — N:M ilişki, sonra göz atmak için kaydet
- **Takas akışı** — teklif → kabul/red → tamamlandı → değerlendir
- **Direkt mesajlaşma** — profil üzerinden DM + takas başına özel sohbet
- **Değerlendirme** — 1-5 yıldız + yorum, profilde ortalama
- **Raporlama** — uygunsuz ilan/kullanıcıyı raporla
- **SQL Öğretici Mod** — herhangi bir karta 4 kez tıkla; o aksiyonun
  arkasındaki gerçek Oracle SQL sorgusunu adım adım göster

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 |
| Stil | Tailwind CSS v3 + custom design tokens |
| Animasyon | Framer Motion (sayfa geçişleri, loading) |
| Backend | Next.js API routes (Node runtime) |
| Veritabanı | **Oracle Database 23ai** (Docker) |
| DB sürücü | `node-oracledb` (Thin mode — Instant Client gerekmez) |
| Veri erişim | Raw SQL repository katmanı (`src/lib/repo.ts`) |
| Auth | bcrypt + jose (JWT) + httpOnly cookies |
| Validation | Zod |

## Hızlı başlangıç (lokal)

> Gereksinim: **Docker Desktop** + **Node 20+**

### 🚀 Tek tıkla başlat (Windows)

Masaüstündeki **CampusSwap** kısayoluna çift tıkla (veya proje
klasöründeki `CampusSwap.bat`). Asıl iş `CampusSwap.ps1`'de — PowerShell
script'i sırayla şunları yapar:

1. Docker Desktop kapalıysa açar ve hazır olmasını bekler
2. Oracle container'ı başlatır (ilk seferde image indirir + schema/seed yükler, ~5-10 dk)
3. `npm install` (gerekirse) ve `.env` (yoksa) hazırlar
4. **Aynı pencerede** `npm run dev` çalıştırır (ön planda, logları görürsün)
5. 12 sn sonra tarayıcıda `http://localhost:3000` açar

**Kapatmak için:** pencerede **Ctrl+C** bas veya pencereyi kapat.
PowerShell `try/finally` ile dev sunucusunu ve Oracle container'ı
**otomatik durdurur** (`docker stop` + 3000 portunu temizleme).

Masaüstündeki **CampusSwap-Stop** kısayolu da var (acil durdurma için).

**İlk kullanımda masaüstüne kısayol oluşturmak için** proje klasöründe
PowerShell aç ve şunu çalıştır:

```powershell
.\Install-Shortcuts.ps1
```

### Manuel adımlar

1. **Bağımlılıkları yükle**

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Oracle container'ı başlat**

   ```bash
   npm run db:up
   ```

   İlk çalıştırmada `gvenzl/oracle-free:23-slim-faststart` image'ı çekilir
   (~1.2 GB). Container `localhost:1521/FREEPDB1` üzerinde `campus / campus123`
   kullanıcısıyla erişilebilir hale gelir. "DATABASE IS READY TO USE" log'unu
   bekle (ilk açılış ~30-60 sn).

3. **`.env` dosyasını oluştur**

   ```bash
   cp .env.example .env
   ```

   Default Oracle değerleri hazır. Sadece `JWT_SECRET` üret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

4. **Şemayı ve demo veriyi yükle**

   ```bash
   npm run db:setup      # db:reset (schema.sql) + db:seed
   ```

5. **Dev sunucusunu başlat**

   ```bash
   npm run dev
   ```

   Tarayıcıdan: `http://localhost:3000`

### Demo hesaplar

| E-posta | Şifre |
|---------|-------|
| elif@example.com | test1234 |
| berkant@example.com | test1234 |
| ugur@example.com | test1234 |

## Komutlar

```bash
npm run dev          # Next.js dev sunucu
npm run build        # production build
npm run start        # production sunucu

npm run db:up        # Oracle container'ı başlat (yoksa oluştur)
npm run db:down      # container'ı durdur
npm run db:reset     # schema.sql'i uygula (tüm tabloları yeniden kur)
npm run db:seed      # demo veri yükle (Node + bcrypt)
npm run db:setup     # reset + seed
npm run db:cli       # container içinde sqlplus aç
```

## Veritabanı

### Bağlantı katmanı (`src/lib/db.ts`)
- `node-oracledb` Thin mode connection pool (`poolMin`/`poolMax` env'den)
- `query` / `queryOne` / `execute` / `tx` yardımcıları
- Manuel transaction için `tx()` — `commit`/`rollback` otomatik

### Şema (`db/schema.sql`)
ER diyagramının 3NF'e normalize edilmiş Oracle DDL'i — 12 tablo:

- **departments** (`id, name, faculty`)
- **users** (`id, username, email, password_hash, avatar_name, bio, department_id`)
- **user_skills** (`user_id, skill`) — çoklu değerli özellik
- **resources** (`id, title, type, description, department_id`)
- **posts** (`id, title, status, owner_id, offer_id, request_id`)
- **exchanges** (`id, post_id, requester_id, status`) — UNIQUE(post_id, requester_id)
- **exchange_messages** (`exchange_id, message_no, sender_id, content`) — zayıf varlık
- **reviews** (`id, exchange_id, reviewer_id, reviewee_id, rating, comment_text`)
- **favorites** (`user_id, post_id, added_at`) — N:M
- **reports** (`id, reporter_id, reported_user_id, target_type, target_id, reason, status`)
- **conversations** (`id, user_a_id, user_b_id, last_message_at`) — kanonik çift
- **direct_messages** (`id, conversation_id, sender_id, content`)

Oracle özellikleri: enum yerine `CHECK` constraint, boolean yerine
`NUMBER(1)`, `SYS_GUID()` yerine uygulama-üretimi cuid PK, `MERGE` ile
idempotent insert, `FETCH FIRST n ROWS ONLY` ile sayfalama.

## Proje yapısı

```
db/
  schema.sql             # Oracle DDL (12 tablo)
  seed.ts                # Node tabanlı seed (bcrypt hash runtime)

src/
  app/
    layout.tsx           # header/footer + EducationalProvider + AppShell
    page.tsx             # sosyal feed (tek kolon)
    login/, register/    # auth sayfaları
    posts/               # feed, detay, yeni ilan
    exchanges/           # takas listesi + chat
    messages/            # DM listesi + DM detay
    favorites/, profile/, settings/
    api/                 # tüm REST endpointleri

  components/
    ui/                  # Button, Input, Card, Badge, Toast, Icon, LoadingScreen
    layout/              # Header, Footer, AppShell (sayfa geçişleri)
    posts/               # FeedPost
    educational/         # SQL öğretici mod (provider, overlay, katalog)

  lib/
    db.ts                # Oracle connection pool + sorgu yardımcıları
    repo.ts              # raw SQL repository katmanı
    types.ts             # normalize edilmiş veri tipleri
    auth.ts              # JWT, cookie, password
    utils.ts             # tarih, etiket, cn()

  middleware.ts          # protected route koruması
```

## SQL Öğretici Mod

Sol alttaki **SQL** rozetine bas (veya sadece bir karta **4 kez hızlıca**
tıkla). Ekran kararır, ilgili element spotlight ile çıkar ve sağ üstte
o aksiyonun arkasındaki **gerçek Oracle SQL** adım adım gösterilir:
`post-open`, `favorite`, `unfavorite`, `profile-message`, `dm-send`,
`feed`, `exchange-request`, `exchange-accept`. ESC veya boş alana tıkla → kapat.

## Notlar

- Docker Desktop kapanırsa container durur; `npm run db:up` ile geri başlar.
  Container'a `--restart unless-stopped` policy uygulanmıştır.
- Veri container filesystem'inde tutulur; `db:reset` tüm tabloları siler.
- Vercel deploy için Oracle Cloud Autonomous DB (Free Tier) + wallet gerekir;
  `ORACLE_CONNECT_STRING`'i TNS alias'a, `TNS_ADMIN`'i wallet klasörüne ayarla.

## Lisans

Eğitim amaçlı proje. Grup 13 / VYS dersi.

— **Grup üyeleri**: Elif Doğa Tarhana · Berkant Acun · Uğur Pehlivan
· Melih Kaan Beşir · Ahmet Emir Civelek
