import { NextResponse } from "next/server";
import { z } from "zod";
import { exchanges } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ content: z.string().min(1).max(2000) });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const ex = await exchanges.findById(id);
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.requesterId !== me.id && ex.post.ownerId !== me.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const messages = await exchanges.listMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz mesaj" }, { status: 400 });
  }

  const ex = await exchanges.findById(id);
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.requesterId !== me.id && ex.post.ownerId !== me.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!["ACCEPTED", "COMPLETED"].includes(ex.status)) {
    return NextResponse.json(
      { error: "Mesajlaşma sadece onaylı takaslarda açılır" },
      { status: 400 },
    );
  }

  const message = await exchanges.addMessage(id, me.id, parsed.data.content);
  return NextResponse.json({ message });
}
