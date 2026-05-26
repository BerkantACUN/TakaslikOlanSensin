# CampusSwap

> Üniversite öğrencileri için akademik kaynak takas platformu.
> Kitap, ders notu, çıkmış sınav ve proje kaynaklarını kampüs içinde
> güvenle değiş tokuş et.

Bu proje Grup 13'ün **Veritabanı Yönetim Sistemleri** dersi
projesidir. ER diyagramında modellenen CampusSwap sistemini
Next.js + PostgreSQL + Prisma ile uçtan uca uygular.

## Özellikler

- **Kullanıcı yönetimi** — kayıt, giriş, JWT + httpOnly cookie auth
- **Profil** — bölüm, yetkinlikler (çoklu değerli), biyografi
- **İlanlar** — kaynak sunma + karşılığında istenen kaynağı belirtme
- **Filtreleme** — bölüme, kaynak türüne, anahtar kelimeye göre
- **Favoriler** — N:M ilişki, sonra göz atmak için kaydet
- **Takas akışı** — teklif → kabul/red → tamamlandı → değerlendir
- **Mesajlaşma** — takas başına özel sohbet (zayıf varlık)
- **Değerlendirme** — 1-5 yıldız + yorum, profilde ortalama
- **Raporlama** — uygunsuz ilan/kullanıcıyı raporla

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 |
| Stil | Tailwind CSS v4 (`@theme`) + custom design tokens |
| Backend | Next.js API routes (Edge/Node) |
| Veritabanı | PostgreSQL + Prisma ORM |
| Auth | bcrypt + jose (JWT) + httpOnly cookies |
| Validation | Zod |
| Deploy | Vercel + Neon / Vercel Postgres |

## Hızlı başlangıç (lokal)

1. **Bağımlılıkları yükle**

   ```bash
   npm install
   ```

2. **`.env` dosyasını oluştur**

   ```bash
   cp .env.example .env
   ```

   Sonra `DATABASE_URL`, `DIRECT_URL` ve `JWT_SECRET` doldur.
   `openssl rand -base64 32` ile güvenli bir secret üret.

3. **Veritabanını oluştur**

   ```bash
   npm run db:push        # şemayı veritabanına gönder
   npm run db:seed        # demo veri yükle
   ```

4. **Dev sunucusunu başlat**

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

## Vercel deploy adımları

1. Bu repoyu GitHub'a push'la (zaten yapıldı:
   `https://github.com/BerkantACUN/TakaslikOlanSensin`).

2. Vercel'de **New Project** → bu repoyu içe aktar.

3. **Storage** sekmesinden veritabanı oluştur:
   - Önerilen: **Neon Postgres** (ücretsiz tier yeterli)
   - Alternatif: **Vercel Postgres**

4. Veritabanı bağlandığında Vercel otomatik olarak şu env'leri ekler:
   - `DATABASE_URL`
   - `DIRECT_URL` (Prisma migrate için)

5. Manuel olarak ekle:
   - `JWT_SECRET` — `openssl rand -base64 32` ile üret
   - `NEXT_PUBLIC_SITE_URL` — `https://<proje>.vercel.app`

6. **Deploy** butonuna bas. İlk deploy sonrası şemayı push'lamak için:

   ```bash
   # Lokalden, .env'de production DATABASE_URL set edilmiş halde:
   npx prisma db push
   npm run db:seed       # opsiyonel: demo veri
   ```

   Ya da Vercel'in build hook'u `prisma generate && next build`
   olduğu için ilk deploy zaten Prisma Client'ı üretir.

## Proje yapısı

```
prisma/
  schema.prisma          # 9 tablo: User, Department, Resource,
                         #         Post, Exchange, Review,
                         #         ExchangeMessage, Favorite,
                         #         Report, UserSkill
  seed.ts                # demo data

src/
  app/
    layout.tsx           # global header/footer
    page.tsx             # landing/feed
    login/, register/    # auth sayfaları
    posts/               # browse, detay, yeni ilan
    exchanges/           # takas listesi + chat
    messages/            # tüm sohbetler
    favorites/           # favori ilanlar
    profile/[id]/        # public profil
    settings/            # profil düzenleme
    api/                 # tüm REST endpointleri

  components/
    ui/                  # Button, Input, Card, Badge, Toast, Icon
    layout/              # Header, Footer
    posts/               # PostCard

  lib/
    db.ts                # Prisma client
    auth.ts              # JWT, cookie, password
    utils.ts             # tarih, etiket, cn()

  middleware.ts          # protected route koruması
```

## Veritabanı şeması özet

Document 1'deki ER diyagramı 3NF'e normalize edilmiş hali:

- **User** (`id, username, email, passwordHash, avatarName, bio, departmentId`)
- **UserSkill** (`userId, skill`) — çoklu değerli özellik
- **Department** (`id, name, faculty`)
- **Resource** (`id, title, type, description, departmentId`)
- **Post** (`id, title, ownerId, offerId, requestId, status`)
- **Exchange** (`id, postId, requesterId, status`)
- **ExchangeMessage** (`exchangeId, messageNo, senderId, content`) — zayıf varlık
- **Review** (`id, exchangeId, reviewerId, revieweeId, rating, comment`)
- **Favorite** (`userId, postId, addedAt`) — N:M
- **Report** (`id, reporterId, reportedUserId, targetType, targetId, reason, status`)

## Komutlar

```bash
npm run dev          # dev sunucu
npm run build        # production build
npm run start        # production sunucu
npm run db:push      # şemayı veritabanına yansıt
npm run db:migrate   # migration üret + uygula
npm run db:seed      # demo veri
npm run db:studio    # Prisma Studio GUI
```

## Lisans

Eğitim amaçlı proje. Grup 13 / VYS dersi.

— **Grup üyeleri**: Elif Doğa Tarhana · Berkant Acun · Uğur Pehlivan
· Melih Kaan Beşir · Ahmet Emir Civelek
