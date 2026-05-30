/**
 * PostgreSQL seed — Node tabanlı.
 * Çalıştır: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { tx, execNoQuery } from "../src/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  await tx(async (client) => {
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
        client,
        `INSERT INTO departments (id, name, faculty) VALUES ($1, $2, $3)`,
        [id, name, faculty],
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
        "berkant_acun",
        "Berkant Acun",
        "Yazılım Mühendisliği — algoritma kitaplarımı paylaşmaktan keyif alıyorum.",
        "dept_cs01",
      ],
    ];
    for (const [id, email, username, avatar_name, bio, department_id] of users) {
      await execNoQuery(
        client,
        `INSERT INTO users (id, email, username, password_hash, avatar_name, bio, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, email, username, passwordHash, avatar_name, bio, department_id],
      );
    }

    console.log("→ Yetkinlikler...");
    const skills: [string, string][] = [
      ["user_elif01", "Python"],
      ["user_elif01", "Matematik"],
      ["user_berk01", "React"],
      ["user_berk01", "Algoritma"],
      ["user_berk01", "Next.js"],
    ];
    for (const [user_id, skill] of skills) {
      await execNoQuery(
        client,
        `INSERT INTO user_skills (user_id, skill) VALUES ($1, $2)`,
        [user_id, skill],
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
        client,
        `INSERT INTO resources (id, title, type, description, department_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, title, type, description, department_id],
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
        "Lineer Cebir PDF'i takas — Signals & Systems karşılığında",
        "PDF tamamen taranmış halde, mail ile paylaşırım. Karşılığında Oppenheim Signals & Systems kitabını arıyorum.",
        "user_berk01",
        "res_linalg",
        "res_signals",
      ],
      [
        "post_berk_02",
        "Algoritma vize sorularımı, Calculus kitabıyla takas ederim",
        "Son 5 yılın çözümlü vize sorularımı paylaşırım. Karşılığında Stewart Calculus 8. baskısı arıyorum.",
        "user_berk01",
        "res_algoex",
        "res_stewart",
      ],
    ];
    for (const [id, title, description, owner_id, offer_id, request_id] of posts) {
      await execNoQuery(
        client,
        `INSERT INTO posts (id, title, description, status, owner_id, offer_id, request_id)
         VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6)`,
        [id, title, description, owner_id, offer_id, request_id],
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
