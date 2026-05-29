import { NextResponse } from "next/server";
import { z } from "zod";
import { dm, users } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const rows = await dm.listForUser(me.id);
  const conversations = rows.map((c: any) => {
    const isA = c.USER_A_ID === me.id;
    return {
      id: c.ID,
      other: {
        id: isA ? c.USER_B_ID : c.USER_A_ID,
        username: isA ? c.B_USERNAME : c.A_USERNAME,
        avatarName: isA ? c.B_AVATAR : c.A_AVATAR,
      },
      lastMessageAt: c.LAST_MESSAGE_AT,
      lastMessage: c.LAST_CONTENT
        ? { content: c.LAST_CONTENT, senderId: c.LAST_SENDER }
        : null,
    };
  });
  return NextResponse.json({ conversations });
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
  const other = await users.findById(otherId);
  if (!other) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  const convo = await dm.getOrCreate(me.id, otherId);
  return NextResponse.json({ conversation: { id: convo.id } });
}
