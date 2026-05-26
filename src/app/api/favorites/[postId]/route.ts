import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (post.ownerId === me.id) {
    return NextResponse.json(
      { error: "Kendi ilanını favorileyemezsin" },
      { status: 400 },
    );
  }

  await prisma.favorite.upsert({
    where: { userId_postId: { userId: me.id, postId } },
    update: {},
    create: { userId: me.id, postId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { postId } = await params;
  await prisma.favorite
    .delete({ where: { userId_postId: { userId: me.id, postId } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
