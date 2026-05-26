import { PrismaClient, ResourceType, PostStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Departmanlar oluşturuluyor...");
  const departments = await Promise.all(
    [
      { name: "Bilgisayar Mühendisliği", faculty: "Mühendislik" },
      { name: "Elektrik-Elektronik Mühendisliği", faculty: "Mühendislik" },
      { name: "Endüstri Mühendisliği", faculty: "Mühendislik" },
      { name: "Makine Mühendisliği", faculty: "Mühendislik" },
      { name: "İşletme", faculty: "İktisadi ve İdari Bilimler" },
      { name: "Ekonomi", faculty: "İktisadi ve İdari Bilimler" },
      { name: "Psikoloji", faculty: "Edebiyat" },
      { name: "Matematik", faculty: "Fen" },
      { name: "Fizik", faculty: "Fen" },
      { name: "İngiliz Dili ve Edebiyatı", faculty: "Edebiyat" },
    ].map((d) =>
      prisma.department.upsert({
        where: { name: d.name },
        update: {},
        create: d,
      }),
    ),
  );

  const cs = departments[0];
  const ee = departments[1];

  console.log("→ Demo kullanıcılar oluşturuluyor...");
  const passwordHash = await bcrypt.hash("test1234", 10);

  const elif = await prisma.user.upsert({
    where: { email: "elif@example.com" },
    update: {},
    create: {
      email: "elif@example.com",
      username: "elif_doga",
      passwordHash,
      avatarName: "Elif Doğa",
      bio: "Calculus II ve Linear Algebra notlarım var, takasa açığım.",
      departmentId: cs.id,
      skills: {
        create: [{ skill: "Python" }, { skill: "Matematik" }],
      },
    },
  });

  const berkant = await prisma.user.upsert({
    where: { email: "berkant@example.com" },
    update: {},
    create: {
      email: "berkant@example.com",
      username: "berkant",
      passwordHash,
      avatarName: "Berkant Acun",
      bio: "Yazılım Mühendisliği — algoritma kitaplarımı paylaşmaktan keyif alıyorum.",
      departmentId: cs.id,
      skills: { create: [{ skill: "React" }, { skill: "Algoritma" }] },
    },
  });

  const ugur = await prisma.user.upsert({
    where: { email: "ugur@example.com" },
    update: {},
    create: {
      email: "ugur@example.com",
      username: "ugur_p",
      passwordHash,
      avatarName: "Uğur Pehlivan",
      bio: "EE öğrencisiyim, devre ve sinyal işleme kaynaklarım var.",
      departmentId: ee.id,
      skills: { create: [{ skill: "MATLAB" }, { skill: "Sinyal İşleme" }] },
    },
  });

  console.log("→ Demo kaynaklar oluşturuluyor...");
  const resA = await prisma.resource.create({
    data: {
      title: "Stewart Calculus 8. Baskı",
      type: ResourceType.BOOK,
      description: "Hemen hemen sıfır, çok az altı çizilmiş.",
      departmentId: cs.id,
    },
  });
  const resB = await prisma.resource.create({
    data: {
      title: "Linear Algebra Ders Notları (PDF)",
      type: ResourceType.NOTES,
      description: "Hafta hafta el yazısı, taranmış net PDF.",
      departmentId: cs.id,
    },
  });
  const resC = await prisma.resource.create({
    data: {
      title: "Signals & Systems — Oppenheim",
      type: ResourceType.BOOK,
      description: "2. el, hafif yıpranmış ama tertemiz.",
      departmentId: ee.id,
    },
  });
  const resD = await prisma.resource.create({
    data: {
      title: "Algoritma Vize Çıkmış Sorular",
      type: ResourceType.EXAM,
      description: "Son 5 yılın çözümlü vize soruları.",
      departmentId: cs.id,
    },
  });

  console.log("→ Demo ilanlar oluşturuluyor...");
  await prisma.post.create({
    data: {
      title: "Calculus kitabımı, Algoritma notlarıyla takas ediyorum",
      description:
        "Kitap çok temiz. Algoritma final notları ya da çıkmış soru paketi olan biriyle takaslaşmak isterim.",
      ownerId: elif.id,
      offerId: resA.id,
      requestId: resD.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Lineer Cebir PDF'i ↔ herhangi bir EE kitabı",
      description:
        "PDF tamamen taranmış halde, mail ile paylaşırım. Karşılığında EE temel kitaplarından birini arıyorum.",
      ownerId: berkant.id,
      offerId: resB.id,
      requestId: resC.id,
      status: PostStatus.ACTIVE,
    },
  });

  await prisma.post.create({
    data: {
      title: "Signals & Systems ↔ Calculus",
      description: "EE 2. sınıfım, Stewart Calculus arıyorum.",
      ownerId: ugur.id,
      offerId: resC.id,
      requestId: resA.id,
    },
  });

  console.log("✓ Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
