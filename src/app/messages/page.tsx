import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { exchangeStatusLabel, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = await requireUser();

  const exchanges = await prisma.exchange.findMany({
    where: {
      OR: [{ requesterId: me.id }, { post: { ownerId: me.id } }],
      status: { in: ["ACCEPTED", "COMPLETED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          owner: { select: { id: true, username: true, avatarName: true } },
        },
      },
      requester: { select: { id: true, username: true, avatarName: true } },
      messages: {
        orderBy: { messageNo: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="page-container py-8 md:py-10 max-w-4xl">
      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Mesajlar
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-6">
        Onaylanan takaslar için açık sohbetler.
      </p>

      {exchanges.length === 0 ? (
        <EmptyState
          icon={<Icon.MessageCircle />}
          title="Henüz açık sohbet yok"
          description="Bir takas teklifi kabul edildiğinde mesajlaşma açılır."
          action={
            <Link href="/exchanges">
              <Button variant="outline">Takaslarıma git</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white border border-[var(--color-mist)] rounded-[20px] overflow-hidden divide-y divide-[var(--color-mist)]">
          {exchanges.map((ex: any) => {
            const other =
              ex.post.ownerId === me.id ? ex.requester : ex.post.owner;
            const last = ex.messages[0];
            return (
              <Link
                key={ex.id}
                href={`/exchanges/${ex.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-fog)] transition"
              >
                <Avatar name={other.avatarName ?? other.username} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[14px] truncate">
                      {other.avatarName ?? other.username}
                    </p>
                    <Badge tone="soft">
                      {exchangeStatusLabel(ex.status)}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[var(--color-slate)] truncate">
                    {ex.post.title}
                  </p>
                  {last ? (
                    <p className="text-[13px] text-[var(--color-carbon)] truncate mt-1">
                      {last.senderId === me.id ? "Sen: " : ""}
                      {last.content}
                    </p>
                  ) : (
                    <p className="text-[12px] text-[var(--color-slate)] italic mt-1">
                      Henüz mesaj yok
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-[var(--color-slate)] shrink-0">
                  {timeAgo(ex.updatedAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
