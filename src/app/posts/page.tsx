import Link from "next/link";
import { departments, posts } from "@/lib/repo";
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

  const [feed, depts] = await Promise.all([
    posts.list(me ? { id: me.id } : null, {
      q: sp.q,
      type: sp.type,
      departmentId: sp.department,
      sort: (sp.sort as "new" | "popular") ?? "new",
      limit: 60,
    }),
    departments.list(),
  ]);

  const cards: FeedPostData[] = feed.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt as any,
    owner: {
      id: p.owner.id,
      username: p.owner.username,
      avatarName: p.owner.avatarName,
      department: p.owner.department ?? null,
    },
    offer: { title: p.offer.title, type: p.offer.type },
    request: { title: p.request.title, type: p.request.type },
    favoritedByMe: p.favoritedByMe,
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
            {cards.length} aktif takas
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
        {depts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pt-2">
            <FilterPill
              href={buildHref({ department: undefined })}
              active={!sp.department}
            >
              Tüm bölümler
            </FilterPill>
            {depts.slice(0, 10).map((d) => (
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
        <div className="space-y-5 mt-2" data-edu="feed">
          {cards.map((p) => (
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
