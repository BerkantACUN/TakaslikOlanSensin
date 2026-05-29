import Link from "next/link";
import { notFound } from "next/navigation";
import { exchanges, posts, users } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import {
  resourceTypeLabel,
  postStatusLabel,
  formatDate,
} from "@/lib/utils";
import { PostActions } from "./PostActions";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();

  const post = await posts.findById(id, me ? { id: me.id } : null);
  if (!post) return notFound();

  const [ownerDetailed, myExchange] = await Promise.all([
    users.findDetailed(post.ownerId),
    me ? exchanges.findForRequester(id, me.id) : null,
  ]);
  const rating = ownerDetailed
    ? await users.averageRating(ownerDetailed.id)
    : { avg: null as number | null, count: 0 };

  const isMine = me?.id === post.ownerId;
  const favorited = !!post.favoritedByMe;
  const avgRating = rating.avg != null ? rating.avg.toFixed(1) : null;

  return (
    <div className="page-container py-8 md:py-10">
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-6"
      >
        <Icon.ArrowLeft size={14} /> Tüm ilanlar
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-[var(--color-mist)] rounded-[24px] overflow-hidden">
            <div className="relative h-56 md:h-72 bg-gradient-to-br from-[var(--color-brand-100)] via-[var(--color-brand-50)] to-white">
              <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_30%_30%,rgba(47,111,255,0.2),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(245,158,11,0.15),transparent_50%)]" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <Badge tone="brand">
                  Veriyor: {resourceTypeLabel(post.offer.type)}
                </Badge>
                <Badge tone="soft">
                  İstiyor: {resourceTypeLabel(post.request.type)}
                </Badge>
                {post.status !== "ACTIVE" && (
                  <Badge tone="warning">{postStatusLabel(post.status)}</Badge>
                )}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
              <p className="mt-2 text-[13px] text-[var(--color-slate)]">
                {formatDate(post.createdAt)} tarihinde paylaşıldı
              </p>

              {post.description && (
                <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-carbon)] whitespace-pre-wrap">
                  {post.description}
                </p>
              )}

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <ResourceBlock
                  label="Bu kişi sunuyor"
                  title={post.offer.title}
                  type={post.offer.type}
                  desc={post.offer.description}
                  tone="brand"
                />
                <ResourceBlock
                  label="Karşılığında istiyor"
                  title={post.request.title}
                  type={post.request.type}
                  desc={post.request.description}
                  tone="amber"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-[var(--color-mist)] rounded-[20px] p-5 sticky top-20">
            <div className="flex items-center gap-3">
              <Avatar
                name={ownerDetailed?.avatarName ?? ownerDetailed?.username}
                size={56}
              />
              <div className="min-w-0">
                <p className="font-semibold text-[16px] truncate">
                  {ownerDetailed?.avatarName ?? ownerDetailed?.username}
                </p>
                <p className="text-[12px] text-[var(--color-slate)] truncate">
                  @{ownerDetailed?.username}
                </p>
              </div>
            </div>

            {ownerDetailed?.department && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)] text-[13px]">
                <p className="text-[var(--color-slate)] mb-1">Bölüm</p>
                <p className="font-semibold">{ownerDetailed.department.name}</p>
                <p className="text-[12px] text-[var(--color-slate)]">
                  {ownerDetailed.department.faculty}
                </p>
              </div>
            )}

            {avgRating && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)] flex items-center gap-2">
                <Icon.StarFilled
                  className="text-[var(--color-accent-amber)]"
                  size={16}
                />
                <span className="font-semibold text-[14px]">{avgRating}</span>
                <span className="text-[12px] text-[var(--color-slate)]">
                  ({rating.count} değerlendirme)
                </span>
              </div>
            )}

            {ownerDetailed && ownerDetailed.skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)]">
                <p className="text-[12px] text-[var(--color-slate)] mb-2">
                  Yetkinlikler
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ownerDetailed.skills.map((s) => (
                    <Badge key={s} tone="soft">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-[var(--color-mist)]">
              <PostActions
                postId={post.id}
                ownerId={post.ownerId}
                authed={!!me}
                isMine={isMine}
                favorited={favorited}
                myExchange={myExchange}
                postActive={post.status === "ACTIVE"}
              />
            </div>

            {ownerDetailed && (
              <Link
                href={`/profile/${ownerDetailed.id}`}
                className="block mt-3 text-center text-[12px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)]"
              >
                Profili görüntüle
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResourceBlock({
  label,
  title,
  type,
  desc,
  tone,
}: {
  label: string;
  title: string;
  type: string;
  desc: string | null;
  tone: "brand" | "amber";
}) {
  const wrap =
    tone === "brand"
      ? "bg-[var(--color-brand-50)] border-[var(--color-brand-100)]"
      : "bg-amber-50 border-amber-100";
  const iconBg =
    tone === "brand"
      ? "bg-[var(--color-brand-500)] text-white"
      : "bg-[var(--color-accent-amber)] text-white";
  return (
    <div className={`rounded-[16px] border p-4 ${wrap}`}>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-slate)] mb-2">
        {label}
      </p>
      <div className="flex items-start gap-3">
        <span className={`w-9 h-9 rounded-[10px] grid place-items-center shrink-0 ${iconBg}`}>
          <Icon.Book size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[15px]">{title}</p>
          <p className="text-[12px] text-[var(--color-slate)]">
            {resourceTypeLabel(type)}
          </p>
          {desc && (
            <p className="mt-2 text-[13px] text-[var(--color-carbon)] leading-snug">
              {desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
