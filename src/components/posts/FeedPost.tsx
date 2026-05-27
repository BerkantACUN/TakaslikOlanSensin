"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useEducation } from "@/components/educational/EducationalProvider";
import {
  postStatusLabel,
  resourceTypeLabel,
  timeAgo,
} from "@/lib/utils";

export type FeedPostData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string | Date;
  owner: {
    id: string;
    username: string;
    avatarName: string | null;
    department?: { name: string } | null;
  };
  offer: { title: string; type: string };
  request: { title: string; type: string };
  favoritedByMe?: boolean;
  isMine?: boolean;
  authed?: boolean;
  /** İstatistik */
  favoriteCount?: number;
  exchangeCount?: number;
};

export function FeedPost({ post }: { post: FeedPostData }) {
  const router = useRouter();
  const { push } = useToast();
  const { trigger } = useEducation();
  const [fav, setFav] = useState(!!post.favoritedByMe);
  const [busy, setBusy] = useState(false);

  async function toggleFav() {
    if (!post.authed) {
      push({ title: "Önce giriş yapmalısın", tone: "error" });
      return;
    }
    if (post.isMine) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/favorites/${post.id}`, {
        method: fav ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      const wasFav = fav;
      setFav((f) => !f);
      trigger(wasFav ? "unfavorite" : "favorite", { postId: post.id });
    } catch {
      push({ title: "İşlem başarısız", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      data-edu="post-card"
      className="bg-white rounded-[24px] border border-[var(--color-mist)] overflow-hidden animate-fade-up"
    >
      {/* Üst — yazar */}
      <div className="flex items-center gap-3 p-4">
        <Link
          href={`/profile/${post.owner.id}`}
          className="flex items-center gap-3 min-w-0 flex-1 group"
        >
          <Avatar name={post.owner.avatarName ?? post.owner.username} size={44} />
          <div className="min-w-0">
            <p className="font-semibold text-[14px] truncate group-hover:underline">
              {post.owner.avatarName ?? post.owner.username}
            </p>
            <p className="text-[12px] text-[var(--color-slate)] truncate">
              {post.owner.department?.name ?? "Bölüm belirtilmemiş"} ·{" "}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        {post.status !== "ACTIVE" && (
          <Badge tone="warning">{postStatusLabel(post.status)}</Badge>
        )}
      </div>

      {/* Görsel başlık + takas oku */}
      <Link
        href={`/posts/${post.id}`}
        className="block relative h-44 sm:h-56 bg-gradient-to-br from-[var(--color-brand-100)] via-[var(--color-brand-50)] to-white"
      >
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_25%_30%,rgba(47,111,255,0.22),transparent_45%),radial-gradient(circle_at_75%_70%,rgba(245,158,11,0.15),transparent_45%)]" />

        <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5">
          <ResourceTile
            label="Sunduğu"
            title={post.offer.title}
            type={post.offer.type}
            tone="brand"
          />
          <div className="w-10 h-10 rounded-full bg-white shadow-[var(--shadow-card)] grid place-items-center text-[var(--color-brand-600)]">
            <Icon.ArrowRight />
          </div>
          <ResourceTile
            label="İstediği"
            title={post.request.title}
            type={post.request.type}
            tone="amber"
          />
        </div>
      </Link>

      {/* Başlık + açıklama */}
      <Link href={`/posts/${post.id}`} className="block px-5 pt-4">
        <h3 className="font-bold text-[18px] tracking-tight text-[var(--color-carbon)] hover:text-[var(--color-brand-600)] transition">
          {post.title}
        </h3>
        {post.description && (
          <p className="mt-1 text-[14px] text-[var(--color-slate)] line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}
      </Link>

      {/* Aksiyon barı */}
      <div className="px-3 py-3 flex items-center gap-1 border-t border-[var(--color-mist)] mt-4">
        <ActionButton
          onClick={toggleFav}
          disabled={busy || post.isMine}
          active={fav}
          icon={
            fav ? (
              <Icon.HeartFilled className="text-[var(--color-accent-coral)]" />
            ) : (
              <Icon.Heart />
            )
          }
          label={fav ? "Favorin" : "Favorile"}
        />
        <ActionButton
          onClick={() => router.push(`/posts/${post.id}`)}
          icon={<Icon.MessageCircle />}
          label="Takas teklif et"
        />
        <ActionButton
          onClick={() => router.push(`/profile/${post.owner.id}`)}
          icon={<Icon.User />}
          label="Profili gör"
        />
      </div>
    </article>
  );
}

function ResourceTile({
  label,
  title,
  type,
  tone,
}: {
  label: string;
  title: string;
  type: string;
  tone: "brand" | "amber";
}) {
  const bg =
    tone === "brand"
      ? "bg-white/90 border-[var(--color-brand-200)]"
      : "bg-white/90 border-amber-200";
  const dot =
    tone === "brand" ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-accent-amber)]";
  return (
    <div
      className={`relative rounded-[16px] border ${bg} backdrop-blur p-3 min-w-0 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.08)]`}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-slate)] flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="mt-1 font-bold text-[13px] line-clamp-1 text-[var(--color-carbon)]">
        {title}
      </p>
      <p className="text-[11px] text-[var(--color-slate)]">
        {resourceTypeLabel(type)}
      </p>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  disabled,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-[12px] text-[13px] font-semibold transition disabled:opacity-50 " +
        (active
          ? "text-[var(--color-accent-coral)] bg-red-50 hover:bg-red-100"
          : "text-[var(--color-carbon)] hover:bg-[var(--color-fog)]")
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
