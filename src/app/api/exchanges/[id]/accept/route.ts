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
  const ex = await exchanges.accept(id, me.id);
  if (!ex) {
    return NextResponse.json(
      { error: "İşlem yapılamadı (yetkisiz veya durum değişti)" },
      { status: 400 },
    );
  }
  return NextResponse.json({ exchange: ex });
}
