import { NextResponse } from "next/server";
import { z } from "zod";
import { dm } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ content: z.string().min(1).max(2000) });

async function authorize(conversationId: string, meId: string) {
  const c = await dm.findById(conversationId);
  if (!c) return null;
  if (c.userAId !== meId && c.userBId !== meId) return null;
  return c;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const convo = await authorize(id, me.id);
  if (!convo) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const messages = await dm.listMessages(id);
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

  const convo = await authorize(id, me.id);
  if (!convo) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const message = await dm.addMessage(id, me.id, parsed.data.content);
  return NextResponse.json({ message });
}
