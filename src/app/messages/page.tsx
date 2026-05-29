import Link from "next/link";
import { dm, exchanges } from "@/lib/repo";
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

  const [convoRows, incoming, outgoing] = await Promise.all([
    dm.listForUser(me.id),
    exchanges.incoming(me.id),
    exchanges.outgoing(me.id),
  ]);

  const convos = convoRows.map((c: any) => {
    const isA = c.USER_A_ID === me.id;
    return {
      id: c.ID,
      other: {
        username: isA ? c.B_USERNAME : c.A_USERNAME,
        avatarName: isA ? c.B_AVATAR : c.A_AVATAR,
      },
      lastMessageAt: c.LAST_MESSAGE_AT,
      lastContent: c.LAST_CONTENT as string | null,
      lastSender: c.LAST_SENDER as string | null,
    };
  });

  const exchangeChats = [...incoming, ...outgoing]
    .filter((e: any) => ["ACCEPTED", "COMPLETED"].includes(e.STATUS))
    .sort(
      (a: any, b: any) =>
        new Date(b.UPDATED_AT).getTime() - new Date(a.UPDATED_AT).getTime(),
    );

  const isEmpty = convos.length === 0 && exchangeChats.length === 0;

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
                {convos.map((c) => (
                  <Link
                    key={c.id}
                    href={`/messages/${c.id}`}
                    data-edu="open-conversation"
                    className="flex items-center gap-4 p-4 hover:bg-[var(--color-fog)] transition"
                  >
                    <Avatar
                      name={c.other.avatarName ?? c.other.username}
                      size={48}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] truncate">
                        {c.other.avatarName ?? c.other.username}
                      </p>
                      {c.lastContent ? (
                        <p className="text-[13px] text-[var(--color-slate)] truncate mt-0.5">
                          {c.lastSender === me.id ? "Sen: " : ""}
                          {c.lastContent}
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
                ))}
              </div>
            </section>
          )}

          {exchangeChats.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--color-slate)] mb-3">
                Takas sohbetleri
              </h2>
              <div className="bg-white border border-[var(--color-mist)] rounded-[20px] overflow-hidden divide-y divide-[var(--color-mist)]">
                {exchangeChats.map((ex: any) => {
                  const otherUsername = ex.R_USERNAME ?? ex.O_USERNAME;
                  const otherAvatar = ex.R_AVATAR ?? ex.O_AVATAR;
                  return (
                    <Link
                      key={ex.ID}
                      href={`/exchanges/${ex.ID}`}
                      className="flex items-center gap-4 p-4 hover:bg-[var(--color-fog)] transition"
                    >
                      <Avatar name={otherAvatar ?? otherUsername} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[14px] truncate">
                            {otherUsername}
                          </p>
                          <Badge tone="soft">
                            {exchangeStatusLabel(ex.STATUS)}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-[var(--color-slate)] truncate">
                          {ex.P_TITLE}
                        </p>
                      </div>
                      <span className="text-[11px] text-[var(--color-slate)] shrink-0">
                        {timeAgo(ex.UPDATED_AT)}
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
