import { NextResponse } from "next/server";
import { favorites, posts } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { postId } = await params;
  const post = await posts.findById(postId, { id: me.id });
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (post.ownerId === me.id) {
    return NextResponse.json(
      { error: "Kendi ilanını favorileyemezsin" },
      { status: 400 },
    );
  }
  await favorites.add(me.id, postId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { postId } = await params;
  await favorites.remove(me.id, postId);
  return NextResponse.json({ ok: true });
}
