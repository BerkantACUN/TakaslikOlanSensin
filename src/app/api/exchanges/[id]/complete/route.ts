import { NextResponse } from "next/server";
import { exchanges } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const ok = await exchanges.complete(id, me.id);
  if (!ok) {
    return NextResponse.json({ error: "Tamamlanamadı" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
