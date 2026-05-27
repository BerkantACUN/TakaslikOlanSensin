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

  const [convos, exchanges] = await Promise.all([
    prisma.conversation.findMany({
      where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        userA: { select: { id: true, username: true, avatarName: true } },
        userB: { select: { id: true, username: true, avatarName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.exchange.findMany({
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
        messages: { orderBy: { messageNo: "desc" }, take: 1 },
      },
    }),
  ]);

  const isEmpty = convos.length === 0 && exchanges.length === 0;

  return (
    <div className="page-container py-8 md:py-10 max-w-3xl">
      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Mesajlar
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-6">
        Direkt mesajlar ve onaylanan takasların sohbetleri.
      </p>

      {isEmpty ? (
        <EmptyState
          icon={<Icon.MessageCircle />}
          title="Henüz sohbet yok"
          description="Bir kullanıcının profilinden 'Mesaj at' diyerek veya bir ilana takas teklifi göndererek konuşma başlatabilirsin."
          action={
            <Link href="/posts">
              <Button variant="outline">İlanlara göz at</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {convos.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--color-slate)] mb-3">
                Direkt mesajlar
              </h2>
              <div className="bg-white border border-[var(--color-mist)] rounded-[20px] overflow-hidden divide-y divide-[var(--color-mist)]">
                {convos.map((c) => {
                  const other = c.userAId === me.id ? c.userB : c.userA;
                  const last = c.messages[0];
                  return (
                    <Link
                      key={c.id}
                      href={`/messages/${c.id}`}
                      data-edu="open-conversation"
                      className="flex items-center gap-4 p-4 hover:bg-[var(--color-fog)] transition"
                    >
                      <Avatar
                        name={other.avatarName ?? other.username}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] truncate">
                          {other.avatarName ?? other.username}
                        </p>
                        {last ? (
                          <p className="text-[13px] text-[var(--color-slate)] truncate mt-0.5">
                            {last.senderId === me.id ? "Sen: " : ""}
                            {last.content}
                          </p>
                        ) : (
                          <p className="text-[12px] italic text-[var(--color-slate)] mt-0.5">
                            Henüz mesaj yok
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--color-slate)] shrink-0">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {exchanges.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--color-slate)] mb-3">
                Takas sohbetleri
              </h2>
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
                      <Avatar
                        name={other.avatarName ?? other.username}
                        size={48}
                      />
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
                        ) : null}
                      </div>
                      <span className="text-[11px] text-[var(--color-slate)] shrink-0">
                        {timeAgo(ex.updatedAt)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
