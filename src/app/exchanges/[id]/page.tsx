import Link from "next/link";
import { notFound } from "next/navigation";
import { exchanges } from "@/lib/repo";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { exchangeStatusLabel, timeAgo, formatDate } from "@/lib/utils";
import { ExchangeChat } from "./ExchangeChat";
import { ExchangeActions } from "./ExchangeActions";

export const dynamic = "force-dynamic";

export default async function ExchangeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;

  const exchange = await exchanges.findById(id);
  if (!exchange) return notFound();

  const isOwner = exchange.post.ownerId === me.id;
  const isRequester = exchange.requesterId === me.id;
  if (!isOwner && !isRequester) return notFound();

  const myReviewed = await exchanges.myReviewExists(id, me.id);
  const other = isOwner ? exchange.requester : exchange.post.owner;

  return (
    <div className="page-container py-8 md:py-10 max-w-5xl">
      <Link
        href="/exchanges"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-4"
      >
        <Icon.ArrowLeft size={14} /> Takaslarım
      </Link>

      <div className="bg-white border border-[var(--color-mist)] rounded-[20px] p-6 mb-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={other.avatarName ?? other.username} size={56} />
            <div className="min-w-0">
              <p className="font-semibold text-[16px] truncate">
                {other.avatarName ?? other.username}
              </p>
              <p className="text-[12px] text-[var(--color-slate)] truncate">
                @{other.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">
              {isOwner ? "Sana gelen teklif" : "Senin teklifin"}
            </Badge>
            <Badge tone="soft">{exchangeStatusLabel(exchange.status)}</Badge>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[var(--color-mist)] grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-slate)] font-semibold mb-1">
              İlan
            </p>
            <Link
              href={`/posts/${exchange.post.id}`}
              className="font-semibold hover:underline"
            >
              {exchange.post.title}
            </Link>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-slate)] font-semibold mb-1">
              Takas özeti
            </p>
            <p className="text-[14px]">
              <span className="font-semibold">{exchange.post.offer.title}</span>{" "}
              <Icon.ArrowRight
                size={14}
                className="inline mx-1 align-middle text-[var(--color-brand-600)]"
              />{" "}
              <span className="text-[var(--color-slate)]">
                {exchange.post.request.title}
              </span>
            </p>
          </div>
        </div>

        <p className="text-[12px] text-[var(--color-slate)] mt-4">
          {formatDate(exchange.createdAt)} tarihinde oluşturuldu ·{" "}
          {timeAgo(exchange.updatedAt)} güncellendi
        </p>

        <div className="mt-5 pt-5 border-t border-[var(--color-mist)]">
          <ExchangeActions
            exchangeId={exchange.id}
            status={exchange.status}
            isOwner={isOwner}
            isRequester={isRequester}
            myReviewed={myReviewed}
          />
        </div>
      </div>

      <ExchangeChat
        exchangeId={exchange.id}
        me={{
          id: me.id,
          username: me.username,
          avatarName: me.avatarName ?? null,
        }}
        other={other}
        initial={exchange.messages.map((m) => ({
          messageNo: m.messageNo,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt as any,
        }))}
        canChat={["ACCEPTED", "COMPLETED"].includes(exchange.status)}
      />
    </div>
  );
}
