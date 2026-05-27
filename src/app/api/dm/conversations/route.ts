import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/dm";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, username: true, avatarName: true } },
      userB: { select: { id: true, username: true, avatarName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const result = convos.map((c) => {
    const other = c.userAId === me.id ? c.userB : c.userA;
    return {
      id: c.id,
      other,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            senderId: c.messages[0].senderId,
            createdAt: c.messages[0].createdAt,
          }
        : null,
    };
  });

  return NextResponse.json({ conversations: result });
}

const schema = z.object({ otherUserId: z.string().min(1) });

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const otherId = parsed.data.otherUserId;
  if (otherId === me.id) {
    return NextResponse.json(
      { error: "Kendine mesaj gönderemezsin" },
      { status: 400 },
    );
  }

  const other = await prisma.user.findUnique({ where: { id: otherId } });
  if (!other) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const convo = await getOrCreateConversation(me.id, otherId);
  return NextResponse.json({ conversation: { id: convo.id } });
}
