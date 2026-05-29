import { NextResponse } from "next/server";
import { z } from "zod";
import { exchanges } from "@/lib/repo";
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

  const r = await exchanges.addReview(
    id,
    me.id,
    parsed.data.rating,
    parsed.data.comment ?? null,
  );
  if (!r.ok) {
    return NextResponse.json({ error: r.error ?? "Hata" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
