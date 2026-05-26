"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  resourceTypeLabel,
  postStatusLabel,
  timeAgo,
} from "@/lib/utils";

export type PostCardData = {
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
};

export function PostCard({ post }: { post: PostCardData }) {
  const [fav, setFav] = useState(!!post.favoritedByMe);
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
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
      setFav((f) => !f);
    } catch {
      push({ title: "İşlem başarısız", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const ownerLabel = post.owner.department?.name ?? "Bölüm belirtilmemiş";
  const isActive = post.status === "ACTIVE";

  return (
    <Link
      href={`/posts/${post.id}`}
      className="group block bg-white rounded-[20px] border border-[var(--color-mist)] overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      {/* Görsel başlık alanı — abstract gradient şerit */}
      <div className="relative h-36 bg-gradient-to-br from-[var(--color-brand-100)] via-[var(--color-brand-50)] to-white">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_30%,rgba(47,111,255,0.18),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(245,158,11,0.12),transparent_45%)]" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone="brand">{resourceTypeLabel(post.offer.type)}</Badge>
          {!isActive && (
            <Badge tone="warning">{postStatusLabel(post.status)}</Badge>
          )}
        </div>
        <button
          onClick={toggleFav}
          disabled={busy || post.isMine}
          aria-label="Favorile"
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/95 hover:bg-white shadow-[var(--shadow-button)] disabled:opacity-60"
        >
          {fav ? (
            <Icon.HeartFilled className="text-[var(--color-accent-coral)]" />
          ) : (
            <Icon.Heart className="text-[var(--color-carbon)]" />
          )}
        </button>

        {/* Takas oku */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-white/80 backdrop-blur rounded-[12px] px-3 py-2 text-[12px] font-semibold border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <span className="truncate">{post.offer.title}</span>
          <Icon.ArrowRight size={14} className="shrink-0 text-[var(--color-brand-600)]" />
          <span className="truncate text-[var(--color-slate)]">
            {post.request.title}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[15px] text-[var(--color-carbon)] line-clamp-1 group-hover:text-[var(--color-brand-600)] transition">
          {post.title}
        </h3>
        {post.description && (
          <p className="mt-1 text-[13px] text-[var(--color-slate)] line-clamp-2 leading-snug">
            {post.description}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--color-mist)] flex items-center gap-2">
          <Avatar name={post.owner.avatarName ?? post.owner.username} size={28} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate">
              {post.owner.avatarName ?? post.owner.username}
            </p>
            <p className="text-[11px] text-[var(--color-slate)] truncate">
              {ownerLabel}
            </p>
          </div>
          <span className="text-[11px] text-[var(--color-slate)] shrink-0">
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
