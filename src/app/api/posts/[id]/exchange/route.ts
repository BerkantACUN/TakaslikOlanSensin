import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id: postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
  if (post.ownerId === me.id) {
    return NextResponse.json(
      { error: "Kendi ilanına teklif gönderemezsin" },
      { status: 400 },
    );
  }
  if (post.status !== "ACTIVE") {
    return NextResponse.json({ error: "İlan kapalı" }, { status: 400 });
  }

  const existing = await prisma.exchange.findUnique({
    where: { postId_requesterId: { postId, requesterId: me.id } },
  });
  if (existing) {
    return NextResponse.json({ exchange: existing });
  }

  const exchange = await prisma.exchange.create({
    data: { postId, requesterId: me.id },
  });

  return NextResponse.json({ exchange });
}
