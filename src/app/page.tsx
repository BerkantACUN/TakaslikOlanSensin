import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FeedPost, type FeedPostData } from "@/components/posts/FeedPost";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

async function getData(userId: string | null) {
  const [posts, departments, stats] = await Promise.all([
    prisma.post.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        owner: { include: { department: { select: { name: true } } } },
        offer: { select: { title: true, type: true } },
        request: { select: { title: true, type: true } },
        favorites: userId ? { where: { userId } } : false,
      },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      take: 6,
    }),
    Promise.all([
      prisma.post.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.exchange.count({ where: { status: "COMPLETED" } }),
    ]),
  ]);

  const feed: FeedPostData[] = posts.map((p: any) => ({
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
  }));

  return {
    feed,
    departments,
    stats: { posts: stats[0], users: stats[1], completed: stats[2] },
  };
}

export default async function HomePage() {
  const me = await getCurrentUser();
  const data = await getData(me?.id ?? null);

  return (
    <div className="page-container py-6 md:py-8">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Sol — Feed */}
        <div className="max-w-[640px] mx-auto w-full lg:mx-0">
          {/* Hero compact */}
          {!me && (
            <section className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-br from-[var(--color-brand-600)] via-[var(--color-brand-500)] to-[#7aa8ff] text-white p-6 sm:p-8">
              <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.25),transparent_45%)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur">
                  <Icon.Sparkle size={12} /> Üniversite öğrencileri için
                </span>
                <h1 className="mt-3 text-[28px] sm:text-[34px] font-bold leading-[1.1] tracking-tight">
                  Kitabını değil,
                  <br />
                  bilgini paylaş.
                </h1>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[12px] bg-white text-[var(--color-brand-700)] text-[13px] font-semibold hover:bg-white/90"
                  >
                    Ücretsiz katıl <Icon.ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center h-10 px-5 rounded-[12px] bg-white/15 text-white text-[13px] font-semibold border border-white/25 backdrop-blur hover:bg-white/25"
                  >
                    Giriş yap
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Stories benzeri department şeridi */}
          <div className="mb-4 -mx-2 px-2 overflow-x-auto scrollbar-thin">
            <div className="flex gap-2 pb-1">
              <Link
                href="/posts"
                className="shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <span className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] text-white grid place-items-center text-[18px] font-bold ring-2 ring-white shadow-[var(--shadow-card)]">
                  ★
                </span>
                <span className="text-[11px] font-semibold">Hepsi</span>
              </Link>
              {data.departments.map((d) => (
                <Link
                  key={d.id}
                  href={`/posts?department=${d.id}`}
                  className="shrink-0 flex flex-col items-center gap-1.5 group max-w-[80px]"
                >
                  <span className="w-14 h-14 rounded-full bg-white grid place-items-center text-[var(--color-brand-600)] ring-2 ring-[var(--color-mist)] group-hover:ring-[var(--color-brand-400)] transition shadow-sm">
                    <Icon.Book size={20} />
                  </span>
                  <span className="text-[11px] font-semibold text-center line-clamp-1 w-16">
                    {d.name.split(" ")[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Feed kartları */}
          <div className="space-y-5">
            {data.feed.map((p) => (
              <FeedPost key={p.id} post={p} />
            ))}
            {data.feed.length === 0 && (
              <p className="text-center text-[14px] text-[var(--color-slate)] py-12">
                Henüz aktif ilan yok.
              </p>
            )}
          </div>
        </div>

        {/* Sağ — Sticky sidebar (sadece desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white border border-[var(--color-mist)] rounded-[20px] p-5">
              <h3 className="font-bold text-[15px] mb-3">Topluluk</h3>
              <div className="space-y-3">
                <StatRow label="Aktif ilan" value={data.stats.posts} />
                <StatRow label="Öğrenci" value={data.stats.users} />
                <StatRow label="Tamamlanan takas" value={data.stats.completed} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--color-brand-50)] to-white border border-[var(--color-brand-100)] rounded-[20px] p-5">
              <div className="w-10 h-10 rounded-[10px] bg-[var(--color-brand-500)] text-white grid place-items-center mb-3">
                <Icon.Sparkle />
              </div>
              <p className="font-bold text-[15px] mb-1">SQL Öğretici Modu</p>
              <p className="text-[12px] text-[var(--color-slate)] leading-relaxed">
                Sol alttaki <span className="font-mono font-bold">SQL</span> rozetine bas
                veya herhangi bir karta <b>4 kez hızlıca</b> tıkla — o aksiyonun
                arkasında çalışan sorguyu adım adım göster.
              </p>
            </div>

            {me && (
              <Link
                href="/posts/new"
                className="block bg-[var(--color-carbon)] text-white rounded-[20px] p-5 hover:bg-black transition group"
              >
                <p className="font-bold text-[15px]">Yeni ilan ver</p>
                <p className="text-[12px] text-white/70 mt-1">
                  Elindeki kaynağı paylaş, karşılığında ihtiyacın olanı al.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold group-hover:translate-x-0.5 transition">
                  Başla <Icon.ArrowRight size={14} />
                </span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[13px] text-[var(--color-slate)]">{label}</span>
      <span className="text-[20px] font-bold tracking-tight">{value}</span>
    </div>
  );
}
