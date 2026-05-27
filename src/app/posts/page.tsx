import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FeedPost, type FeedPostData } from "@/components/posts/FeedPost";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const TYPES = ["BOOK", "PDF", "NOTES", "SLIDES", "EXAM", "PROJECT", "OTHER"] as const;
const TYPE_LABELS: Record<string, string> = {
  BOOK: "Kitap",
  PDF: "PDF",
  NOTES: "Not",
  SLIDES: "Sunum",
  EXAM: "Sınav",
  PROJECT: "Proje",
  OTHER: "Diğer",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    department?: string;
    type?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const me = await getCurrentUser();

  const where: any = { status: "ACTIVE" };

  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { description: { contains: sp.q } },
      { offer: { title: { contains: sp.q } } },
      { request: { title: { contains: sp.q } } },
    ];
  }

  if (sp.department) {
    where.owner = { departmentId: sp.department };
  }

  if (sp.type && TYPES.includes(sp.type as any)) {
    where.offer = { type: sp.type };
  }

  const orderBy =
    sp.sort === "popular"
      ? { exchanges: { _count: "desc" as const } }
      : { createdAt: "desc" as const };

  const [posts, departments] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      take: 60,
      include: {
        owner: { include: { department: { select: { name: true } } } },
        offer: { select: { title: true, type: true } },
        request: { select: { title: true, type: true } },
        favorites: me?.id ? { where: { userId: me.id } } : false,
      },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
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
    isMine: me?.id === p.ownerId,
    authed: !!me,
  }));

  const buildHref = (override: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...override };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return `/posts${s ? `?${s}` : ""}`;
  };

  return (
    <div className="page-container py-6 md:py-8 max-w-[640px]">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight">
            İlanlar
          </h1>
          <p className="text-[13px] text-[var(--color-slate)] mt-1">
            {feed.length} aktif takas
            {sp.q && (
              <>
                {" · "}
                <span className="font-semibold text-[var(--color-carbon)]">
                  "{sp.q}"
                </span>
              </>
            )}
          </p>
        </div>
        {me && (
          <Link href="/posts/new">
            <Button>
              <Icon.Plus size={16} />
              <span className="hidden sm:inline">Yeni ilan</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filtre çubuğu (sticky) */}
      <div className="sticky top-16 z-10 -mx-2 px-2 pb-3 bg-[var(--surface-canvas)]/95 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <FilterPill href={buildHref({ type: undefined })} active={!sp.type}>
            Hepsi
          </FilterPill>
          {TYPES.map((t) => (
            <FilterPill
              key={t}
              href={buildHref({ type: t })}
              active={sp.type === t}
            >
              {TYPE_LABELS[t]}
            </FilterPill>
          ))}
        </div>
        {departments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pt-2">
            <FilterPill
              href={buildHref({ department: undefined })}
              active={!sp.department}
            >
              Tüm bölümler
            </FilterPill>
            {departments.slice(0, 10).map((d) => (
              <FilterPill
                key={d.id}
                href={buildHref({ department: d.id })}
                active={sp.department === d.id}
              >
                {d.name.split(" ").slice(0, 2).join(" ")}
              </FilterPill>
            ))}
          </div>
        )}
      </div>

      {feed.length === 0 ? (
        <EmptyState
          icon={<Icon.Search />}
          title="Sonuç yok"
          description="Filtre koşullarını değiştirmeyi veya başka anahtar kelime denemeyi dene."
          action={
            <Link href="/posts">
              <Button variant="outline">Filtreleri sıfırla</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5 mt-2" data-edu="feed">
          {feed.map((p) => (
            <FeedPost key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center h-9 px-3.5 rounded-full text-[12.5px] font-semibold shrink-0 transition " +
        (active
          ? "bg-[var(--color-carbon)] text-white"
          : "bg-white text-[var(--color-carbon)] border border-[var(--color-pebble)] hover:border-[var(--color-carbon)]")
      }
    >
      {children}
    </Link>
  );
}
