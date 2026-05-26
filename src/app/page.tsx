import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

async function getData(userId: string | null) {
  const [latest, featured, departments, stats] = await Promise.all([
    prisma.post.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        owner: { include: { department: { select: { name: true } } } },
        offer: { select: { title: true, type: true } },
        request: { select: { title: true, type: true } },
        favorites: userId ? { where: { userId } } : false,
      },
    }),
    prisma.post.findMany({
      where: { status: "ACTIVE" },
      orderBy: { exchanges: { _count: "desc" } },
      take: 4,
      include: {
        owner: { include: { department: { select: { name: true } } } },
        offer: { select: { title: true, type: true } },
        request: { select: { title: true, type: true } },
        favorites: userId ? { where: { userId } } : false,
      },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      take: 8,
    }),
    Promise.all([
      prisma.post.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.exchange.count({ where: { status: "COMPLETED" } }),
    ]),
  ]);

  const toCard = (p: any): PostCardData => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt,
    owner: {
      id: p.owner.id,
      username: p.owner.username,
      avatarName: p.owner.avatarName,
      department: p.owner.department,
    },
    offer: p.offer,
    request: p.request,
    favoritedByMe: Array.isArray(p.favorites) && p.favorites.length > 0,
    isMine: userId === p.ownerId,
    authed: !!userId,
  });

  return {
    latest: latest.map(toCard),
    featured: featured.map(toCard),
    departments,
    stats: { posts: stats[0], users: stats[1], completed: stats[2] },
  };
}

export default async function HomePage() {
  const me = await getCurrentUser();
  const data = await getData(me?.id ?? null);

  return (
    <div className="page-container">
      {/* HERO */}
      <section className="relative mt-8 md:mt-12 mb-12 overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--color-brand-600)] via-[var(--color-brand-500)] to-[#7aa8ff] text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.3),transparent_45%)]" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-[var(--color-accent-amber)]/30 blur-3xl" />
        <div className="absolute -left-16 top-10 w-56 h-56 rounded-full bg-white/20 blur-3xl" />

        <div className="relative px-8 py-14 md:py-20 md:px-14 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[12px] font-semibold backdrop-blur">
            <Icon.Sparkle size={14} />
            Üniversite öğrencilerine özel
          </span>
          <h1 className="mt-5 text-[40px] md:text-[56px] font-bold leading-[1.05] tracking-tight">
            Kitabını değil, <br /> bilgini paylaş.
          </h1>
          <p className="mt-5 text-[16px] md:text-[17px] text-white/90 max-w-xl leading-relaxed">
            CampusSwap; kitap, ders notu, çıkmış sınav ve proje kaynaklarını
            kampüs içinde güvenle takas etmeni sağlar. Bir dersten kalan kaynağı
            başkasına; o da ihtiyacın olanı sana.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={me ? "/posts/new" : "/register"}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[14px] bg-white text-[var(--color-brand-700)] font-semibold hover:bg-white/90 transition"
            >
              {me ? "Hemen ilan ver" : "Ücretsiz katıl"}
              <Icon.ArrowRight size={18} />
            </Link>
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-[14px] bg-white/10 text-white font-semibold hover:bg-white/20 transition border border-white/25 backdrop-blur"
            >
              İlanları keşfet
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat label="Aktif ilan" value={data.stats.posts} />
            <Stat label="Öğrenci" value={data.stats.users} />
            <Stat label="Tamamlanan" value={data.stats.completed} />
          </div>
        </div>
      </section>

      {/* Departmanlar */}
      <section className="mb-12">
        <SectionHeader title="Bölümüne göre keşfet" href="/posts" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.departments.map((d) => (
            <Link
              key={d.id}
              href={`/posts?department=${d.id}`}
              className="group bg-white border border-[var(--color-mist)] rounded-[16px] p-4 hover:border-[var(--color-carbon)] hover:-translate-y-0.5 transition"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[var(--color-brand-50)] text-[var(--color-brand-600)] grid place-items-center mb-3 group-hover:bg-[var(--color-brand-100)] transition">
                <Icon.Book />
              </div>
              <p className="font-semibold text-[13px] line-clamp-1">{d.name}</p>
              <p className="text-[11px] text-[var(--color-slate)] line-clamp-1">
                {d.faculty}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Öne çıkanlar */}
      <section className="mb-12">
        <SectionHeader title="En çok ilgi gören ilanlar" href="/posts" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.featured.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      {/* En yeniler */}
      <section className="mb-16">
        <SectionHeader title="Yeni ilanlar" href="/posts?sort=new" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.latest.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mb-16">
        <div className="rounded-[28px] bg-white border border-[var(--color-mist)] p-8 md:p-12">
          <h2 className="text-[28px] font-bold tracking-tight mb-2">
            Nasıl çalışır?
          </h2>
          <p className="text-[var(--color-slate)] mb-8 max-w-xl">
            Üç adımda kaynağını değiştir, hem cüzdanını hem dolabını rahatlat.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Step
              n={1}
              title="İlanını oluştur"
              desc="Elindeki kaynağı ve karşılığında aradığını anlat. Detaylı açıklama daha iyi eşleşmeler getirir."
            />
            <Step
              n={2}
              title="Takas teklifini gönder"
              desc="Beğendiğin ilana takas teklifi yolla. Karşı taraf onayladığında özel mesajlaşma açılır."
            />
            <Step
              n={3}
              title="Buluş ve değerlendir"
              desc="Takası tamamladıktan sonra birbirinizi puanlayın. Güvenli topluluk hep birlikte büyür."
            />
          </div>
          {!me && (
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">
                  Hemen başla
                  <Icon.ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <h2 className="text-[22px] md:text-[26px] font-bold tracking-tight">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[13px] font-semibold text-[var(--color-carbon)] hover:underline flex items-center gap-1"
        >
          Tümünü gör <Icon.ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[28px] font-bold leading-none">{value}</p>
      <p className="text-[12px] text-white/80 mt-1">{label}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-[20px] bg-[var(--color-fog)] border border-[var(--color-mist)]">
      <div className="w-9 h-9 rounded-full bg-[var(--color-brand-500)] text-white grid place-items-center font-bold mb-4">
        {n}
      </div>
      <h3 className="font-semibold text-[16px] mb-2">{title}</h3>
      <p className="text-[13px] text-[var(--color-slate)] leading-relaxed">{desc}</p>
    </div>
  );
}
