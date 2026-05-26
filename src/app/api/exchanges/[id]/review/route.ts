import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
});

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
    return NextResponse.json({ error: "Geçersiz puan" }, { status: 400 });
  }

  const ex = await prisma.exchange.findUnique({
    where: { id },
    include: { post: true },
  });
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Sadece tamamlanmış takaslar için değerlendirme yapılır" },
      { status: 400 },
    );
  }

  const participants = [ex.requesterId, ex.post.ownerId];
  if (!participants.includes(me.id)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const revieweeId =
    me.id === ex.requesterId ? ex.post.ownerId : ex.requesterId;

  const existing = await prisma.review.findUnique({
    where: { exchangeId_reviewerId: { exchangeId: id, reviewerId: me.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu takas için zaten değerlendirme yaptın" },
      { status: 409 },
    );
  }

  const review = await prisma.review.create({
    data: {
      exchangeId: id,
      reviewerId: me.id,
      revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ review });
}
