import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { PostCard, type PostCardData } from "@/components/posts/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      department: true,
      skills: true,
      posts: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          owner: { include: { department: { select: { name: true } } } },
          offer: { select: { title: true, type: true } },
          request: { select: { title: true, type: true } },
          favorites: me?.id ? { where: { userId: me.id } } : undefined,
        },
      },
      reviewsGot: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          reviewer: { select: { username: true, avatarName: true } },
        },
      },
    },
  });

  if (!user) return notFound();

  const ratings = user.reviewsGot.map((r) => r.rating);
  const avg =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  const cards: PostCardData[] = user.posts.map((p: any) => ({
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

  return (
    <div className="page-container py-8 md:py-10">
      {/* Profil header */}
      <div className="bg-white border border-[var(--color-mist)] rounded-[24px] p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar name={user.avatarName ?? user.username} size={96} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight">
              {user.avatarName ?? user.username}
            </h1>
            <p className="text-[13px] text-[var(--color-slate)]">
              @{user.username} · Üyelik: {formatDate(user.createdAt)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {user.department && (
                <Badge tone="brand">
                  {user.department.name} · {user.department.faculty}
                </Badge>
              )}
              {avg && (
                <Badge tone="warning">
                  <Icon.StarFilled
                    size={11}
                    className="text-[var(--color-accent-amber)]"
                  />
                  {avg} · {ratings.length} değerlendirme
                </Badge>
              )}
            </div>

            {user.bio && (
              <p className="mt-4 text-[14px] leading-relaxed">{user.bio}</p>
            )}

            {user.skills.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-slate)] font-semibold mb-2">
                  Yetkinlikler
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <Badge key={s.skill} tone="soft">
                      {s.skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aktif ilanları */}
      <section className="mb-12">
        <h2 className="text-[22px] font-bold tracking-tight mb-4">
          Aktif ilanları
        </h2>
        {cards.length === 0 ? (
          <EmptyState
            icon={<Icon.Book />}
            title="Aktif ilanı yok"
            description="Bu kullanıcı şu an aktif bir takas ilanı paylaşmamış."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cards.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      {/* Değerlendirmeler */}
      <section>
        <h2 className="text-[22px] font-bold tracking-tight mb-4">
          Değerlendirmeler
        </h2>
        {user.reviewsGot.length === 0 ? (
          <p className="text-[14px] text-[var(--color-slate)]">
            Henüz değerlendirme yok.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {user.reviewsGot.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[var(--color-mist)] rounded-[16px] p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar
                    name={r.reviewer.avatarName ?? r.reviewer.username}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate">
                      {r.reviewer.avatarName ?? r.reviewer.username}
                    </p>
                    <p className="text-[11px] text-[var(--color-slate)]">
                      {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon.StarFilled
                        key={i}
                        size={13}
                        className={
                          i < r.rating
                            ? "text-[var(--color-accent-amber)]"
                            : "text-[var(--color-pebble)]"
                        }
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-[13px] leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
