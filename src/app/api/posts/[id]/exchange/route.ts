import { NextResponse } from "next/server";
import { posts, exchanges } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id: postId } = await params;
  const post = await posts.findById(postId, { id: me.id });
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

  const existing = await exchanges.findForRequester(postId, me.id);
  if (existing) {
    return NextResponse.json({ exchange: existing });
  }

  const exchange = await exchanges.create(postId, me.id);
  return NextResponse.json({ exchange });
}
