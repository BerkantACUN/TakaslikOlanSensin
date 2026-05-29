import Link from "next/link";
import { exchanges } from "@/lib/repo";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { exchangeStatusLabel, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "incoming" | "outgoing";

export default async function ExchangesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: Tab }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const tab: Tab = sp.tab === "outgoing" ? "outgoing" : "incoming";

  const [incoming, outgoing] = await Promise.all([
    exchanges.incoming(me.id),
    exchanges.outgoing(me.id),
  ]);

  const rows = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="page-container py-8 md:py-10">
      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Takaslarım
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-6">
        Gönderdiğin ve sana gelen takas tekliflerini yönet.
      </p>

      <div className="flex gap-2 mb-6">
        <TabLink href="/exchanges?tab=incoming" active={tab === "incoming"}>
          Bana gelen ({incoming.length})
        </TabLink>
        <TabLink href="/exchanges?tab=outgoing" active={tab === "outgoing"}>
          Gönderdiklerim ({outgoing.length})
        </TabLink>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Icon.MessageCircle />}
          title={
            tab === "incoming"
              ? "Henüz teklif almadın"
              : "Henüz teklif göndermedin"
          }
          description={
            tab === "incoming"
              ? "İlanların yayınlandığında diğer kullanıcılar takas teklifi gönderebilir."
              : "Beğendiğin bir ilana göz at ve takas teklifi gönder."
          }
          action={
            <Link href="/posts">
              <Button variant="outline">
                İlanlara göz at <Icon.ArrowRight size={14} />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((ex: any) => {
            const isIncoming = tab === "incoming";
            const otherId = isIncoming ? ex.R_ID : ex.O_ID;
            const otherUsername = isIncoming ? ex.R_USERNAME : ex.O_USERNAME;
            const otherAvatar = isIncoming ? ex.R_AVATAR : ex.O_AVATAR;
            return (
              <Link
                key={ex.ID}
                href={`/exchanges/${ex.ID}`}
                className="group bg-white border border-[var(--color-mist)] rounded-[16px] p-4 flex items-center gap-4 hover:border-[var(--color-carbon)] transition"
              >
                <Avatar name={otherAvatar ?? otherUsername} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[14px] truncate">
                      {ex.P_TITLE}
                    </p>
                    <Badge tone={statusTone(ex.STATUS)}>
                      {exchangeStatusLabel(ex.STATUS)}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[var(--color-slate)] mt-0.5">
                    {isIncoming
                      ? `${otherUsername} teklif etti`
                      : `${otherUsername} ile`}
                    {" · "}
                    {timeAgo(ex.CREATED_AT)}
                  </p>
                </div>
                <Icon.ArrowRight className="text-[var(--color-slate)] group-hover:text-[var(--color-carbon)] transition" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabLink({
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
        "inline-flex items-center h-10 px-4 rounded-[12px] text-[13px] font-semibold transition " +
        (active
          ? "bg-[var(--color-carbon)] text-white"
          : "bg-white text-[var(--color-carbon)] border border-[var(--color-pebble)] hover:border-[var(--color-carbon)]")
      }
    >
      {children}
    </Link>
  );
}

function statusTone(
  s: string,
): "soft" | "brand" | "success" | "warning" | "danger" {
  switch (s) {
    case "ACCEPTED":
      return "brand";
    case "COMPLETED":
      return "success";
    case "REJECTED":
      return "danger";
    case "CANCELLED":
      return "warning";
    default:
      return "soft";
  }
}
