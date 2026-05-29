/**
 * Oracle seed — Node tabanlı.
 * Çalıştır: npm run db:seed
 *
 * bcrypt hash'ini runtime'da üretir (her seferinde farklı tuz),
 * idempotent değildir — schema'yı sıfırlayıp tekrar uygulamak için
 * önce db/schema.sql çalıştırılır.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { tx, execNoQuery } from "../src/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  await tx(async (conn) => {
    console.log("→ Departmanlar...");
    const departments = [
      ["dept_cs01", "Bilgisayar Mühendisliği", "Mühendislik"],
      ["dept_ee01", "Elektrik-Elektronik Mühendisliği", "Mühendislik"],
      ["dept_ie01", "Endüstri Mühendisliği", "Mühendislik"],
      ["dept_me01", "Makine Mühendisliği", "Mühendislik"],
      ["dept_bu01", "İşletme", "İktisadi ve İdari Bilimler"],
      ["dept_ec01", "Ekonomi", "İktisadi ve İdari Bilimler"],
      ["dept_ps01", "Psikoloji", "Edebiyat"],
      ["dept_ma01", "Matematik", "Fen"],
      ["dept_ph01", "Fizik", "Fen"],
      ["dept_en01", "İngiliz Dili ve Edebiyatı", "Edebiyat"],
    ];
    for (const [id, name, faculty] of departments) {
      await execNoQuery(
        conn,
        `INSERT INTO departments (id, name, faculty) VALUES (:id, :name, :faculty)`,
        { id, name, faculty },
      );
    }

    console.log("→ Kullanıcılar...");
    const users = [
      [
        "user_elif01",
        "elif@example.com",
        "elif_doga",
        "Elif Doğa",
        "Calculus II ve Linear Algebra notlarım var, takasa açığım.",
        "dept_cs01",
      ],
      [
        "user_berk01",
        "berkant@example.com",
        "berkant",
        "Berkant Acun",
        "Yazılım Mühendisliği — algoritma kitaplarımı paylaşmaktan keyif alıyorum.",
        "dept_cs01",
      ],
      [
        "user_ugur01",
        "ugur@example.com",
        "ugur_p",
        "Uğur Pehlivan",
        "EE öğrencisiyim, devre ve sinyal işleme kaynaklarım var.",
        "dept_ee01",
      ],
    ];
    for (const [id, email, username, avatar_name, bio, department_id] of users) {
      await execNoQuery(
        conn,
        `INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id)
         VALUES (:id, :email, :username, :password_hash, :avatar_name, :bio, :department_id)`,
        {
          id,
          email,
          username,
          password_hash: passwordHash,
          avatar_name,
          bio,
          department_id,
        },
      );
    }

    console.log("→ Yetkinlikler...");
    const skills: [string, string][] = [
      ["user_elif01", "Python"],
      ["user_elif01", "Matematik"],
      ["user_berk01", "React"],
      ["user_berk01", "Algoritma"],
      ["user_ugur01", "MATLAB"],
      ["user_ugur01", "Sinyal İşleme"],
    ];
    for (const [user_id, skill] of skills) {
      await execNoQuery(
        conn,
        `INSERT INTO user_skills (user_id, skill) VALUES (:user_id, :skill)`,
        { user_id, skill },
      );
    }

    console.log("→ Kaynaklar...");
    const resources = [
      [
        "res_stewart",
        "Stewart Calculus 8. Baskı",
        "BOOK",
        "Hemen hemen sıfır, çok az altı çizilmiş.",
        "dept_cs01",
      ],
      [
        "res_linalg",
        "Linear Algebra Ders Notları (PDF)",
        "NOTES",
        "Hafta hafta el yazısı, taranmış net PDF.",
        "dept_cs01",
      ],
      [
        "res_signals",
        "Signals & Systems — Oppenheim",
        "BOOK",
        "2. el, hafif yıpranmış ama tertemiz.",
        "dept_ee01",
      ],
      [
        "res_algoex",
        "Algoritma Vize Çıkmış Sorular",
        "EXAM",
        "Son 5 yılın çözümlü vize soruları.",
        "dept_cs01",
      ],
    ];
    for (const [id, title, type, description, department_id] of resources) {
      await execNoQuery(
        conn,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES (:id, :title, :type, :description, :department_id)`,
        { id, title, type, description, department_id },
      );
    }

    console.log("→ İlanlar...");
    const posts = [
      [
        "post_elif_01",
        "Calculus kitabımı, Algoritma notlarıyla takas ediyorum",
        "Kitap çok temiz. Algoritma final notları ya da çıkmış soru paketi olan biriyle takaslaşmak isterim.",
        "user_elif01",
        "res_stewart",
        "res_algoex",
      ],
      [
        "post_berk_01",
        "Lineer Cebir PDF'i takas — herhangi bir EE kitabı",
        "PDF tamamen taranmış halde, mail ile paylaşırım. Karşılığında EE temel kitaplarından birini arıyorum.",
        "user_berk01",
        "res_linalg",
        "res_signals",
      ],
      [
        "post_ugur_01",
        "Signals & Systems vs Calculus",
        "EE 2. sınıfım, Stewart Calculus arıyorum.",
        "user_ugur01",
        "res_signals",
        "res_stewart",
      ],
    ];
    for (const [id, title, description, owner_id, offer_id, request_id] of posts) {
      await execNoQuery(
        conn,
        `INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id)
         VALUES (:id, :title, :description, 'ACTIVE', :owner_id, :offer_id, :request_id)`,
        { id, title, description, owner_id, offer_id, request_id },
      );
    }
  });

  console.log("✓ Seed tamamlandı.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
