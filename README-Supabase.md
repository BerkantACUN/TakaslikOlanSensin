# CampusSwap — Supabase + Vercel Deploy

Bu branch (`supabase`) PostgreSQL adapter ile çalışır. **main** branch'i
Oracle'da kalmaya devam eder; iki branch birbirinden bağımsızdır.

## 1. Supabase tarafı

1. **Supabase Dashboard** → Projeyi aç → **Project Settings → Database**
2. **Connection string → URI** sekmesinden `postgres://` ile başlayan
   stringi kopyala
3. `[YOUR-PASSWORD]` kısmını **database password**'ün ile değiştir
   (Settings → Database → "Reset database password" ile alabilirsin)
4. Şu komutu çalıştır:

   ```bash
   # .env dosyanı oluştur
   cp .env.example .env

   # DATABASE_URL'i .env içinde doldur, sonra:
   npm install --legacy-peer-deps
   npm run db:setup      # schema + seed (Postgres)
   ```

5. Lokal test:

   ```bash
   npm run dev
   # http://localhost:3000
   ```

## 2. Vercel deploy

1. **vercel.com** → Yeni proje → bu repoyu import et
2. **Branch:** `supabase` (Production Branch)
3. **Environment Variables** (Settings → Environment Variables):

   | İsim | Değer |
   |---|---|
   | `DATABASE_URL` | Supabase connection string (transaction pooler önerilir, port 6543) |
   | `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` ile üret |
   | `NEXT_PUBLIC_SITE_URL` | `https://<proje>.vercel.app` (deploy sonrası) |

4. **Vercel pooler kullanırken** (önerilen): `DATABASE_URL`'i
   `aws-0-<region>.pooler.supabase.com:6543/postgres` formatında kullan,
   çünkü serverless function başına yeni connection açılır.

5. **Deploy** butonuna bas. İlk deploy sonrası migrasyon zaten lokal
   makinende uygulandığı için tablolar hazır olmalı. Yeni schema
   değişikliği yaparsan tekrar `npm run db:reset && npm run db:seed`
   ile prod Supabase'e push'la.

## 3. Branch'ler arası geçiş

```bash
# Oracle (lokal demo) versiyonu
git checkout main
npm install --legacy-peer-deps     # oracledb gerekir
npm run dev

# Supabase (Vercel) versiyonu
git checkout supabase
npm install --legacy-peer-deps     # pg gerekir
npm run dev
```

İki branch farklı `src/lib/db.ts` ve `src/lib/repo.ts` kullanır; geri
kalan tüm UI, auth, eğitim modu ortaktır.

## 4. Postgres ↔ Oracle dialect farkları

| Konsept | Oracle (main) | PostgreSQL (supabase) |
|---|---|---|
| Bind | `:name` | `$1, $2, ...` |
| Upsert | `MERGE INTO ... USING dual` | `INSERT ... ON CONFLICT DO NOTHING` |
| Limit | `FETCH FIRST n ROWS ONLY` | `LIMIT n` |
| Şimdi | `SYSTIMESTAMP` | `NOW()` |
| Boş koruma | `NVL(x, y)` | `COALESCE(x, y)` |
| Case insensitive | `LOWER(col) LIKE LOWER(?)` | `col ILIKE ?` |
| Boolean toplama | yok (NUMBER(1) + MAX) | `BOOL_OR(expr)` |

SQL Öğretici Modu (`src/components/educational/sqlCatalog.ts`) hâlâ
Oracle SQL'i gösterir — eğitim modunun amacı hocanın istediği Oracle
dialect'i öğretmek; çalışan Postgres uygulaması bu sorguların PostgreSQL
karşılığını çalıştırır.
