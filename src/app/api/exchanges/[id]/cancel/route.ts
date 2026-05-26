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
  const canCancel = ex.requesterId === me.id || ex.post.ownerId === me.id;
  if (!canCancel) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }
  if (!["PENDING", "ACCEPTED"].includes(ex.status)) {
    return NextResponse.json(
      { error: "Bu durumda iptal edilemez" },
      { status: 400 },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const e = await tx.exchange.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    if (ex.status === "ACCEPTED") {
      // İlanı tekrar aktif et
      await tx.post.update({
        where: { id: ex.post.id },
        data: { status: "ACTIVE" },
      });
    }
    return e;
  });

  return NextResponse.json({ exchange: updated });
}
