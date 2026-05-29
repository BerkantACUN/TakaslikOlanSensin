import { NextResponse } from "next/server";
import { posts } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const me = await getCurrentUser();
  const post = await posts.findById(id, me ? { id: me.id } : null);
  if (!post) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const ok = await posts.delete(id, me.id);
  if (!ok) {
    return NextResponse.json({ error: "Yetkisiz veya bulunamadı" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
