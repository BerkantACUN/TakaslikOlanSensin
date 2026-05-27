import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { DMChat } from "./DMChat";

export const dynamic = "force-dynamic";

export default async function DMPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!convo) return notFound();
  if (convo.userAId !== me.id && convo.userBId !== me.id) return notFound();

  const other = convo.userAId === me.id ? convo.userB : convo.userA;

  return (
    <div className="page-container py-6 md:py-8 max-w-2xl">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-3"
      >
        <Icon.ArrowLeft size={14} /> Mesajlar
      </Link>

      <div className="bg-white border border-[var(--color-mist)] rounded-[24px] overflow-hidden">
        <Link
          href={`/profile/${other.id}`}
          className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-mist)] hover:bg-[var(--color-fog)] transition"
        >
          <Avatar name={other.avatarName ?? other.username} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[15px] truncate">
              {other.avatarName ?? other.username}
            </p>
            <p className="text-[12px] text-[var(--color-slate)] truncate">
              @{other.username}
            </p>
          </div>
          <Icon.ArrowRight size={16} className="text-[var(--color-slate)]" />
        </Link>

        <DMChat
          conversationId={convo.id}
          me={{
            id: me.id,
            username: me.username,
            avatarName: me.avatarName ?? null,
          }}
          other={{
            id: other.id,
            username: other.username,
            avatarName: other.avatarName,
          }}
          initial={convo.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt,
          }))}
        />
      </div>
    </div>
  );
}
