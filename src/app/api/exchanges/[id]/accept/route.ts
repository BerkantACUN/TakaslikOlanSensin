import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const ex = await prisma.exchange.findUnique({
    where: { id },
    include: { post: true },
  });
  if (!ex) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (ex.post.ownerId !== me.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (ex.status !== "PENDING") {
    return NextResponse.json({ error: "Beklemede değil" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const e = await tx.exchange.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
    await tx.post.update({
      where: { id: ex.post.id },
      data: { status: "RESERVED" },
    });
    // Diğer pending teklifleri pasifleştir
    await tx.exchange.updateMany({
      where: {
        postId: ex.post.id,
        status: "PENDING",
        id: { not: id },
      },
      data: { status: "REJECTED" },
    });
    return e;
  });

  return NextResponse.json({ exchange: updated });
}
