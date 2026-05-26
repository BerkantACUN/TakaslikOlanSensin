import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const ex = await prisma.exchange.findUnique({
    where: { id },
    include: { post: { select: { ownerId: true } } },
  });
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.requesterId !== me.id && ex.post.ownerId !== me.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const messages = await prisma.exchangeMessage.findMany({
    where: { exchangeId: id },
    orderBy: { messageNo: "asc" },
  });

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

  const ex = await prisma.exchange.findUnique({
    where: { id },
    include: { post: { select: { ownerId: true } } },
  });
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.requesterId !== me.id && ex.post.ownerId !== me.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!["ACCEPTED", "COMPLETED"].includes(ex.status)) {
    return NextResponse.json(
      { error: "Mesajlaşma kabul edilmiş takaslarda açılır" },
      { status: 400 },
    );
  }

  // ExchangeMessage zayıf varlık — composite key (exchangeId, messageNo)
  const message = await prisma.$transaction(async (tx) => {
    const last = await tx.exchangeMessage.findFirst({
      where: { exchangeId: id },
      orderBy: { messageNo: "desc" },
      select: { messageNo: true },
    });
    const nextNo = (last?.messageNo ?? 0) + 1;

    const m = await tx.exchangeMessage.create({
      data: {
        exchangeId: id,
        messageNo: nextNo,
        senderId: me.id,
        content: parsed.data.content,
      },
    });

    await tx.exchange.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return m;
  });

  return NextResponse.json({ message });
}
