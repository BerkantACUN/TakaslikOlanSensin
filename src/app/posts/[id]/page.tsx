import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      owner: {
        include: {
          department: true,
          skills: true,
          reviewsGot: { select: { rating: true } },
        },
      },
      offer: { include: { department: true } },
      request: { include: { department: true } },
      favorites: me?.id ? { where: { userId: me.id } } : undefined,
      exchanges: me?.id
        ? { where: { requesterId: me.id }, select: { id: true, status: true } }
        : undefined,
    },
  });

  if (!post) return notFound();

  const isMine = me?.id === post.ownerId;
  const favorited =
    Array.isArray(post.favorites) && post.favorites.length > 0;
  const myExchange =
    Array.isArray(post.exchanges) && post.exchanges.length > 0
      ? post.exchanges[0]
      : null;

  const ratings = post.owner.reviewsGot.map((r: any) => r.rating);
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="page-container py-8 md:py-10">
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-6"
      >
        <Icon.ArrowLeft size={14} />
        Tüm ilanlar
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sol — detay */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[var(--color-mist)] rounded-[24px] overflow-hidden">
            {/* Görsel başlık */}
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
                  dept={post.offer.department?.name}
                  tone="brand"
                />
                <ResourceBlock
                  label="Karşılığında istiyor"
                  title={post.request.title}
                  type={post.request.type}
                  desc={post.request.description}
                  dept={post.request.department?.name}
                  tone="amber"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sağ — owner card + actions */}
        <aside className="space-y-4">
          <div className="bg-white border border-[var(--color-mist)] rounded-[20px] p-5 sticky top-20">
            <div className="flex items-center gap-3">
              <Avatar
                name={post.owner.avatarName ?? post.owner.username}
                size={56}
              />
              <div className="min-w-0">
                <p className="font-semibold text-[16px] truncate">
                  {post.owner.avatarName ?? post.owner.username}
                </p>
                <p className="text-[12px] text-[var(--color-slate)] truncate">
                  @{post.owner.username}
                </p>
              </div>
            </div>

            {post.owner.department && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)] text-[13px]">
                <p className="text-[var(--color-slate)] mb-1">Bölüm</p>
                <p className="font-semibold">
                  {post.owner.department.name}
                </p>
                <p className="text-[12px] text-[var(--color-slate)]">
                  {post.owner.department.faculty}
                </p>
              </div>
            )}

            {avgRating && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)] flex items-center gap-2">
                <Icon.StarFilled className="text-[var(--color-accent-amber)]" size={16} />
                <span className="font-semibold text-[14px]">{avgRating}</span>
                <span className="text-[12px] text-[var(--color-slate)]">
                  ({ratings.length} değerlendirme)
                </span>
              </div>
            )}

            {post.owner.skills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-mist)]">
                <p className="text-[12px] text-[var(--color-slate)] mb-2">
                  Yetkinlikler
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {post.owner.skills.map((s: any) => (
                    <Badge key={s.skill} tone="soft">
                      {s.skill}
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

            <Link
              href={`/profile/${post.owner.id}`}
              className="block mt-3 text-center text-[12px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)]"
            >
              Profili görüntüle
            </Link>
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
  dept,
  tone,
}: {
  label: string;
  title: string;
  type: string;
  desc: string | null;
  dept?: string;
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
            {dept ? ` · ${dept}` : ""}
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
