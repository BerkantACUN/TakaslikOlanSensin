import { NextResponse } from "next/server";
import { z } from "zod";
import { reports } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";

const REASONS = [
  "SPAM",
  "INAPPROPRIATE",
  "FRAUD",
  "HARASSMENT",
  "OTHER",
] as const;

const schema = z.object({
  targetType: z.string().min(1).max(20),
  targetId: z.string().min(1),
  reportedUserId: z.string().optional().nullable(),
  reason: z.enum(REASONS),
  details: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  await reports.create({
    reporterId: me.id,
    reportedUserId: parsed.data.reportedUserId || null,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
  });

  return NextResponse.json({ ok: true });
}
