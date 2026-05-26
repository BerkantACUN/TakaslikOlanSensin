import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";
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
      { title: { contains: sp.q, mode: "insensitive" } },
      { description: { contains: sp.q, mode: "insensitive" } },
      { offer: { title: { contains: sp.q, mode: "insensitive" } } },
      { request: { title: { contains: sp.q, mode: "insensitive" } } },
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

  const cards: PostCardData[] = posts.map((p: any) => ({
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
    <div className="page-container py-8 md:py-10">
      {/* Başlık */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
            İlanlar
          </h1>
          <p className="text-[14px] text-[var(--color-slate)] mt-1">
            {cards.length} aktif takas ilanı
            {sp.q && (
              <>
                {" · "}
                <span className="font-semibold text-[var(--color-carbon)]">
                  "{sp.q}"
                </span>{" "}
                için sonuçlar
              </>
            )}
          </p>
        </div>
        {me && (
          <Link href="/posts/new">
            <Button>
              <Icon.Plus size={16} />
              Yeni ilan
            </Button>
          </Link>
        )}
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-[var(--color-mist)] rounded-[20px] p-4 mb-8">
        <div className="flex flex-wrap gap-2">
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
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--color-mist)]">
            <FilterPill
              href={buildHref({ department: undefined })}
              active={!sp.department}
              variant="dept"
            >
              Tüm bölümler
            </FilterPill>
            {departments.slice(0, 8).map((d) => (
              <FilterPill
                key={d.id}
                href={buildHref({ department: d.id })}
                active={sp.department === d.id}
                variant="dept"
              >
                {d.name}
              </FilterPill>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--color-mist)] items-center">
          <span className="text-[12px] font-semibold text-[var(--color-slate)] mr-1">
            Sırala:
          </span>
          <FilterPill
            href={buildHref({ sort: undefined })}
            active={!sp.sort || sp.sort === "new"}
            variant="sort"
          >
            En yeni
          </FilterPill>
          <FilterPill
            href={buildHref({ sort: "popular" })}
            active={sp.sort === "popular"}
            variant="sort"
          >
            En popüler
          </FilterPill>
        </div>
      </div>

      {/* Sonuçlar */}
      {cards.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((p) => (
            <PostCard key={p.id} post={p} />
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
  variant = "type",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  variant?: "type" | "dept" | "sort";
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center h-9 px-3 rounded-[10px] text-[13px] font-semibold border transition " +
        (active
          ? "bg-[var(--color-carbon)] text-white border-[var(--color-carbon)]"
          : "bg-white text-[var(--color-carbon)] border-[var(--color-pebble)] hover:border-[var(--color-carbon)]")
      }
    >
      {children}
    </Link>
  );
}
